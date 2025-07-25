//-----------------------------------------------------------
// Lesson / Review Button
//-----------------------------------------------------------
function lessonClick() {
  isInLesson = 1;
  isInReview = 0;
  showSection("lesson-section");
  showNewLesson();
  check_using_mobile();
};

//-----------------------------------------------------------
// LEARN CURRENT HIEROGLYPH
//-----------------------------------------------------------
function learnClick() {
  currentLesson.progres_level = [0, 0];
  currentLesson.progres_timestamp[0] = Math.floor(Date.now()/1000);
  currentLesson.progres_timestamp[1] = currentLesson.progres_timestamp[0];
  saveProgressToLocalStorage();
  showNewLesson();
  return;
}

//-----------------------------------------------------------
// SHOWS A NEW HIEROGLYPH
//-----------------------------------------------------------
function showNewLesson() {
  const is_sampled = sampleLesson();
  if (!is_sampled) {NoLessons(); return false;}
  showHieroglyph("lesson-display", currentLesson);

  const progressDisplay = document.getElementById("lesson-progress");
  progressDisplay.innerHTML = `${lessonIndex + 1} of ${eligibleLessons.length}`;
  return true;
}

//-----------------------------------------------------------
// FILTERS HIEROGLYPHS AND SAMPLES currentLesson HIEROGLYPH
//-----------------------------------------------------------
function sampleLesson() {
  let h_not_learned = DB.hieroglyphs.filter(h => (h.level <= ProgressLevel) && (h.progres_level[0] === -1 || h.progres_level[1] === -1));
  h_not_learned.sort((a, b) => a.level - b.level);

  // Collect all eligible (those passing the if conditions, respecting prereqs)
  eligibleLessons = h_not_learned.filter(hieroglyph => {
    if (hieroglyph.hieroglyph_type === HieroglyphType.RADICAL) {return true;} 
    else if (hieroglyph.hieroglyph_type === HieroglyphType.KANJI && is_rads_compounds_learned(hieroglyph)) {return true;} 
    else if (hieroglyph.hieroglyph_type === HieroglyphType.VOCAB && is_kanji_compounds_learned(hieroglyph)) {return true;}
    return false;
  });

  if (eligibleLessons.length === 0) return false;

  // Start at the first one (matches original behavior)
  lessonIndex = lessonIndex % eligibleLessons.length;
  currentLesson = eligibleLessons[lessonIndex];
  return true;
}

//-----------------------------------------------------------
// Shifts the currentLesson by diff
//-----------------------------------------------------------
function shiftLessonClick(diff) {
  if (eligibleLessons.length === 0) return;

  lessonIndex = (lessonIndex + diff + eligibleLessons.length) % eligibleLessons.length;
  currentLesson = eligibleLessons[lessonIndex];
  showHieroglyph("lesson-display", currentLesson);

  // Optional: Update progress display
  const progressDisplay = document.getElementById("lesson-progress");
  progressDisplay.innerHTML = `${lessonIndex + 1} of ${eligibleLessons.length}`;
}

//-----------------------------------------------------------
// NO LESSONS SECTION
//-----------------------------------------------------------
function NoLessons() {
  document.getElementById("lesson-section").classList.add("hidden");
  showSection("no-lesson-section");
}

// ---------------------------------------
// Lesson Utils
// ---------------------------------------
// check if all rads-components have been learned:
function is_rads_compounds_learned(kanji) {
  // check if all rads-components have been learned:
  for (let i = 0; i < kanji.resource_paths.radical_links.length; i++) {
    const radical_link = kanji.resource_paths.radical_links[i];
    const progres = DB.hieroglyphs[LinkIdx[radical_link]].progres_level;
    if (progres[0] < getRadKanjiLessonLevel() || progres[1] < getRadKanjiLessonLevel()) {return false;}
  }
  return true;
}

// check if all kanji-components have been learned:
function is_kanji_compounds_learned(vocab) {
  // check if all kanji-components have been learned:
  for (let i = 0; i < vocab.resource_paths.kanji_links.length; i++) {
    const kanji_link = vocab.resource_paths.kanji_links[i];
    const progres = DB.hieroglyphs[LinkIdx[kanji_link]].progres_level;
    if (progres[0] < getKanjiVocabLessonLevel() || progres[1] < getKanjiVocabLessonLevel()) {return false;}
  }
  return true;
}