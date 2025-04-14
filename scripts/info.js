//-----------------------------------------------------------
// INFO SECTION
//-----------------------------------------------------------
function showInfoForCurrent() {
  showSection("info-section");
  if (currentQuestion) {fillHieroglyphDetail(currentQuestion);}
}
  
function searchHieroglyphs() {
  const query = document.getElementById("search-query").value.trim().toLowerCase();
  const resultsEl = document.getElementById("search-results");
  resultsEl.innerHTML = "";

  if (!query) {return;};
  
  // Search ANY parameter and sort by priority
  // For example: symbol matches, or included in meaning, or level is the query, etc.
  let results = DB.hieroglyphs.filter(h => {
    h._priority = 0;
    
    // specials
    if ((h.level + h.hieroglyph_type[0]) === query) {h._priority = 1; return true;}
    if ((h.level + h.hieroglyph_type[0] + h.symbol) === query.split(' ')[0]) {
      h._priority = 1; 
      if (query.split(' ').length >= 2 && !isNaN(query.split(' ')[1])) {
        const [, second, third] = query.split(' ');
        const p2 = parseInt(second);
        const p3 = !isNaN(third) ? parseInt(third) : p2;
        if (p2 >= -1 && p2 <= 9 && p3 >= -1 && p3 <= 9) {h.progres_level = [p2, p3];}
      }
      return true;
    }

    // try symbol / meanings:
    if (h.symbol.toLowerCase().includes(query)) {h._priority = 2; return true;}
    if (h.meanings.some(m => m.toLowerCase().includes(query))) {h._priority = 2; return true;}

    // try kana readings:
    if (h.readings.vocab.some(r => r.toLowerCase().includes(query))) {h._priority = 3; return true;}
    if (h.readings.onyomi.some( r => (r.toLowerCase().includes(query) && h.readings.main_reading === "onyomi" ))) {h._priority = 3; return true;}
    if (h.readings.kunyomi.some(r => (r.toLowerCase().includes(query) && h.readings.main_reading === "kunyomi"))) {h._priority = 3; return true;}

    // try romaji readings:
    if (h.readings.vocab.some(r => r.toLowerCase().includes(wanakana.toHiragana(query)))) {h._priority = 4; return true;}
    if (h.readings.onyomi.some( r => (r.toLowerCase().includes(wanakana.toHiragana(query)) && h.readings.main_reading === "onyomi")))  {h._priority = 4; return true;}
    if (h.readings.kunyomi.some(r => (r.toLowerCase().includes(wanakana.toHiragana(query)) && h.readings.main_reading === "kunyomi"))) {h._priority = 4; return true;}

    if (h.readings.onyomi.some( r => r.toLowerCase().includes(query))) {h._priority = 5; return true;}
    if (h.readings.kunyomi.some(r => r.toLowerCase().includes(query))) {h._priority = 5; return true;}
    if (h.readings.onyomi.some( r => r.toLowerCase().includes(wanakana.toHiragana(query)))) {h._priority = 6; return true;}
    if (h.readings.kunyomi.some(r => r.toLowerCase().includes(wanakana.toHiragana(query)))) {h._priority = 6; return true;}

    // try compounds:
    if (h.resource_paths.radical_links.some(r => DB.hieroglyphs[LinkIdx[r]].symbol.toLowerCase().includes(query))) {h._priority = 7; return true;}
    if (h.resource_paths.kanji_links.some(  r => DB.hieroglyphs[LinkIdx[r]].symbol.toLowerCase().includes(query))) {h._priority = 7; return true;}
    if (h.resource_paths.radical_links.some(r => DB.hieroglyphs[LinkIdx[r]].meanings.some(m => m.toLowerCase().includes(query)))) {h._priority = 7; return true;}
    if (h.resource_paths.kanji_links.some(  r => DB.hieroglyphs[LinkIdx[r]].meanings.some(m => m.toLowerCase().includes(query)))) {h._priority = 7; return true;}

    // try mnemonics:
    if (h.mnemonics.custom_meaning.toLowerCase().includes(query)) {h._priority = 8; return true;}
    if (h.mnemonics.custom_reading.toLowerCase().includes(query)) {h._priority = 8; return true;}
    if (h.mnemonics.meaning.toLowerCase().includes(query)) {h._priority = 9; return true;}
    if (h.mnemonics.reading.toLowerCase().includes(query)) {h._priority = 9; return true;}
    
    return false;
  }).sort((a, b) => a._priority - b._priority);
  
  let searchLength = Math.min(results.length, 64);
  if (results.some(h => h._priority == 1)) {
    results = results.filter(h => h._priority == 1);
    searchLength = results.length;
  }
  
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
    const li = document.createElement("li");
    li.textContent = results[i].symbol.toUpperCase() + " (" + results[i].meanings[0] + ")";
    switch (results[i].hieroglyph_type) {
      case HieroglyphType.RADICAL:
        li.classList.add("radical-search");
        break;  
      case HieroglyphType.KANJI:
        li.classList.add("kanji-search");
        break;
      case HieroglyphType.VOCAB:
        li.classList.add("vocab-search");
        break;
    }
    li.onclick = () => fillHieroglyphDetail(results[i]);
    resultsEl.appendChild(li);
  }
}

