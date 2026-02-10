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

    // --- kanji ---
    if (word.kanji) {
      const kanjiEl = document.createElement("div");
      kanjiEl.className = "kanji";
      kanjiEl.textContent = word.kanji;
      entry.appendChild(kanjiEl);
    }

    // --- kana with audio buttons ---
    const kanaEl = document.createElement("div");
    kanaEl.className = "kana";

    if (word.audio) {
      // If word.audio is a string with commas, split it
      const audioFiles = typeof word.audio === "string" ? word.audio.split(",") : word.audio;

      // Split kana by " / " if multiple readings
      const kanaParts = word.kana.split(" | ");

      const count = Math.max(kanaParts.length, audioFiles.length);

      for (let i = 0; i < count; i++) {
        // kana span
        const span = document.createElement("span");
        span.className = "kanaText";
        span.textContent = kanaParts[i] || kanaParts[0];
        kanaEl.appendChild(span);

        // audio button if audio exists
        if (audioFiles[i]) {
          const btn = document.createElement("button");
          btn.className = "audioBtn";
          btn.type = "button";
          btn.addEventListener("click", e => {
            e.stopPropagation();
            const audioPlayer = new Audio(`audio/${audioFiles[i].trim()}.mp3`);
            audioPlayer.play().catch(() => {});
          });
          kanaEl.appendChild(btn);
        }

        // optional separator between readings (can be removed if not needed)
        if (i < count - 1) {
          kanaEl.appendChild(document.createTextNode("\u00A0|\u00A0")); // space on each side
        }
      }
    } else {
      // no audio → just show kana
      const span = document.createElement("span");
    span.className = "kanaText";
    span.textContent = word.kana;
    kanaEl.appendChild(span);
    }

    entry.appendChild(kanaEl);

    // --- english ---
    const englishEl = document.createElement("div");
    englishEl.className = "english";

    let englishHTML = `<div class="main">${word.english.main}</div>`;
    if (word.english.note) {
      englishHTML += ` <span class="note">${word.english.note}</span>`;
    }
    if (word.english.example) {
      englishHTML += `<div class="example">${word.english.example}</div>`;
    }

    englishEl.innerHTML = englishHTML;
    entry.appendChild(englishEl);

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
