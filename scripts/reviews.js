//-----------------------------------------------------------
// Review Button
//-----------------------------------------------------------
function reviewClick() {
  isInLesson = 0;
  isInReview = 1;
  showSection("review-section");
  showNewReview();
  check_using_mobile();
}

//-----------------------------------------------------------
// SHOWS A NEW HIEROGLYPH
//-----------------------------------------------------------
function showNewReview() {
  if (document.getElementById("reorder").classList.contains("hidden")) document.getElementById("reorder").classList.remove("hidden");
  if (document.getElementById("review-progress").classList.contains("hidden")) document.getElementById("review-progress").classList.remove("hidden");
  if (!document.getElementById("judge-answer").classList.contains("hidden")) document.getElementById("judge-answer").classList.add("hidden");
  if (!document.getElementById("show-info-page").classList.contains("hidden")) document.getElementById("show-info-page").classList.add("hidden");

  const n_meanings = filteredHieroglyphs.filter(h => (
    (h.progres_level[0] > -1 && h.progres_level[1] > -1) && 
    (current_timestamp - h.progres_timestamp[0] > SecToReview[h.progres_level[0]])
  )).length;
  const n_readings = filteredHieroglyphs.filter(h => (
    (h.progres_level[0] > -1 && h.progres_level[1] > -1) && 
    (current_timestamp - h.progres_timestamp[1] > SecToReview[h.progres_level[1]])
  )).length;
  document.getElementById("review-progress").textContent = n_meanings + n_readings + " to review";

  

  // filter hieroglyphs based on ProgressLevel etc
  filterHieroglyphs();

  // Pick a hieroglyph and question type for lesson or review:
  const is_sampled = _sampleQuestion(filteredHieroglyphs);

  if (!is_sampled) {
    NoReviews();
    return false;
  }
    
  // Display the hieroglyph or image
  showHieroglyph("review-symbol-display", currentQuestion);
  
  document.getElementById("answer-input").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-primary)";
  document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'none');

  // Display question text
  document.getElementById("question-text").textContent = (questionType.toLowerCase() === 'meaning') ? '意味 (meaning)' : '読み方 (reading)';

  if (document.getElementById("reorder").classList.contains("hidden")) {
    document.getElementById("reorder").classList.remove("hidden");
  }
  if (document.getElementById("answer-input").classList.contains("hidden")) {
    document.getElementById("answer-input").classList.remove("hidden"); 
    if (window.innerWidth >= 768) document.getElementById("answer-input").focus();
  }
  return true;
}
 
