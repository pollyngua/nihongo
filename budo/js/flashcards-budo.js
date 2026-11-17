// words.js must be loaded before this file.
// It defines: window.WORDS = [ { kanji, kana, english, audio? }, ... ];

let words = window.WORDS;
let revealStage = 0;

let history = [];
let currentIndex = -1;

let deck = [];

// Selected POS / category filter key
let posFilter = "all";

// Active filtered list
let currentWordList = words;

// Track unique words
let uniqueSeen = new Set();

// ------------------- FILTER PIPELINE -------------------

function recomputeCurrentList() {
  let list = words;

  if (posFilter !== "all") {
    list = list.filter(word =>
      word.english.note?.split(";").map(item => item.trim()).includes(posFilter)
    );
  }

  currentWordList = list;
}

// counter

function updateCategoryCounts() {
  const counts = {};

  for (const word of words) {
    const categories = word.english.note
      ?.split(";")
      .map(item => item.trim()) || [];

    for (const category of categories) {
      counts[category] = (counts[category] || 0) + 1;
    }
  }

  const select = document.getElementById("posFilter");

  for (const option of select.options) {
    const count = option.value === "all"
      ? words.length
      : counts[option.value] || 0;

    option.textContent = `${option.value === "all" ? "all" : option.textContent.replace(/\s*\[\d+\]$/, "")} [${count}]`;
  }
}

// ------------------- Deck helpers -------------------

function buildDeck() {
  deck = [...currentWordList];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function getNextFromDeck() {
  if (deck.length === 0) {
    buildDeck();
  }
  return deck.shift();
}

// ------------------- Audio -------------------

const audioPlayer = new Audio();

function playAudioFile(file) {
  audioPlayer.src = `audio/${file}.mp3`;
  audioPlayer.currentTime = 0;
  audioPlayer.play().catch(() => {});
}

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
    // Detect HTML tags and keep their contents together.
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

    // Split only at separators OUTSIDE HTML tags.
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

// ------------------- Display logic -------------------

function displayWord(word) {
  const hasKanji = word.kanji && word.kanji.trim() !== "";

  const japaneseEl = document.getElementById("japanese");
  const englishEl = document.getElementById("english");

  // ---- render Japanese + audio buttons ----
  japaneseEl.innerHTML = "";

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

    // Add the separator between alternative readings.
    if (i > 0 && separators[i - 1]) {
      japaneseEl.appendChild(
        document.createTextNode(
          separators[i - 1].replace(/ /g, "\u00A0")
        )
      );
    }

    // One .word span per | alternative.
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";

    // Split this alternative into /-separated forms.
    const { parts: forms, separators: formSeparators } =
      splitJapaneseAlternatives(japaneseParts[i], "/");

    for (let j = 0; j < forms.length; j++) {

      // Add the form itself.
      wordSpan.insertAdjacentHTML(
        "beforeend",
        forms[j]
      );

      // Add its corresponding audio button.
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

      // Add the slash between related forms.
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

  // Reset furigana visibility for each new word.
  japaneseEl.classList.remove("show-furigana");

  // Kana-only words have no furigana to reveal.
  if (!hasKanji) {
    japaneseEl.classList.add("show-furigana");
  }

  // ---- render English ----
  let englishHTML = "";

  if (word.english.romaji) {
    englishHTML += `<span class="romaji">${word.english.romaji}</span>`;
  }

  englishHTML += `<div class="main">${word.english.main}</div>`;

  if (word.english.note) {
    englishHTML += `<span class="note">${word.english.note}</span>`;
  }

  if (word.english.kanjiBreakdown?.length) {
    englishHTML += `<div class="kanjiBreakdown">`;

    for (const [ruby, translation, extraClass] of word.english.kanjiBreakdown) {
      englishHTML += `
        <div class="pair ${extraClass || ""}">
          ${ruby}
          <div class="en">${translation}</div>
        </div>
      `;
    }

    englishHTML += `</div>`;
  }

  if (word.english.source) {
    englishHTML += `<div class="source">`;

    const sources = word.english.source.split(",");

    sources.forEach((item, index) => {
      const source = item.trim();

      if (index > 0) {
        englishHTML += ", ";
      }

      if (source.includes("|")) {
        const [text, url] = source.split("|", 2);
        englishHTML += `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${text.trim()}</a>`;
      } else if (/^https?:\/\//i.test(source)) {
        englishHTML += `<a href="${source}" target="_blank" rel="noopener noreferrer">source</a>`;
      } else {
        englishHTML += `<span>${source}</span>`;
      }
    });

    englishHTML += `</div>`;
  }

  englishEl.innerHTML = englishHTML;
  englishEl.classList.add("hidden");

  revealStage = hasKanji ? 0 : 1;
}

// ------------------- Navigation -------------------

function nextWord() {
  if (currentWordList.length === 0) return;

  if (currentIndex < history.length - 1) {
    currentIndex++;
    displayWord(history[currentIndex]);
  } else {
    const newWord = getNextFromDeck();
    history.push(newWord);
    currentIndex = history.length - 1;

    uniqueSeen.add(newWord);
    updateUniqueCounter();

    displayWord(newWord);
  }
}

function previousWord() {
  if (currentIndex > 0) {
    currentIndex--;
    displayWord(history[currentIndex]);
  }
}

// ------------------- Reveal logic -------------------

function revealStep() {
  const japaneseEl = document.getElementById("japanese");
  const englishEl = document.getElementById("english");

  if (revealStage === 0) {
    japaneseEl.classList.add("show-furigana");
    revealStage = 1;
  } else if (revealStage === 1) {
    englishEl.classList.remove("hidden");
    revealStage = 2;
  }
}

// ------------------- Event listeners -------------------

document.getElementById("card").addEventListener("click", revealStep);
document.getElementById("nextBtn").addEventListener("click", nextWord);
document.getElementById("prevBtn").addEventListener("click", previousWord);

document.getElementById("posFilter").addEventListener("change", e => {
  posFilter = e.target.value;
  recomputeCurrentList();
  resetProgress();
});

// ------------------- Helpers -------------------

function resetProgress() {
  history = [];
  currentIndex = -1;
  uniqueSeen.clear();
  updateUniqueCounter();

  buildDeck();
  nextWord();
}

function updateUniqueCounter() {
  const total = currentWordList.length;
  const seen = uniqueSeen.size;
  document.getElementById("uniqueCounter").innerHTML =
    `<span class="seen">${seen}</span>/${total}`;
}

// ------------------- Keyboard controls -------------------

document.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    revealStep();
  } else if (e.code === "ArrowRight") {
    nextWord();
  } else if (e.code === "ArrowLeft") {
    previousWord();
  }
});

// ------------------- Initialize -------------------

updateCategoryCounts();
recomputeCurrentList();
buildDeck();
nextWord();
