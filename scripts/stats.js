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

    if (window.innerWidth < 768) {showSection("game-section"); LessonReviewButtonClick(0);}
    else {showSection("stats-section");}
  };
  reader.readAsText(file);
}

function handleFileDownload() {
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
// Update(Fill) Stats Section
// ---------------------------------------
function update_stats_section() {
  _fill_lesson_review_stats();
  _fill_progress_bars();
  _fill_chart_js();
  _fill_hieroglyph_stats();
}

function _count_active_lessons(lvl=null, type=null) {
  const lvl_hieroglyphs = DB.hieroglyphs.filter(h => ((lvl === null) ? h.level<=ProgressLevel : h.level===lvl));
  
  const h_not_learned = lvl_hieroglyphs.filter(h => (h.progres_level[0] === -1 || h.progres_level[1] === -1))
  if (type === null) {
    const n_radicals = h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.RADICAL)).length;
    const n_kanji = h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.KANJI) && is_rads_compounds_learned(h)).length;
    const n_vocab = h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.VOCAB) && is_kanji_compounds_learned(h)).length;
    return n_radicals + n_kanji + n_vocab;
  }
  if (type === HieroglyphType.RADICAL) {
    return h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.RADICAL)).length;
  }
  if (type === HieroglyphType.KANJI) {
    return h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.KANJI) && is_rads_compounds_learned(h)).length;
  }
  if (type === HieroglyphType.VOCAB) {
    return h_not_learned.filter(h => (h.hieroglyph_type===HieroglyphType.VOCAB) && is_kanji_compounds_learned(h)).length;
  }
}

function _fill_lesson_review_stats() {
  const progress_hieroglyphs = DB.hieroglyphs.filter(h => (h.level === ProgressLevel));

  const nkanji_learned = progress_hieroglyphs.filter(
    h => (h.hieroglyph_type === HieroglyphType.KANJI)  &&
    (h.progres_level[0] >= getNextProgressKanji()) && (h.progres_level[1] >= getNextProgressKanji())
  ).length;
  
  const totalKanji = Math.ceil(progress_hieroglyphs.filter(h => h.hieroglyph_type === HieroglyphType.KANJI).length * NextProgressKanjiShare);
  const kanjiLevelBar = document.getElementById("kanji-level-bar");
  kanjiLevelBar.value = nkanji_learned;
  kanjiLevelBar.max = totalKanji;

  document.getElementById("progress-level-bar").value = ProgressLevel-1;
  document.getElementById("progress-level-text").innerHTML = `<span style='color:var(--color-correct); font-size: 24px;'>${ProgressLevel}</span><span style='color:var(--color-primary); font-size: 24px;'> / 60</span>`;
  document.getElementById("kanji-level-text").innerHTML    = `<span style='color:var(--color-correct); font-size: 24px;'>${nkanji_learned}</span><span style='color:var(--color-primary); font-size: 24px;'> / ${totalKanji}</span>`;

  const n_acive_lessons = _count_active_lessons();

  _filterHieroglyphs();
  const n_reviews = filteredHieroglyphs.filter(h => h.progres_level[0] > -1 && h.progres_level[1] > -1);

  document.getElementById("stats-lessons-text").innerHTML = `<span style='color:var(--color-primary); font-size: 24px;'>Active Lessons: </span><span style='color:var(--color-correct); font-size: 24px;'>${n_acive_lessons}</span>`;
  document.getElementById("stats-review-text").innerHTML = `<span style='color:var(--color-primary); font-size: 24px;'>Active Reviews: </span><span style='color:var(--color-correct); font-size: 24px;'>${n_reviews.length}</span>`;
}


