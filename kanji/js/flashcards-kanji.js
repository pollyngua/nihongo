// words.js must be loaded before this file.
// It defines: window.WORDS = [ { kanji, kana, details }, ... ];

let words = window.WORDS;
let revealStage = 0;

let history = [];
let currentIndex = -1;

let deck = [];

// Last 100 mode
let last100Mode = false;

// Kanji-only mode
// let kanjiOnlyMode = false;

// Selected POS / category filter key
let posFilter = "all";

// Active filtered list
let currentWordList = words;

// Track unique words
let uniqueSeen = new Set();

// ------------------- POS FILTER MAP -------------------

const filters = {
  all: w => true,
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

// ------------------- FILTER PIPELINE -------------------

function recomputeCurrentList() {
  let list = words;

  if (last100Mode) {
    list = list.slice(-100);
  }

  // if (kanjiOnlyMode) {
  //   list = list.filter(w => w.kanji && w.kanji.trim() !== "");
  // }

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
  const kanjiEl = document.getElementById("kanji");
  const kanaEl = document.getElementById("kana");
  const detailsEl = document.getElementById("details");

  // ------------------- KANJI -------------------
  kanjiEl.textContent = word.kanji || "";

  // ------------------- KANA (plain string, no wrapper div) -------------------
  kanaEl.textContent = word.kana || "";
  kanaEl.classList.add("hidden");

  // ------------------- DETAILS -------------------
  let detailsHTML = "";

  // ---- PARTS ----
  if (word.parts) {
    detailsHTML += `<div class="parts">${word.parts}</div>`;
  }

  // ---- ENGLISH ----
  if (word.english) {
    detailsHTML += `<div class="english">${word.english}</div>`;
  }

  // ---- NOTE ----
  if (word.note) {
    detailsHTML += `<span class="note">${word.note}</span>`;
  }

  // ---- EXAMPLES ----
  if (word.examples && word.examples.length > 0) {
    detailsHTML += `<div class="examples">`;

    word.examples.forEach(ex => {
      detailsHTML += `
        <div class="pair">
          ${ex.word}
          <span class="en">${ex.trans}</span>
        </div>
      `;
    });

    detailsHTML += `</div>`;
  }

  detailsEl.innerHTML = detailsHTML;
  detailsEl.classList.add("hidden");

  revealStage = 0;
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
  const detailsEl = document.getElementById("details");

  if (revealStage === 0) {
    kanaEl.classList.remove("hidden");
    revealStage = 1;
  } else if (revealStage === 1) {
    detailsEl.classList.remove("hidden");
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

// document.getElementById("kanjiBtn").addEventListener("click", () => {
//   kanjiOnlyMode = !kanjiOnlyMode;

//   const btn = document.getElementById("kanjiBtn");
//   btn.textContent = kanjiOnlyMode ? "kanji only: ON" : "kanji only: OFF";
//   btn.classList.toggle("active", kanjiOnlyMode);

//   recomputeCurrentList();
//   resetProgress();
// });

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
