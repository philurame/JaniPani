//-----------------------------------------------------------
// Lesson / Review Button
//-----------------------------------------------------------
function LessonReviewButtonClick(is_lesson) {
  isInQuestion = 1 - is_lesson;
  showSection("game-section");
  if ((isLesson !== is_lesson) || !currentQuestion) {
    isLesson = is_lesson;
    showNewQuestion();
  }
  isLesson = is_lesson;

  document.getElementById("submit-answer").textContent = isInQuestion ? "Submit" : "Next";
  document.getElementById("SwitchLessonButton").textContent = isLesson ? "Switch to Reviews" : "Switch to Lessons";

  check_using_mobile();
};

function NoLessonsReviews() {
  document.getElementById("game-section").classList.add("hidden");
  showSection("no-lesson-section");
  if (isLesson) {
    document.getElementById("next-in").innerHTML = "No active lessons! Do more reviews!";
  } else {
    const [next_review_sec, h] = _get_next_review_sec();
    document.getElementById("next-in").innerHTML = "Next review of " + `<span style='color:var(--color-primary)'>${h.symbol}</span>`  + " in <span style='color:var(--color-primary)'>" + Math.round(next_review_sec / 60) + "</span>" + " minutes";
  }
}

function switch_review_order() {
  if (reviewOrder === 'random') {
    reviewOrder = 'asc';
    document.getElementById("reorder").textContent = "↻";
  }
  else if (reviewOrder === 'asc') {
    reviewOrder = 'random';
    document.getElementById("reorder").textContent = "↺";
  }
  if (document.getElementById("feedback").textContent) {submitClick();}
  showNewQuestion();
}


//-----------------------------------------------------------
// SHOWS A NEW HIEROGLYPH
//-----------------------------------------------------------
function showNewQuestion() {
  if (!document.getElementById("try-again").classList.contains("hidden")) {
    document.getElementById("try-again").classList.add("hidden");
  }

  // filter hieroglyphs based on ProgressLevel etc
  _filterHieroglyphs();

  // Pick a hieroglyph and question type for lesson or review:
  const is_sampled = sampleQuestion(filteredHieroglyphs);

  if (!is_sampled) {
    NoLessonsReviews();
    return false;
  }
    
  // Display the hieroglyph or image
  _showHieroglyph("symbol-display", currentQuestion);
  
  document.getElementById("answer-input").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-primary)";
  document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'none');

  // Display question text
  document.getElementById("question-text").textContent = isLesson ? "📚 check Info!" : (questionType.toLowerCase() === 'meaning') ? '意味 (meaning)' : '読み方 (reading)';

  if (isLesson) {
    document.getElementById("answer-input").classList.add("hidden");
    if (!document.getElementById("reorder").classList.contains("hidden")) {
      document.getElementById("reorder").classList.add("hidden");
    }
  } else {
    if (document.getElementById("reorder").classList.contains("hidden")) {
      document.getElementById("reorder").classList.remove("hidden");
    }
    if (document.getElementById("answer-input").classList.contains("hidden")) {
      document.getElementById("answer-input").classList.remove("hidden"); 
      if (window.innerWidth >= 768) document.getElementById("answer-input").focus();
    }
  }

  return true;
}

