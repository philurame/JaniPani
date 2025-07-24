//-----------------------------------------------------------
// INFO SECTION
//-----------------------------------------------------------
function infoClick() {
  showSection("info-section");
  if (isInLesson  && currentLesson) {_fillHieroglyphDetail(currentLesson);}
  if (isInReview && currentQuestion) {_fillHieroglyphDetail(currentQuestion);}
}

//-----------------------------------------------------------
// BACK TO LESSION OR REVIEW
//-----------------------------------------------------------
function backToGameClick() {
  if (isInLesson) showSection("lesson-section");
  else if (isInReview) showSection("review-section");
  else showSection("stats-section");
}

//-----------------------------------------------------------
// SHOW THE MEANING OR THE READINGS
//-----------------------------------------------------------
function mnemonicClick(is_meaning){
  if (is_meaning) {
    document.getElementById('mnemonic-meaning-content').classList.toggle("show");
    document.getElementById('mnemonic-reading-content').classList.remove("show");
  }
  else {
    document.getElementById('mnemonic-reading-content').classList.toggle("show");
    document.getElementById('mnemonic-meaning-content').classList.remove("show");
  }
  _resizeMnemonics(document.getElementById('mnemonic-meaning-detail'));
  _resizeMnemonics(document.getElementById('mnemonic-reading-detail'));
}

//-----------------------------------------------------------
// SEARCH THE SYMBOL OR RADICAL ON CLICK
//-----------------------------------------------------------
function searchDetailClick() {
  const search_text = (currentInfo.symbol) ? currentInfo.symbol.toUpperCase() : currentInfo.meanings[0];
  document.getElementById("search-query").value = search_text;
  searchHieroglyphsClick();
}

//-----------------------------------------------------------
// GENERAL SEARCH CLICK
//-----------------------------------------------------------
function searchHieroglyphsClick() {
  const query = document.getElementById("search-query").value.trim().toLowerCase();
  const resultsEl = document.getElementById("search-results");
  resultsEl.innerHTML = "";

  if (!query) return;

  const hira = wanakana.toHiragana(query);

  function checkReadings(readings, q, same_main_reading = null) {
    if (same_main_reading !== null && !same_main_reading) return false;
    return readings.some(r => r.toLowerCase().includes(q));
  }

  function checkLinks(links) {
    return links.some(r => {
      const linked = DB.hieroglyphs[LinkIdx[r]];
      return linked.symbol.toLowerCase().includes(query) ||
             linked.meanings.some(m => m.toLowerCase().includes(query));
    });
  }

  function getPriority(h, q) {
    // Priority 1: Specials with modifiers, level + type or level + type + symbol
    if ((h.level + h.hieroglyph_type[0]) === q) return 1;
    const parts = q.split(' ');
    if ((h.level + h.hieroglyph_type[0] + h.symbol) === parts[0]) {
      if (parts.length >= 2 && !isNaN(parts[1])) {
        const p2 = parseInt(parts[1]);
        const p3 = parts.length >= 3 && !isNaN(parts[2]) ? parseInt(parts[2]) : p2;
        if (p2 >= -1 && p2 <= 9 && p3 >= -1 && p3 <= 9) h.progres_level = [p2, p3];
      }
      return 1;
    }

    // Priority 2: Symbol / Meanings
    if (h.symbol.toLowerCase().includes(q)) return 2;
    if (h.meanings.some(m => m.toLowerCase().includes(q))) return 2;

    // Priority 3: Readings (direct, with main check where needed)
    if (h.readings.vocab.some(r => r.toLowerCase().includes(q)) ||
        checkReadings(h.readings.onyomi, q, h.readings.main_reading === 'onyomi') ||
        checkReadings(h.readings.kunyomi, q, h.readings.main_reading === 'kunyomi')) return 3;

    // Priority 4: Readings (hiragana, with main check)
    if (h.readings.vocab.some(r => r.toLowerCase().includes(hira)) ||
        checkReadings(h.readings.onyomi, hira, "onyomi") ||
        checkReadings(h.readings.kunyomi, hira, "kunyomi")) return 4;

    // Priority 5: On/Kun readings (direct, no main check)
    if (checkReadings(h.readings.onyomi, q) || checkReadings(h.readings.kunyomi, q)) return 5;

    // Priority 6: On/Kun readings (hiragana, no main check)
    if (checkReadings(h.readings.onyomi, hira) || checkReadings(h.readings.kunyomi, hira)) return 6;

    // Priority 7: Compounds
    if (checkLinks(h.resource_paths.radical_links) || checkLinks(h.resource_paths.kanji_links)) return 7;

    // Priority 8: Custom mnemonics
    if (h.mnemonics.custom_meaning && (h.mnemonics.custom_meaning.toLowerCase().includes(q) ||
        h.mnemonics.custom_reading.toLowerCase().includes(q))) return 8;

    // Priority 9: Standard mnemonics
    if (h.mnemonics.meaning.toLowerCase().includes(q) ||
        h.mnemonics.reading.toLowerCase().includes(q)) return 9;

    return 0;
  }

  let sortedResults = DB.hieroglyphs.reduce((acc, h) => {
    const priority = getPriority(h, query);
    if (priority > 0) acc.push({ h, priority });
    return acc;
  }, []).sort((a, b) => a.priority - b.priority);

  if (sortedResults.length > 0 && sortedResults[0].priority === 1) {
    sortedResults = sortedResults.filter(x => x.priority === 1);
  }

  const searchLength = Math.min(sortedResults.length, 64);

  if (searchLength === 0) {
    const li = document.createElement("li");
    li.textContent = "No results found.";
    li.style = "border: 2px solid var(--color-incorrect); color: var(--color-incorrect); padding: 10px;";
    resultsEl.style.display = "flex";
    resultsEl.appendChild(li);
    return;
  }

  resultsEl.style.display = "grid";

  for (let i = 0; i < searchLength; i++) {
    const { h } = sortedResults[i];
    const li = document.createElement("li");
    li.textContent = h.symbol.toUpperCase() + " (" + h.meanings[0] + ")";
    switch (h.hieroglyph_type) {
      case HieroglyphType.RADICAL: li.classList.add("radical-search"); break;
      case HieroglyphType.KANJI: li.classList.add("kanji-search"); break;
      case HieroglyphType.VOCAB: li.classList.add("vocab-search"); break;
    }
    li.onclick = () => _fillHieroglyphDetail(h);
    resultsEl.appendChild(li);
  }
}


