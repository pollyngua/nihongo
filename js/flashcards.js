// words.js must be loaded before this file.
// It defines: window.WORDS = [ { kanji, kana, english }, ... ];

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

  // last 100 filter
  if (last100Mode) {
    list = list.slice(-100);
  }

  // kanji-only filter
  if (kanjiOnlyMode) {
    list = list.filter(w => w.kanji && w.kanji.trim() !== "");
  }

  // POS / category filter
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

// ------------------- Display logic -------------------

function displayWord(word) {
  const hasKanji = word.kanji && word.kanji.trim() !== "";

  document.getElementById("kanji").textContent = hasKanji ? word.kanji : "";
  document.getElementById("kana").textContent = word.kana;

  let englishHTML = `<div class="main">${word.english.main}</div>`;

  if (word.english.note) {
    englishHTML += `<span class="note">${word.english.note}</span>`;
  }

  if (word.english.example) {
    englishHTML += `<div class="example">${word.english.example}</div>`;
  }

  document.getElementById("english").innerHTML = englishHTML;
  document.getElementById("english").classList.add("hidden");

  if (hasKanji) {
    document.getElementById("kana").classList.add("hidden");
    revealStage = 0;
  } else {
    document.getElementById("kana").classList.remove("hidden");
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
    let newWord;

    newWord = getNextFromDeck();

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
  if (revealStage === 0) {
    document.getElementById("kana").classList.remove("hidden");
    revealStage = 1;
  } else if (revealStage === 1) {
    document.getElementById("english").classList.remove("hidden");
    revealStage = 2;
  }
}

// ------------------- Event listeners -------------------

document.getElementById("card").addEventListener("click", revealStep);
document.getElementById("nextBtn").addEventListener("click", nextWord);
document.getElementById("prevBtn").addEventListener("click", previousWord);

// ------------------- Last 100 toggle -------------------

document.getElementById("last100Btn").addEventListener("click", () => {
  last100Mode = !last100Mode;
  document.getElementById("last100Btn").classList.toggle("active", last100Mode);

  recomputeCurrentList();
  resetProgress();
});

// ------------------- Kanji-only toggle -------------------

document.getElementById("kanjiBtn").addEventListener("click", () => {
  kanjiOnlyMode = !kanjiOnlyMode;

  const btn = document.getElementById("kanjiBtn");
  btn.textContent = kanjiOnlyMode ? "kanji only: ON" : "kanji only: OFF";
  btn.classList.toggle("active", kanjiOnlyMode);

  recomputeCurrentList();
  resetProgress();
});

// ------------------- POS dropdown -------------------

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

// ------------------- Counter -------------------

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