//-----------------------------------------------------------
// FILTERS HIEROGLYPHS AND SAMPLES currentQuestion HIEROGLYPH
//-----------------------------------------------------------
function sampleQuestion() {
  if (isLesson) {
    questionType = 'meaning';

    const h_not_learned = filteredHieroglyphs.filter(h => (h.progres_level[0] === -1 || h.progres_level[1] === -1));

    // cover the previous level first!
    h_not_learned.sort((a, b) => a.level - b.level);

    for (const hieroglyph of h_not_learned) {
      if (hieroglyph.hieroglyph_type === HieroglyphType.RADICAL) {
        currentQuestion = hieroglyph;
        return true;
      }
      else if ((hieroglyph.hieroglyph_type === HieroglyphType.KANJI)
        && is_rads_compounds_learned(hieroglyph)
      ) {
        currentQuestion = hieroglyph;
        return true;
      }
      else if ((hieroglyph.hieroglyph_type === HieroglyphType.VOCAB)
        && is_kanji_compounds_learned(hieroglyph)
      ) {
        currentQuestion = hieroglyph;
        return true;
      }
    }
    // all hieroglyphs have been learned so only review mode is avaliable!
    return false;
  }

  // Review mode: sample random hieroglyph:
  const order = [HieroglyphType.RADICAL, HieroglyphType.KANJI, HieroglyphType.VOCAB];
  const sample_hieroglyphs = filteredHieroglyphs.filter(h => h.progres_level[0] > -1).sort((a, b) => order.indexOf(a.hieroglyph_type) - order.indexOf(b.hieroglyph_type));
  if (sample_hieroglyphs.length === 0) {return false;}
  const idx = (reviewOrder === 'random') ? Math.floor(Math.random() * sample_hieroglyphs.length) : 0;
  currentQuestion = sample_hieroglyphs[idx];
  if (currentQuestion.hieroglyph_type === HieroglyphType.RADICAL || 
    current_timestamp - currentQuestion.progres_timestamp[1] < SecToReview[currentQuestion.progres_level[1]]) {
    questionType = 'meaning';
  }
  else if (current_timestamp - currentQuestion.progres_timestamp[0] < SecToReview[currentQuestion.progres_level[0]]) {
    questionType = 'reading';
  }
  else {questionType = (Math.random() < 0.5) ? 'meaning' : 'reading';}
  return true;
}
 
//-----------------------------------------------------------
// SUBMIT / NEXT BUTTON: CHECKS USER ANSWER AND UPDATES PROGRESS
//-----------------------------------------------------------
function submitClick() {
  if (isLesson) {
    _update_progress(true, true);
    showNewQuestion();
    return;
  }

  if (!isInQuestion) {
    is_sampled = showNewQuestion();
    if (is_sampled) {
      isInQuestion = true;
      document.getElementById("submit-answer").textContent = "Submit";
    }
    return;
  }
  
  const userAnswer = document.getElementById("answer-input").value.trim();
  
  let correct = false;
  let half_correct = false;
  let possibleAnswers = [];

  if (questionType === 'meaning') {
    possibleAnswers = currentQuestion.meanings;
  } else {
    if (currentQuestion.hieroglyph_type === HieroglyphType.KANJI) {
      if (currentQuestion.readings.main_reading === 'onyomi') {
        possibleAnswers = currentQuestion.readings.onyomi || [];
      } else {
        possibleAnswers = currentQuestion.readings.kunyomi || [];
      }
    }
    else if (currentQuestion.hieroglyph_type === HieroglyphType.VOCAB) {
      possibleAnswers = currentQuestion.readings.vocab || [];
    }
  }

  let softPossibleAnswers = [];
  softPossibleAnswers = softPossibleAnswers.concat(currentQuestion.meanings);
  softPossibleAnswers = softPossibleAnswers.concat(currentQuestion.meanings.map(ans => wanakana.toHiragana(ans)));
  softPossibleAnswers = softPossibleAnswers.concat(currentQuestion.readings.kunyomi || []);
  softPossibleAnswers = softPossibleAnswers.concat(currentQuestion.readings.onyomi || []);
  softPossibleAnswers = softPossibleAnswers.concat(currentQuestion.readings.vocab || []);
  softPossibleAnswers = softPossibleAnswers.map(ans => ans.toLowerCase());
  
  let userAnswerLower = userAnswer.toLowerCase();
  if (questionType === 'reading') {
    const last_letter = userAnswerLower[userAnswerLower.length-1];
    switch (last_letter) {
      case 'a': userAnswerLower = userAnswerLower.slice(0, -1) + 'あ'; break;
      case 'i': userAnswerLower = userAnswerLower.slice(0, -1) + 'い'; break;
      case 'u': userAnswerLower = userAnswerLower.slice(0, -1) + 'う'; break;
      case 'e': userAnswerLower = userAnswerLower.slice(0, -1) + 'え'; break;
      case 'o': userAnswerLower = userAnswerLower.slice(0, -1) + 'お'; break;
      case 'n': userAnswerLower = userAnswerLower.slice(0, -1) + 'ん'; break;
    }
    document.getElementById("answer-input").value = userAnswerLower;
  }

  possibleAnswers = possibleAnswers.map(ans => ans.toLowerCase());
  for (let i = 0; i < possibleAnswers.length; i++) {
    const possible_answer = possibleAnswers[i];
    const levenstain_maxd = (possible_answer.length <= 3 || questionType === 'reading') ? 0 : 1;
    if (damerauLevenshteinDistance(possible_answer, userAnswerLower) <= levenstain_maxd) {correct = true;}
  }
  if (userAnswerLower === '§') {correct = true;}
  if (!correct && (softPossibleAnswers.includes(userAnswerLower) || softPossibleAnswers.includes(wanakana.toHiragana(userAnswerLower)))) {
    half_correct = true;
  }

  // update progress
  _update_progress(correct, half_correct);

  // FEEDBACK
  _displayFeedback(correct, half_correct);

  if (!correct && !half_correct) {
    document.getElementById("try-again").classList.remove("hidden");
    document.getElementById("reorder").classList.add("hidden");
  }
  
  if (correct || !half_correct) {
    isInQuestion = false;
    document.getElementById("submit-answer").textContent = "Next";
  }
}