//-----------------------------------------------------------
// INFO UTILS
//-----------------------------------------------------------
// fill all info for a hieroglyph
function _fillHieroglyphDetail(h) {
  // Set current info and toggle visibility of UI elements
  currentInfo = h;
  document.getElementById("hieroglyph-detail").classList.remove("hidden");
  document.getElementById("vocab-sound-button").classList.add("hidden");
  document.getElementById("onkun").style.display = 'none';

  // Update level and progress indicators
  document.getElementById("info-level_value").textContent = h.level;
  document.getElementById("info-progress_meaning_value").textContent = HieroglyphProgress[h.progres_level[0]];
  document.getElementById("info-progress_reading_value").textContent = HieroglyphProgress[h.progres_level[1]];

  // Calculate and display next review time
  const minProg = Math.min(h.progres_level[0], h.progres_level[1]);
  const isInf = minProg === -1 || minProg === 9;
  if (isInf) {
    document.getElementById("info-next-review-in_value").textContent = 'Infinity';
  } else {
    const now = Math.floor(Date.now() / 1000);
    const tMeaning = h.progres_timestamp[0] + SecToReview[h.progres_level[0]] - now;
    const tReading = h.progres_timestamp[1] + SecToReview[h.progres_level[1]] - now;
    let nextSec = Math.min(tMeaning, tReading);
    if (nextSec < 0) {
      document.getElementById("info-next-review-in_value").textContent = 'NOW!';
    } else {
      const days = Math.floor(nextSec / 86400);
      const hrs = Math.floor((nextSec % 86400) / 3600);
      const mins = Math.floor((nextSec % 3600) / 60);
      document.getElementById("info-next-review-in_value").textContent = `${days}d ${hrs}h ${mins}m`;
    }
  }

  // Format and display meanings
  const meaning = h.meanings[0].charAt(0).toUpperCase() + h.meanings[0].slice(1) + (h.meanings.length > 1 ? ', ' : '');
  document.getElementById("detail-meaning").textContent = meaning;
  document.getElementById("extra-meanings").textContent = h.meanings.length > 1 ? h.meanings.slice(1).join(", ") : '';

  // Build composition links (radicals or kanji)
  const composition = document.getElementById("symbol-composition");
  composition.innerHTML = "";

  const links = h.hieroglyph_type === HieroglyphType.RADICAL ? [] : (h.hieroglyph_type === HieroglyphType.KANJI ? h.resource_paths.radical_links : h.resource_paths.kanji_links);
  links.forEach((link, i) => {
    if (i > 0) {
      const plus = document.createElement("span");
      plus.textContent = "+";
      plus.style = 'margin: 0 10px; margin-top: 15px; color: var(--color-primary); font-size: 30px;';
      composition.appendChild(plus);
    }
    const li = document.createElement("li");
    const linkedH = DB.hieroglyphs[LinkIdx[link]];
    li.textContent = linkedH.symbol.toUpperCase();
    li.classList.add(linkedH.hieroglyph_type === HieroglyphType.RADICAL ? "radical-search" : "kanji-search");
    li.onclick = () => { composition.innerHTML = ""; _fillHieroglyphDetail(linkedH); };
    composition.appendChild(li);
  });

  // Add mobile-specific composition elements
  if (window.innerWidth < 768 && links.length > 0) {
    const equal = document.createElement("span");
    equal.textContent = "=";
    equal.style = 'margin: 0 10px; margin-top: 15px; color: var(--color-primary); font-size: 30px;';
    composition.appendChild(equal);
  }
  if (window.innerWidth < 768) {
    const li = document.createElement("li");
    li.textContent = h.symbol.toUpperCase();
    li.classList.add(h.hieroglyph_type === HieroglyphType.RADICAL ? "radical-search" : h.hieroglyph_type === HieroglyphType.KANJI ? "kanji-search" : "vocab-search");
    li.onclick = () => { searchDetail(); };
    composition.appendChild(li);
  }

  // Handle type-specific readings (Kanji or Vocab)
  if (h.hieroglyph_type === HieroglyphType.KANJI) {
    document.getElementById("onkun").style.display = 'flex';
    const onStyle = h.readings.main_reading === 'onyomi' ? h.readings.onyomi.join(", ") : `<span class="faded">${h.readings.onyomi.join(", ")}</span>`;
    const kunStyle = h.readings.main_reading === 'kunyomi' ? h.readings.kunyomi.join(", ") : `<span class="faded">${h.readings.kunyomi.join(", ")}</span>`;
    document.getElementById("detail-onyomi").innerHTML = onStyle;
    document.getElementById("detail-kunyomi").innerHTML = kunStyle;
  } else if (h.hieroglyph_type === HieroglyphType.VOCAB) {
    document.getElementById("vocab-sound-button").classList.remove('hidden');
    currentSoundPath = 'sounds/' + encodeURIComponent(h.resource_paths.sound);
    document.getElementById("vocab-sound-button").textContent = h.readings.vocab.join(", ");
  }

  // Reset and set mnemonics
  document.querySelectorAll(".mnemonic-content").forEach(content => content.classList.remove("show"));
  document.getElementById("mnemonic-meaning-detail").value = h.mnemonics.custom_meaning || h.mnemonics.meaning;
  document.getElementById("mnemonic-reading-detail").value = h.mnemonics.custom_reading || h.mnemonics.reading;

  // Populate sentences if available
  const detailSentences = document.getElementById("detail-sentences");
  detailSentences.innerHTML = "";
  detailSentences.style.border = h.sentences.length > 0 ? '1px solid var(--color-grey)' : 'none';
  h.sentences.forEach(s => {
    const li = document.createElement("li");
    li.classList.add("sentence-item");
    const jpSpan = document.createElement("span");
    jpSpan.classList.add("japanese");
    jpSpan.textContent = s[0];
    const transSpan = document.createElement("span");
    transSpan.classList.add("translation");
    transSpan.textContent = s[1];
    li.appendChild(jpSpan);
    li.appendChild(transSpan);
    detailSentences.appendChild(li);
  });

  // Display hieroglyph symbol and set external link
  showHieroglyph("detail-symbol", h);
  document.getElementById("detail-wanikani-link").href = h.resource_paths.wanikani_link || "#";
}

// Resize mnemonics (I dont remember why this is needed)
function _resizeMnemonics(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}