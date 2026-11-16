const container = document.getElementById("wordList");
const menu = document.getElementById("filterMenu");

// Store original labels for options
menu.querySelectorAll("option").forEach(opt => {
  opt.dataset.label = opt.textContent;
});

function splitJapaneseAlternatives(html, separator = "|") {
  const parts = [];
  const separators = [];

  let current = "";
  let insideTag = false;

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    if (char === "<") insideTag = true;
    if (char === ">") insideTag = false;

    if (!insideTag && html.startsWith(separator, i)) {
      parts.push(current);
      current = "";

      let sep = separator;
      i++;

      while (html[i] === " ") {
        sep += html[i];
        i++;
      }

      separators.push(sep);
      i--;
      continue;
    }

    current += char;
  }

  parts.push(current);

  return { parts, separators };
}

// Function to render a list of words
function render(list) {
  container.innerHTML = "";

  list.forEach(word => {
    const entry = document.createElement("div");
    entry.className = "entry";

    // --- japanese + audio buttons ---
    const japaneseEl = document.createElement("div");
    japaneseEl.className = "japanese";

    const japaneseText = word.japanese || word.kana || "";

    const audioFiles = word.audio
      ? (typeof word.audio === "string"
          ? word.audio.split(",").map(a => a.trim())
          : word.audio)
      : [];

    const { parts: japaneseParts, separators } =
      splitJapaneseAlternatives(japaneseText);

    let audioIndex = 0;

    for (let i = 0; i < japaneseParts.length; i++) {
      if (i > 0 && separators[i - 1]) {
        japaneseEl.appendChild(
          document.createTextNode(
            separators[i - 1].replace(/ /g, "\u00A0")
          )
        );
      }

      const wordSpan = document.createElement("span");
      wordSpan.className = "word";

      const { parts: forms, separators: formSeparators } =
        splitJapaneseAlternatives(japaneseParts[i], "/");

      for (let j = 0; j < forms.length; j++) {
        wordSpan.insertAdjacentHTML("beforeend", forms[j].trim());

        if (audioFiles[audioIndex]) {
          const btn = document.createElement("button");
          btn.className = "audioBtn";
          btn.type = "button";

          const audioFile = audioFiles[audioIndex];

          btn.addEventListener("click", e => {
            e.stopPropagation();
            const audio = new Audio(`audio/${audioFile}.mp3`);
            audio.play().catch(() => {});
          });

          wordSpan.appendChild(btn);
        }

        audioIndex++;

        if (j < forms.length - 1) {
          wordSpan.appendChild(
            document.createTextNode(
              formSeparators[j].replace(/ /g, "\u00A0")
            )
          );
        }
      }

      if (wordSpan.querySelector(".audioBtn")) {
        wordSpan.classList.add("has-audio");
      }

      japaneseEl.appendChild(wordSpan);
    }

    entry.appendChild(japaneseEl);

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