function tryAgain() {
  // give me my progress back! (and try again)
  isInQuestion = true;

  currentQuestion.progres_level     = prevLvls;
  currentQuestion.progres_timestamp = prevTimestamps;
  saveProgressToLocalStorage();

  document.getElementById("feedback").textContent = "";
  document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-primary)";
  document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'none');
  document.getElementById("question-text").textContent = (questionType.toLowerCase() === 'meaning') ? '意味 (meaning)' : '読み方 (reading)';
  document.getElementById("answer-input").value = "";
  if (window.innerWidth >= 768) document.getElementById("answer-input").focus();
  document.getElementById("submit-answer").textContent = "Submit";
  document.getElementById("try-again").classList.add("hidden");
  document.getElementById("reorder").classList.remove("hidden");
}

  

// ---------------------------------------
// Review Utils
// ---------------------------------------
function _update_progress(is_correct, is_half_correct) {  
  if (!is_correct && is_half_correct && !isLesson) {
    return;
  }

  prevLvls = currentQuestion.progres_level.slice();
  prevTimestamps = currentQuestion.progres_timestamp.slice();

  // update levels
  const progres_level_idx = (questionType === 'meaning') ? 0 : 1;
  currentQuestion.progres_level[progres_level_idx] += is_correct ? 1 : (currentQuestion.progres_level[progres_level_idx]<5 ? -1: -2);
  currentQuestion.progres_level[progres_level_idx] = Math.max(0, currentQuestion.progres_level[progres_level_idx]);
  currentQuestion.progres_level[progres_level_idx] = Math.min(9, currentQuestion.progres_level[progres_level_idx]);

  let sec_to_review = SecToReview[currentQuestion.progres_level[progres_level_idx]];
  sec_to_review = (sec_to_review === Infinity) ? 0 : sec_to_review;
  const random_sec_shift = Math.floor(Math.random() * sec_to_review * 0.2);

  currentQuestion.progres_timestamp[progres_level_idx] = Math.floor(Date.now()/1000) + random_sec_shift;

  if (currentQuestion.hieroglyph_type === HieroglyphType.RADICAL || isLesson) {
    currentQuestion.progres_level[1-progres_level_idx] = currentQuestion.progres_level[progres_level_idx];
    currentQuestion.progres_timestamp[1-progres_level_idx] = currentQuestion.progres_timestamp[progres_level_idx];
    if (isLesson) {currentQuestion.progres_level = [0, 0];} 
  }

  saveProgressToLocalStorage();
  _update_progress_level();
}

