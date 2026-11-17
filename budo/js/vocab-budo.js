
const container = document.getElementById("wordList");
const menu = document.getElementById("filterMenu");

// Split Japanese alternatives without splitting inside HTML tags.
function splitJapaneseAlternatives(html, separator = "|") {
  const parts = [];
  const separators = [];
  const tagStack = [];
  const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr",
    "img", "input", "link", "meta", "param",
    "source", "track", "wbr"
  ]);

  let current = "";

  for (let i = 0; i < html.length; i++) {
    if (html[i] === "<") {
      const match = html.slice(i).match(
        /^<\s*(\/?)\s*([a-zA-Z][\w-]*)\b[^>]*>/
      );

      if (match) {
        const tag = match[2].toLowerCase();

        if (match[1]) {
          tagStack.pop();
        } else if (
          !voidTags.has(tag) &&
          !match[0].endsWith("/>")
        ) {
          tagStack.push(tag);
        }

        current += match[0];
        i += match[0].length - 1;
        continue;
      }
    }

    if (
      tagStack.length === 0 &&
      html[i] === separator
    ) {
      let before = "";

      while (current.length > 0 && /\s/.test(current.slice(-1))) {
        before = current.slice(-1) + before;
        current = current.slice(0, -1);
      }

      let after = "";
      let j = i + 1;

      while (j < html.length && /\s/.test(html[j])) {
        after += html[j];
        j++;
      }

      parts.push(current);
      separators.push(before + html[i] + after);

      current = "";
      i = j - 1;
      continue;
    }

    current += html[i];
  }

  parts.push(current);

  return { parts, separators };
}

// Get the categories attached to a word.
function getCategories(word) {
  return (word.english.note || "")
    .split(";")
    .map(item => item.trim())
    .filter(Boolean);
}

// Build the category dropdown.
function updateDropdownCounts() {
  const categories = new Set();

  window.WORDS.forEach(word => {
    getCategories(word).forEach(category => {
      categories.add(category);
    });
  });

  // Keep the "show all" option.
  menu.innerHTML = '<option value="all">show all</option>';

  categories.forEach(category => {
    const count = window.WORDS.filter(word =>
      getCategories(word).includes(category)
    ).length;

    const option = document.createElement("option");
    option.value = category;
    option.textContent = `${category} [${count}]`;

    menu.appendChild(option);
  });

  menu.options[0].textContent =
    `show all [${window.WORDS.length}]`;
}

// Render a list of words.
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
        wordSpan.insertAdjacentHTML(
          "beforeend",
          forms[j].trim()
        );

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

    let englishHTML = "";

    if (word.english.romaji) {
      englishHTML +=
        `<span class="romaji">${word.english.romaji}</span>`;
    }

    englishHTML +=
      `<div class="main">${word.english.main}</div>`;

    if (word.english.note) {
      englishHTML +=
        `<span class="note">${word.english.note}</span>`;
    }

    // --- kanji breakdown ---
    if (word.english.kanjiBreakdown?.length) {
      englishHTML += `<div class="kanjiBreakdown">`;

      word.english.kanjiBreakdown.forEach(([ruby, translation, extraClass]) => {
        englishHTML += `
          <div class="pair ${extraClass || ""}">
            ${ruby}
            <div class="en">${translation}</div>
          </div>
        `;
      });

      englishHTML += `</div>`;
    }

    // --- sources ---
    if (word.english.source) {
      const sources = word.english.source
        .split(",")
        .map(source => source.trim())
        .filter(Boolean);

      englishHTML += `<div class="source">`;

      sources.forEach((source, index) => {
        if (index > 0) {
          englishHTML += ", ";
        }

        const separatorIndex = source.indexOf("|");

        if (separatorIndex !== -1) {
          const text = source.slice(0, separatorIndex).trim();
          const url = source.slice(separatorIndex + 1).trim();

          englishHTML +=
            `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        } else if (/^https?:\/\//i.test(source)) {
          englishHTML +=
            `<a href="${source}" target="_blank" rel="noopener noreferrer">source</a>`;
        } else {
          englishHTML += `<span>${source}</span>`;
        }
      });

      englishHTML += `</div>`;
    }

    englishEl.innerHTML = englishHTML;
    entry.appendChild(englishEl);

    englishEl.innerHTML = englishHTML;
    entry.appendChild(englishEl);

    container.appendChild(entry);
  });
}

// Apply the selected category filter.
function applyFilter() {
  const choice = menu.value;

  const filteredList = choice === "all"
    ? sortedWords
    : sortedWords.filter(word =>
        getCategories(word).includes(choice)
      );

  render(filteredList);
}

// Initial setup.
const sortedWords = [...window.WORDS].sort((a, b) => {
  const getSortKey = word =>
    (word.english.romaji || "")
      .replace(/^\([^)]*\)/, "")
      .trim();

  return getSortKey(a).localeCompare(
    getSortKey(b),
    "en",
    { sensitivity: "base" }
  );
});

updateDropdownCounts();
render(sortedWords);

menu.addEventListener("change", applyFilter);