function _fill_chart_js() {
  let intervals = [];
  const now = new Date();
  // Round current time to the nearest hour:
  const currentRounded = new Date(now);
  currentRounded.setMinutes(0, 0, 0);

  // Build intervals based on viewMode:
  if (chartViewMode === "week") {// Weekly view: 15 intervals of 12 hours
    let intervalStart = currentRounded;
    let intervalEnd = new Date(currentRounded);
    if (currentRounded.getHours() < 12) {intervalEnd.setHours(12, 0, 0, 0);} 
    else {intervalEnd.setDate(intervalEnd.getDate() + 1); intervalEnd.setHours(0, 0, 0, 0);}
    intervals.push({ start: intervalStart, end: intervalEnd });

    const totalIntervals = 15;
    for (let i = 1; i < totalIntervals; i++) {
      intervalStart = new Date(intervalEnd);
      intervalEnd = new Date(intervalEnd.getTime() + 12 * 60 * 60 * 1000);
      intervals.push({ start: intervalStart, end: intervalEnd });
    }
  } else {// Daily view: 24 intervals of 1 hour each for the next 24 hours
    const totalIntervals = 24;
    let intervalStart = currentRounded;
    for (let i = 1; i <= totalIntervals; i++) {
      let intervalEnd = new Date(intervalStart.getTime() + 60 * 60 * 1000);
      intervals.push({ start: intervalStart, end: intervalEnd });
      intervalStart = intervalEnd;
    }
  }

  // Prepare the datasets with array lengths matching the number of intervals:
  const resData = {
    labels: [],
    datasets: [
      {
        label: 'Cumulative Reviews',
        data: Array(intervals.length).fill(null),
        borderColor: '#00a3f5',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Apprentice',
        data: Array(intervals.length).fill(null),
        backgroundColor: '#00a3f5',
        type: 'bar',
        borderWidth: 0,
        barThickness: 10,
        stack: 'reviewsStack'
      },
      {
        label: 'Guru',
        data: Array(intervals.length).fill(null),
        backgroundColor: '#74bc0c',
        type: 'bar',
        borderWidth: 0,
        barThickness: 10,
        stack: 'reviewsStack'
      },
      {
        label: 'Master',
        data: Array(intervals.length).fill(null),
        backgroundColor: '#ffc401',
        type: 'bar',
        borderWidth: 0,
        barThickness: 10,
        stack: 'reviewsStack'
      },
      {
        label: 'Enlighted',
        data: Array(intervals.length).fill(null),
        backgroundColor: '#f8043c',
        type: 'bar',
        borderWidth: 0,
        barThickness: 10,
        stack: 'reviewsStack'
      }
    ]
  };

  // Format labels differently for week vs. daily view:
  function _formatLabel(date) {
    if (chartViewMode === 'week') { 
      return date.toLocaleDateString('en-US', { weekday: 'short' }) + " " + date.getHours().toString().padStart(2, '0') + ":00";
    } else {
      return date.getHours().toString().padStart(2, '0') + ":00";
    }
  }

  // Process each interval and calculate dummy review counts:
  intervals.forEach((interval, index) => {
    resData.labels.push(_formatLabel(interval.end));
    const tsStart = interval.start.getTime() / 1000;
    const tsEnd = interval.end.getTime() / 1000;
    let apprentice = 0, guru = 0, master = 0, enlighted = 0;

    DB.hieroglyphs.forEach(h => {
      if (
        (tsStart < h.progres_timestamp[0] + SecToReview[h.progres_level[0]]) &&
        (tsEnd   > h.progres_timestamp[0] + SecToReview[h.progres_level[0]])
      ) {
        const lvl = h.progres_level[0];
        if (lvl < 5) apprentice++;
        else if (lvl < 7) guru++;
        else if (lvl === 7) master++;
        else if (lvl === 8) enlighted++;
      }
      if (
        (tsStart < h.progres_timestamp[1] + SecToReview[h.progres_level[1]]) &&
        (tsEnd   > h.progres_timestamp[1] + SecToReview[h.progres_level[1]])
      ) {
        const lvl = h.progres_level[1];
        if (lvl < 5) apprentice++;
        else if (lvl < 7) guru++;
        else if (lvl === 7) master++;
        else if (lvl === 8) enlighted++;
      }
    });

    resData.datasets[1].data[index] = apprentice ? apprentice : null;
    resData.datasets[2].data[index] = guru ? guru : null;
    resData.datasets[3].data[index] = master ? master : null;
    resData.datasets[4].data[index] = enlighted ? enlighted : null;
    resData.datasets[0].data[index] = (index < 1 ? 0 : resData.datasets[0].data[index - 1]) + apprentice + guru + master + enlighted;
  });

  // Define the chart configuration:
  const config = {
    type: 'line',
    data: resData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          type: 'category',
          grid: { color: '#3c3c3c' },
          ticks: {
            color: '#d8d8d8',
            font: { size: chartViewMode === 'week' ? 8 : 10 }
          },
          barPercentage: 0.5,
          categoryPercentage: 0.8
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: '#3c3c3c' },
          ticks: { color: '#d8d8d8' }
        }
      },
      plugins: {
        title: {
          display: true,
          text: chartViewMode === 'week' ? 'Upcoming Reviews (Weekly)' : 'Upcoming Reviews (Daily)'
        },
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 10,
            color: '#d8d8d8',

            generateLabels: function(chart) {
              var defaultItems = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              defaultItems.unshift({
                pointStyle: 'rectRounded',
                text: "Switch View",
                fontColor: '#d8d8d8',
                fillStyle: '#d8d8d8',
                hidden: false,
                viewToggle: true
              });
              return defaultItems;
            },
          },
          onClick: function(e, legendItem, legend) {
            if (legendItem.viewToggle) {
              if (chartViewMode === 'week') {chartViewMode = 'daily';} else {chartViewMode = 'week';}
              _fill_chart_js();
            } else {
              var index = legendItem.datasetIndex;
              if (typeof index !== "undefined") {
                var chart = legend.chart;
                var meta = chart.getDatasetMeta(index);
                meta.hidden = meta.hidden ? null : true;
                chart.update();
              }
            }
          }
        },
        tooltip: {
          backgroundColor: '#333',
          titleColor: '#fff',
          bodyColor: '#fff'
        }
      }
    }
  };

  // Obtain the canvas context and destroy any existing chart instance before creating a new one.
  const ctx = document.getElementById('stats-reviewChart').getContext('2d');
  if (Chart.getChart('stats-reviewChart')) { Chart.getChart('stats-reviewChart').destroy(); }
  new Chart(ctx, config);
}



