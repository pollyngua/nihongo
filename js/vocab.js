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
      const audioFiles = typeof word.audio === "string"
        ? word.audio.split(",").map(a => a.trim())
        : word.audio;

      // split kana into parts (only kana)
      const kanaParts = word.kana.split(/\s*[|/]\s*/);

      // split separators (keep them)
      const separators = word.kana.match(/\s*[|/]\s*/g) || [];

      const count = kanaParts.length;

      for (let i = 0; i < count; i++) {
        // kana
        const span = document.createElement("span");
        span.className = "kanaText";
        span.textContent = kanaParts[i];

        // audio button
        if (audioFiles[i]) {
          const btn = document.createElement("button");
          btn.className = "audioBtn";
          btn.type = "button";

          btn.addEventListener("click", e => {
            e.stopPropagation();
            const audioPlayer = new Audio(`audio/${audioFiles[i].trim()}.mp3`);
            audioPlayer.play().catch(() => {});
          });

          span.appendChild(btn); // ✅ key change
        }

        kanaEl.appendChild(span);

        // separator (if exists)
        if (separators[i]) {
          kanaEl.appendChild(document.createTextNode(separators[i]));
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

    // either display as they are with ;
    if (word.english.note) {
      englishHTML += ` <span class="note">${word.english.note}</span>`;
    }
    // or remove the ; and split into <i></i>s
    // if (word.english.note) {
    //   const formattedNote = word.english.note
    //     .split(";")
    //     .map(part => `<i>${part.trim()}</i>`)
    //     .join(" ");

    //   englishHTML += ` <span class="note">${formattedNote}</span>`;
    // }

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

  noKatakana: w => {
    if (!w.kana) return true;

    const kana = w.kana.replace(/\s*\|\s*/g, "");
    const isKatakanaOnly = /^[\u30A0-\u30FFー]+$/.test(kana);

    const hasKanji = w.kanji && w.kanji.trim() !== "";

    return !(isKatakanaOnly && !hasKanji);
  },

  kanji: w =>
    w.kanji && w.kanji.trim() !== "",

  verb: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("verb") && !note.includes("adverb");
  },

  noun: w => {
    const note = w.english.note?.toLowerCase() || "";
    return (
      note.includes("noun") &&
      !note.includes("pronoun") &&
      !note.includes("-noun")
    );
  },

  pronoun: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("pronoun");
  },

  adjective: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("adjectiv");
  },

  adverb: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("adverb");
  },

  expression: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("expression");
  },

  small: w => {
    const note = w.english.note?.toLowerCase() || "";
    return (
      note.includes("particle") ||
      note.includes("fix") ||
      note.includes("conjunction")
    );
  },

  numeric: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("numeric");
  },

  counter: w => {
    const note = w.english.note?.toLowerCase() || "";
    return note.includes("counter");
  },

  jlptn5: w => {
    const note = w.english.note || "";
    return note.includes("JLPT N5");
  },

  jlptn4: w => {
    const note = w.english.note || "";
    return note.includes("JLPT N4");
  },

  jlptn3: w => {
    const note = w.english.note || "";
    return note.includes("JLPT N3");
  },

  jlptn2: w => {
    const note = w.english.note || "";
    return note.includes("JLPT N2");
  },

  jlptn1: w => {
    const note = w.english.note || "";
    return note.includes("JLPT N1");
  }
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
