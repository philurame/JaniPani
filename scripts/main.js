async function loadHTMLFragment(id, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    const content = await response.text();
    document.getElementById(id).innerHTML = content;
    
    // Now that the fragment is loaded, call a function to attach event listeners
    attachEventListeners();
  } catch (error) {
    console.error(error);
  }
}
function attachEventListeners() {
  const inputField = document.getElementById('answer-input');
  if (!inputField) {
    // console.warn("Element #answer-input not found");
    return;
  }
  //-----------------------------------------------------------
  // AUTO ROMAJI-TO-JAPANESE INPUT CONVERSION
  //-----------------------------------------------------------
  inputField.addEventListener('input', () => {
    const answerInput = document.getElementById('answer-input');
    if (window.currentQuestion && window.questionType === 'reading') {
      wanakana.bind(answerInput);
      window.is_wanakana_bind = true;
    } else if (window.is_wanakana_bind) {
      wanakana.unbind(answerInput);
      window.is_wanakana_bind = false;
    }
  });
}

// Load your dynamic content (adjust the element id and URL as needed)
window.addEventListener('DOMContentLoaded', () => {
  loadHTMLFragment('htmls/stats', 'htmls/stats.html');
  loadHTMLFragment('htmls/reviews', 'htmls/reviews.html');
  loadHTMLFragment('htmls/info', 'htmls/info.html');
});


//-----------------------------------------------------------
// ALL DATA & HANDLERS INITIALIZATION
//-----------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {

  // LOAD ALL HIEROGLYPHS
  const loading = document.createElement("loading")
  loading.textContent = "Loading database (11.5 Mb)...";
  loading.style = "position: absolute; margin-top: 30%; left: 25%; font-size: 50px; color: var(--color-purple);";
  document.body.appendChild(loading);
  await _loadHieroglyphDB();
  document.body.removeChild(loading);
  
  // REVIEW & LESSON BUTTONS
  document.getElementById("submit-answer").addEventListener("click", submitClick);
  document.getElementById("show-info-page").addEventListener("click", showInfoForCurrent);
  document.getElementById("reorder").addEventListener("click", switch_review_order);
  document.getElementById("SwitchLessonButton").addEventListener("click", () => {LessonReviewButtonClick(1-isLesson);});
  document.getElementById("stats-lessons-button").addEventListener("click", () => {showSection("game-section"); LessonReviewButtonClick(1);});
  document.getElementById("stats-reviews-button").addEventListener("click", () => {showSection("game-section"); LessonReviewButtonClick(0);});
  document.getElementById("StatsButton").addEventListener("click", () => {showSection("stats-section");});
  document.getElementById("statsRefresh").addEventListener("click", update_stats_section);

  document.getElementById("back-to-stats").addEventListener("click", () => {showSection("stats-section");});
  document.getElementById('back-to-game').addEventListener('click', () => {
    showSection("game-section"); 
    if (!currentQuestion) {LessonReviewButtonClick(isLesson);}
  });
  document.getElementById("try-again").addEventListener("click", tryAgain);

  // fileSync buttons
  document.getElementById('downloadBtn').addEventListener('click', handleFileDownload);
  document.getElementById('uploadBtn').addEventListener('click', () => {document.getElementById('fileInput').click();});
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
  
  // INFO SECTION BUTTONS
  document.getElementById("search-button").addEventListener("click", searchHieroglyphs);
  document.getElementById("detail-symbol").addEventListener("click", searchDetail);
  document.getElementById("vocab-sound-button").addEventListener("click", () => _playSound(currentSoundPath)); 
  document.querySelectorAll(".show-mnemonic").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mnemonic-content").forEach(content => {
        if (content !== button.nextElementSibling) {content.classList.remove("show");}
      });
    button.nextElementSibling.classList.toggle("show");
    resizeMnemonics(document.getElementById('detail-mnemonic-meaning'));
    resizeMnemonics(document.getElementById('detail-mnemonic-reading'));
    });
  });

  document.getElementById('detail-mnemonic-meaning').addEventListener('input', () => {resizeMnemonics(this);});
  document.getElementById('detail-mnemonic-reading').addEventListener('input', () => {resizeMnemonics(this);});

  // KEYBOARD HANDLER
  document.addEventListener('keydown', handleUserInteractionKeyDown);
  
  loadProgressFromLocalStorage();
  update_stats_section();
  showSection("stats-section");
});