function is_rads_compounds_learned(kanji) {
  // check if all rads-components have been learned:
  for (let i = 0; i < kanji.resource_paths.radical_links.length; i++) {
    const radical_link = kanji.resource_paths.radical_links[i];
    const progres = DB.hieroglyphs[LinkIdx[radical_link]].progres_level;
    if (progres[0] < getRadKanjiLessonLevel() || progres[1] < getRadKanjiLessonLevel()) {return false;}
  }
  return true;
}

function is_kanji_compounds_learned(vocab) {
  // check if all kanji-components have been learned:
  for (let i = 0; i < vocab.resource_paths.kanji_links.length; i++) {
    const kanji_link = vocab.resource_paths.kanji_links[i];
    const progres = DB.hieroglyphs[LinkIdx[kanji_link]].progres_level;
    if (progres[0] < getKanjiVocabLessonLevel() || progres[1] < getKanjiVocabLessonLevel()) {return false;}
  }
  return true;
}

function _filterHieroglyphs() {
  // filter all hieroglyphs of lvl up to ProgressLevel if their progress level < 9,
  // which are ready for review or their progress level is -1:
  current_timestamp = Math.floor(Date.now() / 1000);
  filteredHieroglyphs =  DB.hieroglyphs.filter(h => (
    (h.level <= ProgressLevel) && (h.progres_level[0] < 9 || h.progres_level[1] < 9) &&
    (
      h.progres_timestamp[0] === -1 || h.progres_timestamp[1] === -1 ||
      current_timestamp - h.progres_timestamp[0] > SecToReview[h.progres_level[0]] || 
      current_timestamp - h.progres_timestamp[1] > SecToReview[h.progres_level[1]]
    )
  ));
}

function _get_next_review_sec() {
  const filteredHieroglyphs =  DB.hieroglyphs.filter(h => ((h.level <= ProgressLevel)));
  const next_review_h = filteredHieroglyphs.reduce((a, b) => {
    const a_meaning = a.progres_timestamp[0] + SecToReview[a.progres_level[0]];
    const b_meaning = b.progres_timestamp[0] + SecToReview[b.progres_level[0]];
    const a_reading = a.progres_timestamp[1] + SecToReview[a.progres_level[1]];
    const b_reading = b.progres_timestamp[1] + SecToReview[b.progres_level[1]];
    return Math.min(a_meaning, a_reading) < Math.min(b_meaning, b_reading) ? a : b;
  })
  current_timestamp = Math.floor(Date.now() / 1000);
  const t_next_review_meaning = next_review_h.progres_timestamp[0]+SecToReview[next_review_h.progres_level[0]] - current_timestamp;
  const t_next_review_reading = next_review_h.progres_timestamp[1]+SecToReview[next_review_h.progres_level[1]] - current_timestamp;
  
  return [Math.min(t_next_review_meaning, t_next_review_reading), next_review_h];
}

