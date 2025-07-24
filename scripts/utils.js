// ---------------------------------------
// SHOW A SECTION AND HIDE THE REST
// ---------------------------------------
function showSection(sectionId) {
  const allSections = ["lesson-section", "review-section", "info-section", "no-lesson-section", "no-review-section", "stats-section"];
  allSections.forEach(s => {document.getElementById(s).classList.add("hidden");});
  document.getElementById(sectionId).classList.remove("hidden");

  if (sectionId === "review-section" || sectionId === "lesson-section") {
    if (window.innerWidth >= 768) {document.getElementById("answer-input").focus();}
    // clear info's display
    document.getElementById("search-query").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("symbol-composition").innerHTML = "";
  
    // document.getElementById("SwitchLessonButton").textContent = isInLesson ? "Switch to Reviews" : "Switch to Lessons";
  }
  if (sectionId === "info-section") {if (window.innerWidth >= 768) document.getElementById("search-query").focus();}
  if (sectionId === "stats-section") {currentQuestion = null;}
}

// ---------------------------------------
// KEYBOARD HANDLER
// ---------------------------------------
function handleUserInteractionKeyDown(event) {
  const is_lesson   = !document.getElementById("lesson-section").classList.contains("hidden");
  const is_question = !document.getElementById("review-section").classList.contains("hidden");
  const is_info     = !document.getElementById("info-section").classList.contains("hidden");
  const is_stats    = !document.getElementById("stats-section").classList.contains("hidden");
  
  if (event.key === 'Enter') {
    event.preventDefault();
    if (event.target.id === "detail-mnemonic-meaning" || event.target.id === "detail-mnemonic-reading") {customMnemonicSave(event.target.id);}
    if (is_question) {
      if (document.getElementById("feedback").textContent.startsWith("Correct") && !document.getElementById("feedback").classList.contains("hidden")) {judgeClick(1);}
      else {submitClick();}
    }
    else if (is_info) {searchHieroglyphsClick();}
  } 
  else if (event.key === 'Escape') {
    event.preventDefault();
    if (is_lesson) {infoClick();}
    else if (is_question) {infoClick();}
    else if (is_info && document.getElementById("search-results").innerHTML) {
      document.getElementById("search-query").value = "";
      document.getElementById("search-results").innerHTML = "";
      document.querySelectorAll(".mnemonic-content").forEach(content => {content.classList.remove("show");});
      searchHieroglyphsClick();
    }
    else if (isInLesson && is_info && currentLesson) {
      showSection("lesson-section");
    }
    else if (isInReview && is_info && currentQuestion) {
      showSection("review-section");
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
// play sound
// ---------------------------------------
function soundClick() {
  if (currentSoundPath!=null && currentSoundPath.includes("vocabulary")) {
    const audio = new Audio(currentSoundPath);
    audio.play();
  }
}

// ---------------------------------------
// Save custom mnemonics
// ---------------------------------------
function customMnemonicSave(targetId) {
  const customMnemonic = document.getElementById(targetId).value;
  if (targetId === "mnemonic-meaning-detail") {
    currentInfo.mnemonics.custom_meaning = customMnemonic;
  } else if (targetId === "mnemonic-reading-detail") {
    currentInfo.mnemonics.custom_reading = customMnemonic;
  }

  // flash effect
  const textarea = document.getElementById(event.target.id);
  textarea.classList.add('flash-effect');
  setTimeout(() => {
    textarea.classList.remove('flash-effect');
  }, 500);

  saveProgressToLocalStorage();
}

// ---------------------------------------
// FILTER HIEROGLYPHS FOR REVIEW
// ---------------------------------------
function filterHieroglyphs() {
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

// ---------------------------------------
// SHOW A HIEROGLYPH IN A FIELD
// ---------------------------------------
function showHieroglyph(placeholder, h) {
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

// --------------------------------------------
// handling of progress level < LowProgressEnd
// --------------------------------------------
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
// UPDATE PROGRESS LEVEL
// ---------------------------------------
function update_progress_level() {
  ProgressLevel = Math.min(ProgressLevel, 60);
  if (ProgressLevel === 60) {return;}

  // check if progress level can be updated
  // all of radical should be >= ProgressRadLevel
  // ProgressKanjiShare of kanji should be >= NextProgressKanjiLevel
  // ProgressVocabShare of vocab should be >= NextProgressVocabLevel
  const ProgressHieroglyphs = DB.hieroglyphs.filter(h => (h.level === ProgressLevel));
  let n_kanji_learned = 0;
  let n_vocab_learned = 0;
  for (const hieroglyph of ProgressHieroglyphs) {
    switch (hieroglyph.hieroglyph_type) {
      case HieroglyphType.RADICAL: 
        if ( (ProgressLevel >= LowProgressEnd) && (hieroglyph.progres_level[0] < ProgressRadLevel) ) {return;}
        break;
      case HieroglyphType.KANJI:
        if ( (hieroglyph.progres_level[0] >= getNextProgressKanji()) && (hieroglyph.progres_level[1] >= getNextProgressKanji()) ) {n_kanji_learned += 1;}
        break;
      case HieroglyphType.VOCAB:
        if ( (hieroglyph.progres_level[0] >= getNextProgressVocab()) && (hieroglyph.progres_level[1] >= getNextProgressVocab()) ) {n_vocab_learned += 1;}
        break;
    }
  }
  if (n_kanji_learned < ProgressKanjiShare * ProgressHieroglyphs.filter(h => h.hieroglyph_type === HieroglyphType.KANJI).length) {return;}
  if (n_vocab_learned < ProgressVocabShare * ProgressHieroglyphs.filter(h => h.hieroglyph_type === HieroglyphType.VOCAB).length) {return;}
  ProgressLevel += 1;
}

//-----------------------------------------------------------
// MOBILE
//-----------------------------------------------------------
function check_using_mobile() {
  if (window.innerWidth < 768) {
    document.querySelectorAll('.mobile-load').forEach(e => {e.classList.remove('hidden');});
  } else {
    document.querySelectorAll('.mobile-load').forEach(e => {e.classList.add('hidden');});
  }
}

//-----------------------------------------------------------
// "LOAD" and "SAVE" BUTTONS
//-----------------------------------------------------------
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    alert('No file selected!');
    return;
  }

  const reader = new FileReader();
  let jsonData = {};
  reader.onload = function(e) {
    jsonData = JSON.parse(e.target.result);
    _overwriteDB(jsonData);

    if (window.innerWidth < 768) {reviewClick();}
    else {statsClick();}
  };
  reader.readAsText(file);
}

function uploadClick() {document.getElementById('fileInput').click();}

function downloadClick() {
  const jsonData = _fetchProgress();
  const dataStr = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'JaniPaniProgress.json';
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
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

  update_progress_level();
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