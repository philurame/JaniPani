// ---------------------------------------
// show a specific section and hide the others
// ---------------------------------------
function showSection(sectionId) {
  const allSections = ["game-section", "info-section", "no-lesson-section", "stats-section"];
  allSections.forEach(s => {document.getElementById(s).classList.add("hidden");});
  document.getElementById(sectionId).classList.remove("hidden");

  if (sectionId === "game-section") {
    if (window.innerWidth >= 768) {document.getElementById("answer-input").focus();}
    // clear info's display
    document.getElementById("search-query").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("symbol-composition").innerHTML = "";
  
    document.getElementById("submit-answer").textContent = isInQuestion ? "Submit" : "Next";
    document.getElementById("SwitchLessonButton").textContent = isLesson ? "Switch to Reviews" : "Switch to Lessons";
  }
  if (sectionId === "info-section") {if (window.innerWidth >= 768) document.getElementById("search-query").focus();}
  if (sectionId === "stats-section") {currentQuestion = null;}
}

// ---------------------------------------
// KEYBOARD HANDLER
// ---------------------------------------
function handleUserInteractionKeyDown(event) {
  const is_question = !document.getElementById("game-section").classList.contains("hidden");
  const is_info     = !document.getElementById("info-section").classList.contains("hidden");
  const is_stats    = !document.getElementById("stats-section").classList.contains("hidden");
  
  if (event.key === 'Enter') {
    event.preventDefault();
    if (event.target.id === "detail-mnemonic-meaning" || event.target.id === "detail-mnemonic-reading") {customMnemonicSave(event.target.id);}
    if (is_question && !document.getElementById("feedback").textContent.startsWith("Incorrect")) {submitClick();}
    else if (is_info) {searchHieroglyphs();}
  } 
  else if (event.key === 'Escape') {
    event.preventDefault();
    if (is_question) {showInfoForCurrent();}
    else if (is_info && document.getElementById("search-results").innerHTML) {
      document.getElementById("search-query").value = "";
      document.getElementById("search-results").innerHTML = "";
      document.querySelectorAll(".mnemonic-content").forEach(content => {content.classList.remove("show");});
      searchHieroglyphs();
    }
    else if (!is_question && is_info && currentQuestion) {
      showSection("game-section");
    }
    else if (is_stats) {
      showSection("info-section");
    }
    else {
      showSection("stats-section");
    }
  }
};


// ---------------------------------------
// handling of progress level < LowProgressEnd
// ---------------------------------------
function getNextProgressKanji() {
  if (ProgressLevel < LowProgressEnd) return ProgressKanjiLevelLow;
  return ProgressKanjiLevel;
}
function getNextProgressVocab() {
  if (ProgressLevel < LowProgressEnd) return ProgressVocabLevelLow;
  return ProgressVocabLevel;
}
function getRadKanjiLessonLevel() {
  if (ProgressLevel < LowProgressEnd) return RadKanjiLessonLevelLow;
  return RadKanjiLessonLevel;
}
function getKanjiVocabLessonLevel() {
  if (ProgressLevel < LowProgressEnd) return KanjiVocabLessonLevelLow;
  return KanjiVocabLessonLevel;
}


// ---------------------------------------
// Damerau-Levenshtein Distance
// ---------------------------------------
function damerauLevenshteinDistance(a, b) {
  const dp = [];
  
  // Initialize the DP table
  for (let i = 0; i <= a.length; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    dp[0][j] = j;
  }
  
  // Compute the Damerau-Levenshtein distance
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      
      // Check for transposition if possible:
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(
          dp[i][j],
          dp[i - 2][j - 2] + 1 // transposition cost is considered as 1
        );
      }
    }
  }
  
  return dp[a.length][b.length];
}

// ---------------------------------------
// Load and Save from localStorage
// ---------------------------------------
function loadProgressFromLocalStorage() {
  const savedData = localStorage.getItem("JaniPaniProgress");
  if (!savedData) {return;}
  _overwriteDB(JSON.parse(savedData));
}
  
function saveProgressToLocalStorage() {
  const jsonData = _fetchProgress();
  localStorage.setItem("JaniPaniProgress", JSON.stringify(jsonData));
}

// load HieroglyphDB and LinkIdx
async function _loadHieroglyphDB() {
  const response = await fetch("./HieroglyphDB.json");
  const data = await response.json();
  DB = HieroglyphDB.fromJSON(data);

  LinkIdx = {};
  for (let i = 0; i < DB.hieroglyphs.length; i++) {
    LinkIdx[DB.hieroglyphs[i].resource_paths.wanikani_link] = i;
  }
}


// ---------------------------------------
// fetch Json & overwrite DB
// ---------------------------------------
function _fetchProgress() {
  const jsonData = {};
  for (const h of DB.hieroglyphs) {
    const is_progress = (h.level <= ProgressLevel) && (h.progres_level[0] !== -1 || h.progres_level[1] !== -1);

    if (is_progress || h.mnemonics.custom_meaning || h.mnemonics.custom_reading) {
      jsonData[h.resource_paths.wanikani_link] = {
        'progres_level': "",
        'progres_timestamp': "",
        'custom_meaning': h.mnemonics.custom_meaning,
        'custom_reading': h.mnemonics.custom_reading,
      };
      if (is_progress) {
        jsonData[h.resource_paths.wanikani_link]['progres_level']     = h.progres_level;
        jsonData[h.resource_paths.wanikani_link]['progres_timestamp'] = h.progres_timestamp;
      }
    }
  }
  return jsonData;
}

function _overwriteDB(jsonData) {
  // Update hieroglyph progress data
  for (const h of DB.hieroglyphs) {
    h.progres_level = [-1, -1];
    h.progres_timestamp = [-1, -1];
    const wanikani_link = h.resource_paths.wanikani_link;
    if (jsonData[wanikani_link]) {
      h.mnemonics.custom_meaning = jsonData[wanikani_link].custom_meaning;
      h.mnemonics.custom_reading = jsonData[wanikani_link].custom_reading;
      if (jsonData[wanikani_link].progres_level) {
        h.progres_level = jsonData[wanikani_link].progres_level;
        h.progres_timestamp = jsonData[wanikani_link].progres_timestamp;
      }
    }
  }
  
  // Count how many kanji exist at each level (only if it has progress data > 0)
  const levelKanjiCount = {};
  const levelHyerCount  = {};
  for (const h of DB.hieroglyphs) {
    if (h.progres_level[0] > 0 || h.progres_level[1] > 0) {
      levelHyerCount[h.level] = (levelHyerCount[h.level] || 0) + 1;
      if (h.hieroglyph_type === HieroglyphType.KANJI) { levelKanjiCount[h.level] = (levelKanjiCount[h.level] || 0) + 1; }
    }
  }

  // ProgressLevel := highest level with at least one hieroglyph on this level and at least 15 kanji on previous level
  ProgressLevel = 1;
  while (true) {
    const hasAnyHieroglyph = levelHyerCount[ProgressLevel+1] > 0;
    const hasEnoughKanji   = levelKanjiCount[ProgressLevel] >= 15;
    if (hasAnyHieroglyph && hasEnoughKanji) {ProgressLevel += 1;} else {break;}
  }

  _update_progress_level();
}

// ---------------------------------------
// play sound
// ---------------------------------------
function _playSound(path) {
  if (path!=null && path.includes("vocabulary")) {
    const audio = new Audio(path);
    audio.play();
  }
}