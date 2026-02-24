const container = document.getElementById("wordList");
const menu = document.getElementById("filterMenu");

// Store original labels for options
menu.querySelectorAll("option").forEach(opt => {
  opt.dataset.label = opt.textContent;
});

// Render function
function render(list) {
  container.innerHTML = "";

  list.forEach(word => {
    const entry = document.createElement("div");
    entry.className = "entry";

    // --- kanji ---
    const kanjiEl = document.createElement("div");
    kanjiEl.className = "kanji";
    kanjiEl.textContent = word.kanji;
    entry.appendChild(kanjiEl);

    // --- details ---
    const detailsEl = document.createElement("div");
    detailsEl.className = "details";

    let detailsHTML = `<span class="english">${word.english}</span>`;

    if (word.note) {
      detailsHTML += ` <span class="note">${word.note}</span>`;
    }

    if (word.kana) {
      detailsHTML += ` <div class="kana">${word.kana}</div>`;
    }

    if (word.parts) {
      detailsHTML += `<div class="parts">${word.parts}</div>`;
    }

    detailsEl.innerHTML = detailsHTML;
    entry.appendChild(detailsEl);

    // --- examples ---
    if (word.examples && word.examples.length > 0) {
      const examplesEl = document.createElement("div");
      examplesEl.className = "examples";

      word.examples.forEach(ex => {
        const exEntry = document.createElement("div");
        exEntry.className = "pair";

        exEntry.insertAdjacentHTML("beforeend", ex.word);

        const transSpan = document.createElement("div");
        transSpan.className = "en";
        transSpan.textContent = ex.trans;

        exEntry.appendChild(transSpan);

        examplesEl.appendChild(exEntry);
      });

      entry.appendChild(examplesEl);
    }

    container.appendChild(entry);
  });
}

// Filter map
const filters = {
  none: w => true,

  jlptn5: w =>
    w.note && w.note.includes("JLPT N5"),

  jlptn4: w =>
    w.note && w.note.includes("JLPT N4"),

  jlptn3: w =>
    w.note && w.note.includes("JLPT N3"),

  jlptn2: w =>
    w.note && w.note.includes("JLPT N2"),

  jlptn1: w =>
    w.note && w.note.includes("JLPT N1")
};

// Update dropdown counts
function updateDropdownCounts() {
  menu.querySelectorAll("option").forEach(opt => {
    const key = opt.value;
    const count = window.WORDS.filter(filters[key]).length;
    opt.textContent = `${opt.dataset.label} [${count}]`;
  });
}

// Apply filter
function applyFilter() {
  const choice = menu.value;
  const filteredList = window.WORDS.filter(filters[choice]);
  render(filteredList);
}

// Initial setup
updateDropdownCounts();
render(window.WORDS);

// Dropdown change listener
menu.addEventListener("change", applyFilter);