function _fill_progress_bars() {
  const progressData = [];
  const progress_hieroglyphs = DB.hieroglyphs.filter(h => (h.level<=ProgressLevel));
  for (let i = ProgressLevel; i >= 1; i--) {
    const lvl_hieroglyphs = progress_hieroglyphs.filter(h => (h.level===i));
    const N = lvl_hieroglyphs.length;
    
    const rads = lvl_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.RADICAL));
    const rad_passed = rads.filter(h => (h.progres_level[0] >= 5) && (h.progres_level[1] >= 5)).length/N*100;
    const rad_apprentice = rads.filter(h => ((h.progres_level[0] < 5) || (h.progres_level[1] < 5)) && (h.progres_level[0] >= 0)).length/N*100;
    const rad_lessons = _count_active_lessons(i, HieroglyphType.RADICAL)/N*100;

    const kanji = lvl_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.KANJI));
    const kanji_passed = kanji.filter(h => (h.progres_level[0] >= 5) && (h.progres_level[1] >= 5)).length/N*100;
    const kanji_apprentice = kanji.filter(h => ((h.progres_level[0] < 5) || (h.progres_level[1] < 5)) && (h.progres_level[0] >= 0)).length/N*100;
    const kanji_lessons = _count_active_lessons(i, HieroglyphType.KANJI)/N*100;
    const kanji_locked = kanji.length/N*100 - (kanji_passed + kanji_apprentice + kanji_lessons);

    const vocab = lvl_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.VOCAB));
    const vocab_passed = vocab.filter(h => (h.progres_level[0] >= 5) && (h.progres_level[1] >= 5)).length/N*100;
    const vocab_apprentice = vocab.filter(h => ((h.progres_level[0] < 5) || (h.progres_level[1] < 5)) && (h.progres_level[0] >= 0)).length/N*100;
    const vocab_lessons = _count_active_lessons(i, HieroglyphType.VOCAB)/N*100;
    const vocab_locked = vocab.length/N*100 - (vocab_passed + vocab_apprentice + vocab_lessons);

    progressData.push({ rad_passed, rad_apprentice, rad_lessons, 
                        kanji_passed, kanji_apprentice, kanji_lessons, 
                        vocab_passed, vocab_apprentice, vocab_lessons, 
                        kanji_locked, vocab_locked,});
  }

  function _createSection(widthPercent, sectionClass, index) {
    const N = DB.hieroglyphs.filter(h => (h.level===index+1)).length;
    const section = document.createElement('div');
    section.classList.add('stats-progress-bar-section', sectionClass);
    section.style.width = `${widthPercent}%`;

    if (widthPercent*N/100 > 1) {
      const textLabel = document.createElement('span');
      textLabel.classList.add('progress-text');
      textLabel.textContent = `${(widthPercent*N/100).toFixed(0)}`;
      section.appendChild(textLabel);
    }
    
    return section;
    }

  const container = document.getElementById('stats-progress-container');
  container.innerHTML = '';

  progressData.forEach((entry, index) => {
    index = ProgressLevel - index - 1;
    const levelRow = document.createElement('div');
    levelRow.classList.add('stats-level-row');

    const label = document.createElement('div');
    label.classList.add('stats-label');
    label.textContent = `Lvl ${index + 1}`;

    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.classList.add('stats-progress-bar-wrapper');

    const progressBar = document.createElement('div');
    progressBar.classList.add('stats-progress-bar');

    progressBar.appendChild(_createSection(entry.rad_passed, 'stats-rad-passed', index));
    progressBar.appendChild(_createSection(entry.rad_apprentice, 'stats-rad-apprentice', index));
    progressBar.appendChild(_createSection(entry.rad_lessons, 'stats-rad-lessons', index));

    progressBar.appendChild(_createSection(entry.kanji_passed, 'stats-kanji-passed', index));
    progressBar.appendChild(_createSection(entry.kanji_apprentice, 'stats-kanji-apprentice', index));
    progressBar.appendChild(_createSection(entry.kanji_lessons, 'stats-kanji-lessons', index));

    progressBar.appendChild(_createSection(entry.vocab_passed, 'stats-vocab-passed', index));
    progressBar.appendChild(_createSection(entry.vocab_apprentice, 'stats-vocab-apprentice', index));
    progressBar.appendChild(_createSection(entry.vocab_lessons, 'stats-vocab-lessons', index));
    
    progressBar.appendChild(_createSection(entry.kanji_locked, 'stats-kanji-locked', index));
    progressBar.appendChild(_createSection(entry.vocab_locked, 'stats-vocab-locked', index));

    progressBarWrapper.appendChild(progressBar);
    levelRow.appendChild(label);
    levelRow.appendChild(progressBarWrapper);
    container.appendChild(levelRow);
  });

}


