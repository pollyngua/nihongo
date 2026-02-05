const container = document.getElementById("wordList");
const menu = document.getElementById("filterMenu");

// Store original labels for options
menu.querySelectorAll("option").forEach(opt => {
  opt.dataset.label = opt.textContent;
});

// Function to render a list of words
function render(list) {
  container.innerHTML = "";

  list.forEach(word => {
    const entry = document.createElement("div");
    entry.className = "entry";

    let html = "";

    if (word.kanji) {
      html += `<div class="kanji">${word.kanji}</div>`;
    }

    html += `<div class="kana">${word.kana}</div>`;
    html += `<div class="english">`;
    html += `<div class="main">${word.english.main}</div>`;

    if (word.english.note) {
      html += ` <span class="note">${word.english.note}</span>`;
    }

    if (word.english.example) {
      html += `<div class="example">${word.english.example}</div>`;
    }

    html += `</div>`;

    entry.innerHTML = html;
    container.appendChild(entry);
  });
}

// Map of filter functions for each dropdown option
const filters = {
  none: w => true,

  kanji: w =>
    w.kanji && w.kanji.trim() !== "",

  verb: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("verb") &&
    !w.english.note.toLowerCase().includes("adverb"),

  noun: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("noun") &&
    !w.english.note.toLowerCase().includes("pronoun") &&   // exclude pronouns
    !w.english.note.toLowerCase().includes("-noun"),       // exclude e.g. pre-noun adjectival

  pronoun: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("pronoun"),

  adjective: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("adjectiv"),

  adverb: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("adverb"),

  expression: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("expression"),

  small: w =>
    w.english.note &&
    (
      w.english.note.toLowerCase().includes("particle") ||
      w.english.note.toLowerCase().includes("fix") ||
      w.english.note.toLowerCase().includes("conjunction")
    ),

  numeric: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("numeric"),

  counter: w =>
    w.english.note &&
    w.english.note.toLowerCase().includes("counter"),

  jlptn5: w =>
    w.english.note &&
    w.english.note.includes("JLPT N5"),

  jlptn4: w =>
    w.english.note &&
    w.english.note.includes("JLPT N4"),

  jlptn3: w =>
    w.english.note &&
    w.english.note.includes("JLPT N3"),

  jlptn2: w =>
    w.english.note &&
    w.english.note.includes("JLPT N2"),

  jlptn1: w =>
    w.english.note &&
    w.english.note.includes("JLPT N1")
};


// Update dropdown labels to include counts
function updateDropdownCounts() {
  menu.querySelectorAll("option").forEach(opt => {
    const key = opt.value;
    const count = window.WORDS.filter(filters[key]).length;
    opt.textContent = `${opt.dataset.label} [${count}]`;
  });
}

// Apply the selected filter
function applyFilter() {
  const choice = menu.value;
  const filteredList = window.WORDS.filter(filters[choice]);
  render(filteredList);
}

// Initial setup
updateDropdownCounts();
render(window.WORDS);

// Update display when dropdown changes
menu.addEventListener("change", applyFilter);