//-----------------------------------------------------------
// SUBMIT: CHECKS USER ANSWER AND GIVES FEEDBACK
//-----------------------------------------------------------
function submitClick() {
  const userAnswer = document.getElementById("answer-input").value.trim();
  is_correct_review = false;
  is_half_correct_review = false;

  let possibleAnswers;
  if (questionType === 'meaning') {
    possibleAnswers = currentQuestion.meanings;
  } else if (currentQuestion.hieroglyph_type === HieroglyphType.KANJI) {
    possibleAnswers = currentQuestion.readings[currentQuestion.readings.main_reading === 'onyomi' ? 'onyomi' : 'kunyomi'] || [];
  } else if (currentQuestion.hieroglyph_type === HieroglyphType.VOCAB) {
    possibleAnswers = currentQuestion.readings.vocab || [];
  } else {
    possibleAnswers = [];
  }

  // makes softPossibleAnswers.concat
  const softPossibleAnswers = [
    ...currentQuestion.meanings,
    ...currentQuestion.meanings.map(ans => wanakana.toHiragana(ans)),
    ...(currentQuestion.readings.kunyomi || []),
    ...(currentQuestion.readings.onyomi || []),
    ...(currentQuestion.readings.vocab || [])
  ].map(ans => ans.toLowerCase());

  let userAnswerLower = userAnswer.toLowerCase();
  if (questionType === 'reading' && userAnswerLower.length > 0) {
    const last = userAnswerLower.slice(-1);
    const romToHira = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お', n: 'ん' };
    if (last in romToHira) {
      userAnswerLower = userAnswerLower.slice(0, -1) + romToHira[last];
    }
    document.getElementById("answer-input").value = userAnswerLower;
  }

  possibleAnswers = possibleAnswers.map(ans => ans.toLowerCase());

  let minDistance = Infinity;
  let closestAnsw = null;
  for (const possible_answer of possibleAnswers) {
    const dist = damerauLevenshteinDistance(possible_answer, userAnswerLower);
    const levenstain_maxd = (possible_answer.length <= 3 || questionType === 'reading') ? 0 : 1;
    if (dist <= levenstain_maxd) is_correct_review = true;
    if (dist < minDistance) {
      minDistance = dist;
      closestAnsw = possible_answer;
    }
  }

  if (userAnswerLower === '§') {is_correct_review = true;}
  if (!is_correct_review && (softPossibleAnswers.includes(userAnswerLower) || softPossibleAnswers.includes(wanakana.toHiragana(userAnswerLower)))) {
    is_half_correct_review = true;
  }

  _displayFeedback(minDistance, closestAnsw);

  document.getElementById("reorder").classList.add("hidden");
  document.getElementById("review-progress").classList.add("hidden");
  document.getElementById("show-info-page").classList.remove("hidden");
  document.getElementById("judge-answer").classList.remove("hidden");

  if (currentQuestion.progres_level[(questionType === 'meaning') ? 0 : 1] == 8) {
    document.getElementById("judge-easy").textContent = "Burn🔥";
    document.getElementById("judge-easy").style.backgroundColor = "var(--color-black)";
    document.getElementById("judge-easy").style.border = "2px solid var(--color-purple)";
  }
  else {
    document.getElementById("judge-easy").textContent = "Easy";
    document.getElementById("judge-easy").style.backgroundColor = "var(--color-purple)";
    document.getElementById("judge-easy").style.border = "";
  }
}

function NoReviews() {
  document.getElementById("review-section").classList.add("hidden");
  showSection("no-review-section");
  const [next_review_sec, h] = _get_next_review_sec();
  document.getElementById("next-in").innerHTML = "Next review of " + `<span style='color:var(--color-primary)'>${h.symbol}</span>`  + " in <span style='color:var(--color-primary)'>" + Math.round(next_review_sec / 60) + "</span>" + " minutes";
}

//-----------------------------------------------------------
// JUDGE: UPDATES PROGRESS LEVEL OF CURRENT QUESTION
//-----------------------------------------------------------
function judgeClick(value) {
  const progres_level_idx = (questionType === 'meaning') ? 0 : 1;

  // no mistakes for Enlighted! even Good is not good enough to proceed!
  if (currentQuestion.progres_level[progres_level_idx] == 8) {value -= 1;}
  if (currentQuestion.progres_level[progres_level_idx] == 7 && value == 2) {value = 1;}

  currentQuestion.progres_level[progres_level_idx] += value;
  currentQuestion.progres_level[progres_level_idx] = Math.max(0, currentQuestion.progres_level[progres_level_idx]);
  currentQuestion.progres_level[progres_level_idx] = Math.min(9, currentQuestion.progres_level[progres_level_idx]);

  let sec_to_review = SecToReview[currentQuestion.progres_level[progres_level_idx]];
  sec_to_review = (sec_to_review === Infinity) ? 0 : sec_to_review;
  const random_sec_shift = Math.floor(Math.random() * sec_to_review * 0.4);
  currentQuestion.progres_timestamp[progres_level_idx] = Math.floor(Date.now()/1000) + random_sec_shift;

  if (currentQuestion.hieroglyph_type === HieroglyphType.RADICAL) {
    currentQuestion.progres_level[1-progres_level_idx] = currentQuestion.progres_level[progres_level_idx];
    currentQuestion.progres_timestamp[1-progres_level_idx] = currentQuestion.progres_timestamp[progres_level_idx];
  }
  saveProgressToLocalStorage();
  update_progress_level();
  showNewReview();
}

