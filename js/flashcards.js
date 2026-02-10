// words.js must be loaded before this file.
// It defines: window.WORDS = [ { kanji, kana, english, audio? }, ... ];

let words = window.WORDS;
let revealStage = 0;

let history = [];
let currentIndex = -1;

let deck = [];

// Last 100 mode
let last100Mode = false;

// Kanji-only mode
let kanjiOnlyMode = false;

// Selected POS / category filter key
let posFilter = "all";

// Active filtered list
let currentWordList = words;

// Track unique words
let uniqueSeen = new Set();

// ------------------- POS FILTER MAP -------------------

const filters = {
  all: w => true,
  verb: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("verb") &&
    !w.english.note.toLowerCase().includes("adverb"),
  noun: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("noun") &&
    !w.english.note.toLowerCase().includes("pronoun") &&
    !w.english.note.toLowerCase().includes("-noun"),
  pronoun: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("pronoun"),
  adjective: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("adjectiv"),
  adverb: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("adverb"),
  expression: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("expression"),
  small: w =>
    w.english?.note &&
    (
      w.english.note.toLowerCase().includes("particle") ||
      w.english.note.toLowerCase().includes("fix") ||
      w.english.note.toLowerCase().includes("conjunction")
    ),
  numeric: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("numeric"),
  counter: w =>
    w.english?.note &&
    w.english.note.toLowerCase().includes("counter"),
  jlptn5: w =>
    w.english?.note &&
    w.english.note.includes("JLPT N5"),
  jlptn4: w =>
    w.english?.note &&
    w.english.note.includes("JLPT N4"),
  jlptn3: w =>
    w.english?.note &&
    w.english.note.includes("JLPT N3"),
  jlptn2: w =>
    w.english?.note &&
    w.english.note.includes("JLPT N2"),
  jlptn1: w =>
    w.english?.note &&
    w.english.note.includes("JLPT N1")
};

// ------------------- FILTER PIPELINE -------------------

function recomputeCurrentList() {
  let list = words;

  if (last100Mode) {
    list = list.slice(-100);
  }

  if (kanjiOnlyMode) {
    list = list.filter(w => w.kanji && w.kanji.trim() !== "");
  }

  const filterFn = filters[posFilter] || filters.all;
  list = list.filter(filterFn);

  currentWordList = list;
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

// ------------------- Display logic -------------------

function displayWord(word) {
  const hasKanji = word.kanji && word.kanji.trim() !== "";

  const kanjiEl = document.getElementById("kanji");
  const kanaEl = document.getElementById("kana");
  const englishEl = document.getElementById("english");

  kanjiEl.textContent = hasKanji ? word.kanji : "";

  // ---- render kana + audio buttons ----
  kanaEl.innerHTML = "";

  if (word.audio) {
    // split kana into parts for multiple readings (separated by " | ")
    const kanaParts = word.kana.split(" | ").map(s => s.trim());

    // split audio string by commas into multiple files
    const audioFiles = Array.isArray(word.audio)
      ? word.audio.map(a => a.file) // backwards compatibility
      : word.audio.split(",").map(s => s.trim());

    const count = Math.max(kanaParts.length, audioFiles.length);

    for (let i = 0; i < count; i++) {
      // create kana span
      const span = document.createElement("span");
      span.className = "kanaText";
      span.textContent = kanaParts[i] || kanaParts[0]; // fallback to first kana
      kanaEl.appendChild(span);

      // create audio button if file exists
      if (audioFiles[i]) {
        const btn = document.createElement("button");
        btn.className = "audioBtn";
        btn.type = "button";
        btn.addEventListener("click", e => {
          e.stopPropagation();

          // play the file directly using your existing audioPlayer
          audioPlayer.src = `audio/${audioFiles[i]}.mp3`;
          audioPlayer.currentTime = 0;
          audioPlayer.play().catch(() => {});
        });
        kanaEl.appendChild(btn);
      }
      // add separator between pairs, except after the last one
      if (i < count - 1) {
        kanaEl.appendChild(document.createTextNode("\u00A0|\u00A0"));
      }
    }
  } else {
    // no audio → just show kana text
    const span = document.createElement("span");
    span.className = "kanaText";
    span.textContent = word.kana;
    kanaEl.appendChild(span);
  }

  // ---- render english ----
  let englishHTML = `<div class="main">${word.english.main}</div>`;
  if (word.english.note) {
    englishHTML += `<span class="note">${word.english.note}</span>`;
  }
  if (word.english.example) {
    englishHTML += `<div class="example">${word.english.example}</div>`;
  }

  englishEl.innerHTML = englishHTML;
  englishEl.classList.add("hidden");

  // ---- reveal logic ----
  if (hasKanji) {
    kanaEl.classList.add("hidden");
    revealStage = 0;
  } else {
    kanaEl.classList.remove("hidden");
    revealStage = 1;
  }
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
  const kanaEl = document.getElementById("kana");
  const englishEl = document.getElementById("english");

  if (revealStage === 0) {
    kanaEl.classList.remove("hidden");
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

document.getElementById("last100Btn").addEventListener("click", () => {
  last100Mode = !last100Mode;
  document.getElementById("last100Btn").classList.toggle("active", last100Mode);
  recomputeCurrentList();
  resetProgress();
});

document.getElementById("kanjiBtn").addEventListener("click", () => {
  kanjiOnlyMode = !kanjiOnlyMode;

  const btn = document.getElementById("kanjiBtn");
  btn.textContent = kanjiOnlyMode ? "kanji only: ON" : "kanji only: OFF";
  btn.classList.toggle("active", kanjiOnlyMode);

  recomputeCurrentList();
  resetProgress();
});

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

recomputeCurrentList();
buildDeck();
nextWord();
