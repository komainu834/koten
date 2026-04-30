// ===== Supabase =====
const supabaseUrl = "evusndlinnzewkommeib";
const supabaseKey = "sb_publishable_LbcCpdtehJlEBmVlzFWQmg_TFf6AU4L";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== 状態 =====
let words = [];
let username = "";
let score = 0;
let combo = 0;
let timeLeft = 30;
let timer = null;
let currentQuestion;
let answering = false;

// ===== 要素 =====
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const rankingScreen = document.getElementById("rankingScreen");

const usernameInput = document.getElementById("username");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const finalScoreEl = document.getElementById("finalScore");
const rankingList = document.getElementById("rankingList");

const judgeMark = document.getElementById("judgeMark");
const comboText = document.getElementById("comboText");

// ===== メニュー =====
document.getElementById("menuButton").onclick = () => {
  document.getElementById("sideMenu").classList.add("open");
  document.getElementById("overlay").classList.add("show");
};

document.getElementById("closeMenu").onclick = closeMenu;
document.getElementById("overlay").onclick = closeMenu;

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

// ===== CSV読み込み =====
window.onload = async () => {
  const res = await fetch("words.csv");
  const text = await res.text();
  words = parseCSV(text);
};

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    data.push({
      question: cols[0],
      answer: cols[1],
      reading: cols[2] || ""
    });
  }

  return data;
}

// ===== ゲーム開始 =====
function startGame() {
  username = usernameInput.value;
  if (!username) return alert("名前入れて");

  score = 0;
  combo = 0;
  timeLeft = 30;

  if (words.length === 0) {
  alert("問題が読み込まれていません。words.csvを確認してください。");
  return;
}

  showScreen(gameScreen);
  nextQuestion();

  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) finishGame();
  }, 1000);
}

// ===== 問題 =====
function nextQuestion() {
  answering = false;

  currentQuestion = words[Math.floor(Math.random() * words.length)];

  questionEl.textContent = currentQuestion.reading
    ? currentQuestion.question + "（" + currentQuestion.reading + "）"
    : currentQuestion.question;

  const choices = makeChoices(currentQuestion);
  const shuffled = shuffle(choices);

  choicesEl.innerHTML = "";

  shuffled.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.onclick = () => checkAnswer(c);
    choicesEl.appendChild(btn);
  });
}

// ===== 選択肢 =====
function makeChoices(q) {
  const wrong = words
    .map(w => w.answer)
    .filter(a => a !== q.answer);

  return [q.answer, ...shuffle(wrong).slice(0, 3)];
}

// ===== 判定 =====
function checkAnswer(choice) {
  if (answering) return;
  answering = true;

  if (choice === currentQuestion.answer) {
    combo++;
    score += 10 + combo;
    judgeMark.textContent = "○";
  } else {
    combo = 0;
    timeLeft -= 2;
    judgeMark.textContent = "×";
  }

  scoreEl.textContent = score;

  setTimeout(() => {
    if (timeLeft <= 0) finishGame();
    else nextQuestion();
  }, 500);
}

// ===== 終了 =====
function finishGame() {
  clearInterval(timer);
  finalScoreEl.textContent = score;

  saveRanking(username, score);
  showScreen(resultScreen);
}

// ===== 保存 =====
async function saveRanking(name, score) {
  await supabase.from("scores").insert([{ name, score }]);
}

// ===== 表示 =====
async function showRanking() {
  closeMenu();
  clearInterval(timer);

  const { data } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  rankingList.innerHTML = "";

  data.forEach((d, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}位 ${d.name} ${d.score}`;
    rankingList.appendChild(li);
  });

  showScreen(rankingScreen);
}

// ===== 共通 =====
function showScreen(screen) {
  [homeScreen, gameScreen, resultScreen, rankingScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function goHome() {
  clearInterval(timer);
  showScreen(homeScreen);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}