// ------------------------------------------
// CHANGE ORDER BETWEEN ASCENDING AND RANDOM
// ------------------------------------------
function reorderClick() {
  const shuffleIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shuffle" viewBox="0 0 16 16">' +
    '<path fill-rule="evenodd" stroke="currentColor" stroke-width="1" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"/>' +
    '<path stroke="currentColor" stroke-width="1" d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192"/>' +
    '</svg>';
  const arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 16 16">' +
    '<line x1="8" y1="14" x2="8" y2="4" />' +
    '<polyline points="4 8 8 4 12 8" />' +
    '</svg>';
  if (reviewOrder === 'random') {
    reviewOrder = 'asc';
    document.getElementById("reorder").innerHTML = 'reorder ' + arrowIcon;
  } else if (reviewOrder === 'asc') {
    reviewOrder = 'random';
    document.getElementById("reorder").innerHTML = 'reorder ' + shuffleIcon;
  }
  if (document.getElementById("feedback").textContent) {submitClick();}
  showNewReview();
}
  
// ---------------------------------------
// Review Utils
// ---------------------------------------
// samples currentQuestion HIEROGLYPH
function _sampleQuestion() {
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

// updates progress of currentQuestion
function _update_progress(is_correct, is_half_correct) {  
  if (!is_correct && is_half_correct) {
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
  const random_sec_shift = Math.floor(Math.random() * sec_to_review * 0.4);

  currentQuestion.progres_timestamp[progres_level_idx] = Math.floor(Date.now()/1000) + random_sec_shift;

  if (currentQuestion.hieroglyph_type === HieroglyphType.RADICAL) {
    currentQuestion.progres_level[1-progres_level_idx] = currentQuestion.progres_level[progres_level_idx];
    currentQuestion.progres_timestamp[1-progres_level_idx] = currentQuestion.progres_timestamp[progres_level_idx];
  }

  saveProgressToLocalStorage();
  update_progress_level();
}

// displays green/yellow/red feedback for currentQuestion
function _displayFeedback(minDistance, closestAnsw) {
  // play sound if vocab reading + correct
  if (currentQuestion.hieroglyph_type === HieroglyphType.VOCAB && questionType === 'reading' && is_correct_review) {
    currentSoundPath = 'sounds/'+encodeURIComponent(currentQuestion.resource_paths.sound);
    soundClick();
  }
  // half correct feedback
  const feeDBackEl = document.getElementById("feedback");
  if (!is_correct_review && is_half_correct_review) {
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

  if (is_correct_review && minDistance === 0) {
    feeDBackEl.textContent = "Correct!";
    feeDBackEl.style.color = "var(--color-correct)";
    document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-correct)";
    if (window.innerWidth >= 768) {
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'flex');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.backgroundColor = 'var(--color-correct)');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.textContent = '⛩️正しい⛩️');
    }
  } 
  else if (is_correct_review) {
    feeDBackEl.textContent = 'Correct! But did you mean "' + closestAnsw + '"?';
    feeDBackEl.style.color = "var(--color-warning)";
    document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-warning)";
    if (window.innerWidth >= 768) {
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'flex');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.backgroundColor = 'var(--color-warning)');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.textContent = '👺正しいかも👺');
    }
  }
  else
  {
    feeDBackEl.textContent = "Incorrect! You are " + minDistance + " symbols away from an answer.";
    feeDBackEl.style.color = "var(--color-incorrect)";
    document.getElementById("answer-input").style.borderBottom = "2px solid var(--color-incorrect)";
    if (window.innerWidth >= 768) {
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.display  = 'flex');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.style.backgroundColor = 'var(--color-incorrect)');
      document.querySelectorAll(".feedback-rectangles").forEach(rect => rect.textContent = '🌋正しくない🌋');
    }
  }
}

// Get the time until the next review
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