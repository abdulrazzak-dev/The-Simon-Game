const colors = ["green", "red", "yellow", "blue"];
const freqs = { green: 329.63, red: 261.63, yellow: 392.00, blue: 174.61 };

let sequence = [];
let userIdx = 0;
let playing = false;
let started = false;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const msgEl = document.getElementById("msg");
const scoreEl = document.getElementById("score");

function playSound(c) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.value = freqs[c];
  o.connect(g);
  g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  o.start();
  o.stop(audioCtx.currentTime + 0.4);
}

function flash(c) {
  const el = document.getElementById(c);
  el.classList.add("flash");
  playSound(c);
  setTimeout(() => el.classList.remove("flash"), 300);
}

function nextRound() {
  userIdx = 0;
  playing = true;
  sequence.push(colors[Math.floor(Math.random() * 4)]);
  scoreEl.textContent = "Score: " + (sequence.length - 1);
  msgEl.textContent = "Watch the sequence...";

  let i = 0;
  const iv = setInterval(() => {
    flash(sequence[i]);
    i++;
    if (i >= sequence.length) {
      clearInterval(iv);
      setTimeout(() => {
        playing = false;
        msgEl.textContent = "Your turn";
      }, 500);
    }
  }, 700);
}

function handlePress(c) {
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!started || playing) return;

  flash(c);

  if (c === sequence[userIdx]) {
    userIdx++;
    if (userIdx === sequence.length) {
      playing = true;
      setTimeout(nextRound, 800);
    }
  } else {
    msgEl.textContent = "Game over! Final score: " + (sequence.length - 1) + ". Press Start to retry.";
    started = false;
    sequence = [];
    scoreEl.textContent = "Score: 0";
  }
}

colors.forEach(c => {
  document.getElementById(c).addEventListener("click", () => handlePress(c));
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (audioCtx.state === "suspended") audioCtx.resume();
  sequence = [];
  started = true;
  nextRound();
});

document.addEventListener("keydown", (e) => {
  const map = { g: "green", r: "red", y: "yellow", b: "blue" };
  if (map[e.key]) handlePress(map[e.key]);
});
