
//-----------------------------------------------------------
// LOAD HTML FRAGMENTS
//-----------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  _loadHTMLFragment('htmls/stats', 'htmls/stats.html');
  _loadHTMLFragment('htmls/lessons', 'htmls/lessons.html');
  _loadHTMLFragment('htmls/reviews', 'htmls/reviews.html');
  _loadHTMLFragment('htmls/info', 'htmls/info.html');
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
  
  // KEYBOARD HANDLER
  document.addEventListener('keydown', handleUserInteractionKeyDown);
  
  loadProgressFromLocalStorage();
  refreshClick();

  if (window.innerWidth < 768) {reviewClick();} 
  else {statsClick();}
  check_using_mobile();
});


//-----------------------------------------------------------
// MAIN UTILS
//-----------------------------------------------------------
async function _loadHTMLFragment(id, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    const content = await response.text();
    document.getElementById(id).innerHTML = content;
    
    // Now that the fragment is loaded, call a function to attach event listeners
    _attachEventListeners();
  } catch (error) {
    console.error(error);
  }
}

function _attachEventListeners() {
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