function _fill_hieroglyph_stats() {
  const progress_hieroglyphs = DB.hieroglyphs.filter(h => (h.level<=ProgressLevel));

  const apprentice = progress_hieroglyphs.filter(h => ((h.progres_level[0] < 5) || (h.progres_level[1] < 5)) && (h.progres_level[0] > 0)).length;
  const guru = progress_hieroglyphs.filter(h => ((h.progres_level[0] >= 5) && (h.progres_level[1] >= 5) && ((h.progres_level[0] < 7) || (h.progres_level[1] < 7)))).length;
  const master = progress_hieroglyphs.filter(h => ((h.progres_level[0] >= 7) && (h.progres_level[1] >= 7) && ((h.progres_level[0] < 8) || (h.progres_level[1] < 8)))).length;
  const enlighted = progress_hieroglyphs.filter(h => ((h.progres_level[0] >= 8) && (h.progres_level[1] >=8) && ((h.progres_level[0] < 9) || (h.progres_level[1] < 9)))).length;
  const burned = progress_hieroglyphs.filter(h => (h.progres_level[0] === 9 && h.progres_level[1] === 9)).length;

  const radical = progress_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.RADICAL) && (h.progres_level[0] > 0)).length;
  const kanji = progress_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.KANJI) && (h.progres_level[0] > 0)).length;
  const vocab = progress_hieroglyphs.filter(h => (h.hieroglyph_type===HieroglyphType.VOCAB) && (h.progres_level[0] > 0)).length;

  document.getElementById('stats-box-apprentice').innerHTML = "Apprentice" + "<br>" + apprentice;
  document.getElementById('stats-box-guru').innerHTML = "Guru" + "<br>" + guru;
  document.getElementById('stats-box-master').innerHTML = "Master" + "<br>" + master;
  document.getElementById('stats-box-enlightened').innerHTML = "Enlightened" + "<br>" + enlighted;
  document.getElementById('stats-box-burned').innerHTML = "Burned" + "<br>" + burned;
  document.getElementById('stats-box-radical').innerHTML = "Radical" + "<br>" + radical;
  document.getElementById('stats-box-kanji').innerHTML = "Kanji" + "<br>" + kanji;
  document.getElementById('stats-box-vocab').innerHTML = "Vocabulary" + "<br>" + vocab;
}