function _showHieroglyph(placeholder, h) {
  const is_info = placeholder === "detail-symbol";
  const symbolField = document.getElementById(placeholder);
  symbolField.classList.remove("radical", "kanji", "vocab");
  symbolField.classList.remove("radical-info", "kanji-info", "vocab-info");
  if (h.hieroglyph_type === HieroglyphType.RADICAL) {
    symbolField.classList.add(is_info ? 'radical-info' : "radical");
  } else if (h.hieroglyph_type === HieroglyphType.KANJI) {
    symbolField.classList.add(is_info ? 'kanji-info' : "kanji");
  } else if (h.hieroglyph_type === HieroglyphType.VOCAB) {
    symbolField.classList.add(is_info ? 'vocab-info' : "vocab");
  }
  if (!h.symbol) {
    symbolField.innerHTML = `<img src="${h.resource_paths.pic}" alt="Image for radical" style="max-width: ${is_info?60:80}%; height: auto;">`;
  } else {
    symbolField.textContent = h.symbol.toUpperCase();
    // use font
    symbolField.style.fontFamily = 'meiryo';
    switch (symbolField.textContent.length) {
      case 1:
        symbolField.style.fontSize = is_info ? '6em' : '10em';
      break;
      case 2:
        symbolField.style.fontSize = is_info ? '5em' : '8em';
      break;
      case 3:
        symbolField.style.fontSize = is_info ? '4em' : '6em';
      break;
      default:
        symbolField.style.fontSize = ((is_info ? 12 : 16)/symbolField.textContent.length).toFixed(0)+'em';
    }
  }
}

function _update_progress_level() {
  ProgressLevel = Math.min(ProgressLevel, 60);
  if (ProgressLevel === 60) {return;}

  // check if progress level can be updated
  // all of radical should be >= NextLevelRadical
  // NextProgressKanjiShare of kanji should be >= NextProgressKanjiLevel
  const ProgressHieroglyphs = DB.hieroglyphs.filter(h => (h.level === ProgressLevel));
  let n_kanji_learned = 0;
  for (const hieroglyph of ProgressHieroglyphs) {
    switch (hieroglyph.hieroglyph_type) {
      case HieroglyphType.RADICAL: 
        if ( (ProgressLevel >= LowProgressEnd) && (hieroglyph.progres_level[0] < NextLevelRadical) ) {return;}
        break;
      case HieroglyphType.KANJI:
        if ( (hieroglyph.progres_level[0] >= getNextProgressKanji()) && (hieroglyph.progres_level[1] >= getNextProgressKanji()) ) {n_kanji_learned += 1;}
        break;
    }
  }
  if (n_kanji_learned < NextProgressKanjiShare * ProgressHieroglyphs.filter(h => h.hieroglyph_type === HieroglyphType.KANJI).length) {return;}
  ProgressLevel += 1;
}

function _displayFeedback(is_correct, is_half_correct) {
  // play sound if vocab reading + correct
  if (currentQuestion.hieroglyph_type === HieroglyphType.VOCAB && questionType === 'reading' && is_correct) {
    currentSoundPath = 'sounds/'+encodeURIComponent(currentQuestion.resource_paths.sound);
    _playSound(currentSoundPath);
  }
  
  // half correct feedback
  const feeDBackEl = document.getElementById("feedback");
  if (!is_correct && is_half_correct) {
    if (questionType === 'reading') {
      let main_reading = currentQuestion.readings.main_reading;
      main_reading = main_reading ? main_reading[0].toUpperCase() + main_reading.slice(1) + ' r' : 'R';
      feeDBackEl.textContent = `Almost! ${main_reading}eading expected`;
    } else {
      feeDBackEl.textContent = "Almost! Meaning expected";
    }
    feeDBackEl.style.color = "var(--color-blue)";
    return;
  }
  
  // correct/incorrect feedback
  if (is_correct) {
    feeDBackEl.textContent = "Correct! New progress level: " + HieroglyphProgress[currentQuestion.progres_level[(questionType === "meaning") ? 0 : 1]];
  } else {
    feeDBackEl.textContent = "Incorrect! Gambarimasu!";
  }
  feeDBackEl.style.color = is_correct ? "var(--color-correct)" : "var(--color-incorrect)";

  document.getElementById("answer-input").style.borderBottom = is_correct ? "2px solid var(--color-correct)" : "2px solid var(--color-incorrect)";

  if (window.innerWidth >= 768) {
    document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'flex');
    document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.backgroundColor = 'var(--color-'+(is_correct ? 'correct)' : 'incorrect)'));
    document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.textContent = is_correct ? '⛩️正しい⛩️' : '🌋正しくない🌋');
  }
}