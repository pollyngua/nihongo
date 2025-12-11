// words.js must be loaded before this file.
// It defines: window.WORDS = [ { kanji, kana, english }, ... ];

let words = window.WORDS;
let revealStage = 0;

let history = [];
let currentIndex = -1;

// Modes: "random" or "norepeat"
let mode = "norepeat";
let deck = [];

// Last-50 mode
let last50Mode = false;

// Kanji-only mode
let kanjiOnlyMode = false;

// This will always contain the *active* filtered list
let currentWordList = words;

// Track unique words
let uniqueSeen = new Set();

// ------------------- FILTER PIPELINE -------------------

function recomputeCurrentList() {
  let list = words;

  // apply last-50 filter first if active
  if (last50Mode) {
    list = list.slice(-50);
  }

  // apply kanji filter
  if (kanjiOnlyMode) {
    list = list.filter(w => w.kanji && w.kanji.trim() !== "");
  }

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
  if (currentWordList.length === 0) return; // avoid crash if filters empty

  if (currentIndex < history.length - 1) {
    currentIndex++;
    displayWord(history[currentIndex]);
  } else {
    let newWord;

    if (mode === "random") {
      const i = Math.floor(Math.random() * currentWordList.length);
      newWord = currentWordList[i];
    } else {
      newWord = getNextFromDeck();
    }

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

// ------------------- Mode button -------------------

document.getElementById("modeBtn").addEventListener("click", () => {
  if (mode === "random") {
    mode = "norepeat";
    document.getElementById("modeBtn").textContent = "mode: no repeats";
    buildDeck();
  } else {
    mode = "random";
    document.getElementById("modeBtn").textContent = "mode: random";
  }

  history = [];
  currentIndex = -1;
  uniqueSeen.clear();
  updateUniqueCounter();
  nextWord();
});

// ------------------- Last 50 toggle -------------------

document.getElementById("last50Btn").addEventListener("click", () => {
  last50Mode = !last50Mode;

  // update UI
  document.getElementById("last50Btn").classList.toggle("active", last50Mode);

  // rebuild list
  recomputeCurrentList();

  history = [];
  currentIndex = -1;
  uniqueSeen.clear();
  updateUniqueCounter();

  if (mode === "norepeat") buildDeck();
  nextWord();
});

// ------------------- Kanji-only toggle -------------------

document.getElementById("kanjiBtn").addEventListener("click", () => {
  kanjiOnlyMode = !kanjiOnlyMode;

  const btn = document.getElementById("kanjiBtn");

  btn.textContent = kanjiOnlyMode
    ? "kanji only: ON"
    : "kanji only: OFF";

  // add/remove active class
  btn.classList.toggle("active", kanjiOnlyMode);

  recomputeCurrentList();

  history = [];
  currentIndex = -1;
  uniqueSeen.clear();
  updateUniqueCounter();

  if (mode === "norepeat") buildDeck();
  nextWord();
});

// ------------------- Counter -------------------

function updateUniqueCounter() {
  const total = currentWordList.length;
  const seen = uniqueSeen.size;
  document.getElementById("uniqueCounter").innerHTML = `<span class="seen">${seen}</span>/${total}`;
}

// ------------------- Keyboard controls -------------------

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    revealStep();
  } else if (e.code === "ArrowRight") {
    nextWord();
  } else if (e.code === "ArrowLeft") {
    previousWord();
  }
});

// ------------------- Swipe gestures (mobile) -------------------

const card = document.getElementById("card");

let startX = 0;
let startY = 0;
let moved = false;

card.addEventListener("touchstart", e => {
  const t = e.changedTouches[0];
  startX = t.clientX;
  startY = t.clientY;
  moved = false;
}, { passive: true });

card.addEventListener("touchmove", e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  // mark that the user actually moved
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    moved = true;
  }

  // prevent vertical scrolling conflicts while swiping horizontally
  if (Math.abs(dx) > Math.abs(dy)) {
    e.preventDefault();
  }
}, { passive: false }); // IMPORTANT: must not be passive

card.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  const swipeX = 50;    // minimum horizontal movement
  const swipeYMax = 40; // vertical tolerance

  // If the user moved enough horizontally => swipe
  if (Math.abs(dx) > swipeX && Math.abs(dy) < swipeYMax) {
    if (dx > 0) previousWord();
    else nextWord();
    return;
  }

  // If movement was tiny => treat as tap (reveal)
  if (!moved) {
    revealStep();
  }
});

// ------------------- Initialize -------------------

recomputeCurrentList();
buildDeck();
document.getElementById("modeBtn").textContent = "mode: no repeats";
nextWord();