// fill all info for a hieroglyph
function fillHieroglyphDetail(h) {
  currentInfo = h;
  document.getElementById("hieroglyph-detail").classList.remove("hidden");
  document.getElementById("vocab-sound-button").classList.add("hidden");
  document.getElementById("onkun").style.display='none';

  document.getElementById("info-level").innerHTML = `Level: <span class="info-level-time-style">${h.level}</span>`;

  if (h.progres_level[0] === -1) {
    document.getElementById("info-progress").innerHTML = `Progress: <span class="info-level-time-style">${HieroglyphProgress[h.progres_level[0]]}</span>`;
  }
  else {
    document.getElementById("info-progress").innerHTML = `Progress: <span class="info-level-time-style">${HieroglyphProgress[h.progres_level[0]]}</span>, 
                                                                    <span class="info-level-time-style">${HieroglyphProgress[h.progres_level[1]]}</span>`;
  };
  

  const is_inf = Math.min(h.progres_level[0], h.progres_level[1]) === -1 || Math.min(h.progres_level[0], h.progres_level[1]) === 9;
  if (is_inf) {document.getElementById("info-next-review-in").innerHTML = `Next Review in: <span class="info-level-time-style">Infinity</span>`;}
  else {
    current_timestamp = Math.floor(Date.now() / 1000);
    const t_next_review_meaning = h.progres_timestamp[0]+SecToReview[h.progres_level[0]] - current_timestamp;
    const t_next_review_reading = h.progres_timestamp[1]+SecToReview[h.progres_level[1]] - current_timestamp;
    const next_review_sec = Math.min(t_next_review_meaning, t_next_review_reading);
    if (next_review_sec < 0) {document.getElementById("info-next-review-in").innerHTML = `Next Review in: <span class="info-level-time-style">NOW!</span>`;}
    else {
      const next_review_days = Math.floor(next_review_sec / 86400);
      const hrs_residual = Math.floor((next_review_sec % 86400) / 3600);
      const mins_residual = Math.floor((next_review_sec % 3600) / 60);

    document.getElementById("info-next-review-in").innerHTML = `Next Review in: 
    <span class="info-level-time-style">${next_review_days}</span> days 
    <span class="info-level-time-style">${hrs_residual}</span> hours 
    <span class="info-level-time-style">${mins_residual}</span> minutes`;
    }
  }

  const meaning = h.meanings[0].charAt(0).toUpperCase() + h.meanings[0].slice(1) + (h.meanings.length > 1 ? ', ' : '');
  const meanings = h.meanings.length > 1 ? h.meanings.slice(1).join(", ") : '';
  document.getElementById("detail-meaning").textContent = meaning;
  document.getElementById("extra-meanings").textContent = meanings;

  const composition = document.getElementById("symbol-composition");
  composition.innerHTML = "";

  const composition_links = h.hieroglyph_type === HieroglyphType.RADICAL ? [] : (h.hieroglyph_type === HieroglyphType.KANJI ? h.resource_paths.radical_links : h.resource_paths.kanji_links);
  for (let i = 0; i < composition_links.length; i++) {
    if (i > 0) {
      const plus = document.createElement("span");
      plus.textContent = "+";
      plus.style = 'margin: 0 10px; margin-top: 15px; color: var(--color-primary); font-size: 30px;';
      composition.appendChild(plus);
    }
    const li = document.createElement("li");
    const link_hieroglyph = DB.hieroglyphs[LinkIdx[composition_links[i]]];
    li.textContent = link_hieroglyph.symbol.toUpperCase();
    li.classList.add((link_hieroglyph.hieroglyph_type === HieroglyphType.RADICAL) ? "radical-search" : "kanji-search");
    li.onclick = () => {composition.innerHTML = ""; fillHieroglyphDetail(link_hieroglyph);}
    composition.appendChild(li);
  }

  if (window.innerWidth < 768) {
    if (composition_links.length > 0) {
      const equal = document.createElement("span");
      equal.textContent = "=";
      equal.style = 'margin: 0 10px; margin-top: 15px; color: var(--color-primary); font-size: 30px;';
      composition.appendChild(equal);
    }
    const li = document.createElement("li");
    li.textContent = h.symbol.toUpperCase();
    li.classList.add((h.hieroglyph_type === HieroglyphType.RADICAL) ? "radical-search" : (h.hieroglyph_type === HieroglyphType.KANJI) ? "kanji-search" : "vocab-search");
    li.onclick = () => {searchDetail();}
    composition.appendChild(li);
  }
  

  if (h.hieroglyph_type === HieroglyphType.KANJI) {
    document.getElementById("onkun").style.display = 'flex';

    const onyomi_style  = (h.readings.main_reading === 'onyomi') ? h.readings.onyomi.join(", ") : '<span class="faded">' + h.readings.onyomi.join(", ")  + '</span>';
    const kunyomi_style = (h.readings.main_reading === 'kunyomi') ? h.readings.kunyomi.join(", ") : '<span class="faded">' + h.readings.kunyomi.join(", ")  + '</span>';

    document.getElementById("detail-onyomi").innerHTML  = onyomi_style;
    document.getElementById("detail-kunyomi").innerHTML = kunyomi_style;
  }
  else if (h.hieroglyph_type === HieroglyphType.VOCAB) {
    document.getElementById("vocab-sound-button").classList.remove('hidden');
    currentSoundPath = 'sounds/'+encodeURIComponent(h.resource_paths.sound);
    document.getElementById("vocab-sound-button").textContent = h.readings.vocab.join(", ");
  }
  document.querySelectorAll(".mnemonic-content").forEach(content => content.classList.remove("show"));
  document.getElementById("detail-mnemonic-meaning").value = h.mnemonics.custom_meaning || h.mnemonics.meaning;
  document.getElementById("detail-mnemonic-reading").value = h.mnemonics.custom_reading || h.mnemonics.reading;
  
  // Sentences
  const detailSentences = document.getElementById("detail-sentences");
  detailSentences.innerHTML = "";

  if (h.sentences.length > 0) {
    h.sentences.forEach(s => {
      const li = document.createElement("li");
      li.classList.add("sentence-item");

      const jpSpan = document.createElement("span");
      jpSpan.classList.add("japanese");
      jpSpan.textContent = s[0]; // Assuming first part is Japanese

      const transSpan = document.createElement("span");
      transSpan.classList.add("translation");
      transSpan.textContent = s[1]; // Assuming second part is translation

      li.appendChild(jpSpan);
      li.appendChild(transSpan);
      detailSentences.appendChild(li);
    });
  }

  _showHieroglyph("detail-symbol", h);
  
  document.getElementById("detail-wanikani-link").href = h.resource_paths.wanikani_link || "#";
}

function resizeMnemonics(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function customMnemonicSave(targetId) {
  const customMnemonic = document.getElementById(targetId).value;
  if (targetId === "detail-mnemonic-meaning") {
    currentInfo.mnemonics.custom_meaning = customMnemonic;
  } else if (targetId === "detail-mnemonic-reading") {
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

function searchDetail() {
  const search_text = (currentInfo.symbol) ? currentInfo.symbol.toUpperCase() : currentInfo.meanings[0];
  document.getElementById("search-query").value = search_text;
  searchHieroglyphs();
}
