const supabaseUrl = "https://evusndlinnzewkommeib.supabase.co";
const supabaseKey = "sb_publishable_LbcCpdtehJlEBmVlzFWQmg_TFf6AU4L";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== 状態 =====
let words = [];
let username = "";
let loginId = "";
let score = 0;
let displayedScore = 0;
let combo = 0;
let timeLeft = 60;
let timer = null;
let currentQuestion = null;
let answering = false;

// ===== 要素 =====
const topScreen = document.getElementById("topScreen");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const rankingScreen = document.getElementById("rankingScreen");
const testScreen = document.getElementById("testScreen");

const loginIdInput = document.getElementById("loginId");
const usernameInput = document.getElementById("username");
const profileIdInput = document.getElementById("profileId");
const profileNameInput = document.getElementById("profileName");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const finalScoreEl = document.getElementById("finalScore");
const rankingList = document.getElementById("rankingList");

const judgeMark = document.getElementById("judgeMark");
const comboText = document.getElementById("comboText");
const comboCountEl = document.getElementById("comboCount");
const comboGauge = document.getElementById("comboGauge");
const scorePlus = document.getElementById("scorePlus");
const goText = document.getElementById("goText");

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const closeMenuButton = document.getElementById("closeMenu");
const overlay = document.getElementById("overlay");

// ===== 初期処理 =====
window.onload = async function () {
  let savedLoginId = localStorage.getItem("loginId");
  const savedName = localStorage.getItem("username");

  if (!savedLoginId) {
    savedLoginId = generateLoginId();
    localStorage.setItem("loginId", savedLoginId);
  }

  // 👇これでOK（変数に入れるだけ）
  loginId = savedLoginId;

  if (savedName) {
    username = savedName;
  }

  await loadWords();
};

// ===== メニュー =====
menuButton.onclick = function () {
  sideMenu.classList.add("open");
  overlay.classList.add("show");
};

closeMenuButton.onclick = closeMenu;
overlay.onclick = closeMenu;

function closeMenu() {
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
}

// ===== CSV読み込み =====
async function loadWords() {
  try {
    const res = await fetch("words.csv");

    if (!res.ok) {
      throw new Error("words.csvが見つからない");
    }

    const text = await res.text();
    words = parseCSV(text);

    if (words.length === 0) {
      throw new Error("CSVの中身が空");
    }

    console.log("読み込み成功:", words.length);
  } catch (e) {
    console.error(e);
    alert("words.csvを確認しろ");
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    if (cols.length < 2) continue;

    const question = cols[0].trim();
    const correct = cols[1].trim();
    const reading = cols[2] ? cols[2].trim() : "";

    if (!question || !correct) continue;

    data.push({
      question: question,
      answer: correct,
      reading: reading
    });
  }

  return data;
}

// ===== 画面切り替え =====
function showScreen(screen) {
  topScreen.classList.remove("active");
  homeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  rankingScreen.classList.remove("active");
  testScreen.classList.remove("active");
  document.getElementById("profileScreen").classList.remove("active");

  screen.classList.add("active");
}

function goHome() {
  closeMenu();
  clearInterval(timer);
  showScreen(homeScreen);
}

// ===== ゲーム開始 =====
function startGame() {

  loginId = localStorage.getItem("loginId");
username = localStorage.getItem("username");

if (!loginId || !username) {
  alert("プロフィールを設定してください");
  openProfile();
  return;
}

  if (loginId === "") {
  alert("ログインIDを入力してください");
  return;
}

if (username === "") {
  alert("ユーザーネームを入力してください");
  return;
}

  if (words.length === 0) {
    alert("問題が読み込まれていません。words.csvを確認してください。");
    return;
  }

  localStorage.setItem("loginId", loginId);
  localStorage.setItem("username", username);

  score = 0;
  displayedScore = 0;
  combo = 0;
  timeLeft = 60;
  answering = false;

  scoreEl.textContent = displayedScore;
  timeEl.textContent = timeLeft;
  judgeMark.textContent = "";
  comboText.textContent = "";
  
  updateComboGauge();

    closeMenu();
  showScreen(gameScreen);

  showGo();

  setTimeout(function () {
    showQuestion();

    clearInterval(timer);

    timer = setInterval(function () {
      timeLeft--;
      timeEl.textContent = timeLeft;

      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);
  }, 800);
}

// ===== 問題表示 =====
function showQuestion() {
  answering = false;
  judgeMark.textContent = "";

  currentQuestion = words[Math.floor(Math.random() * words.length)];

  questionEl.textContent = currentQuestion.question;

  const choices = makeChoices(currentQuestion);
  const shuffledChoices = shuffleArray(choices);

  choicesEl.innerHTML = "";

  shuffledChoices.forEach(function (choice) {
    const button = document.createElement("button");
    button.textContent = choice;

    button.onclick = function () {
      checkAnswer(choice);
    };

    choicesEl.appendChild(button);
  });
}

// ===== 選択肢作成 =====
function makeChoices(questionData) {
  const correctAnswer = questionData.answer;

  const wrongAnswers = words
    .map(function (word) {
      return word.answer;
    })
    .filter(function (answer) {
      return answer !== correctAnswer;
    });

  const selectedWrongAnswers = shuffleArray([...wrongAnswers]).slice(0, 3);

  return [correctAnswer, ...selectedWrongAnswers];
}

// ===== 回答判定 =====
function checkAnswer(choice) {
  if (answering) return;
  answering = true;

  const buttons = choicesEl.querySelectorAll("button");

  if (choice === currentQuestion.answer) {
    combo++;
    score += 10 + combo;
    updateComboGauge();

if (combo % 10 === 0) {
  timeLeft += 3;
  timeEl.textContent = timeLeft;
  showTimeBonus();
}

    showScorePlus(10 + combo, combo);

    buttons.forEach(btn => {
    if (btn.textContent === choice) {
      btn.classList.add("correct");
    }
  });

    judgeMark.textContent = "○";
    judgeMark.style.color = "#ffcc33";
    showJudge();

    if (combo >= 2) {
      comboText.textContent = "COMBO " + combo + "!!";
      showCombo();
    } else {
      comboText.textContent = "";
    }
  } else {
    combo = 0;
    timeLeft = Math.max(0, timeLeft - 2);
    updateComboGauge();

    buttons.forEach(btn => {
  if (btn.textContent === choice) {
    btn.classList.add("wrong");
  }
  if (btn.textContent === currentQuestion.answer) {
    btn.classList.add("correct");
  }
});

    judgeMark.textContent = "×";
    judgeMark.style.color = "#ff4444";
    comboText.textContent = "";
    showJudge();
  }

  animateScore(displayedScore, score);
  timeEl.textContent = timeLeft;

  setTimeout(function () {
    if (timeLeft <= 0) {
      finishGame();
    } else {
      showQuestion();
    }
  }, 500);
}

// ===== ゲーム終了 =====
function finishGame() {
  clearInterval(timer);

  finalScoreEl.textContent = score;

  saveRanking(loginId, username, score);

  showScreen(resultScreen);
}

// ===== ランキング保存 =====
async function saveRanking(loginId, name, score) {
  const { error } = await supabaseClient
    .from("scores")
    .insert([
      {
        login_id: loginId,
        name: name,
        score: score
      }
    ]);

  if (error) {
    console.error("保存エラー:", error);
  } else {
    console.log("保存成功");
  }
}

// ===== ランキング表示 =====
async function showRanking() {
  closeMenu();
  clearInterval(timer);

  const { data, error } = await supabaseClient
  .from("scores")
  .select("*")
  .order("score", { ascending: false })
  .limit(200);

  if (error) {
    console.error("ランキング取得エラー:", error);
    alert("ランキングを取得できませんでした");
    return;
  }

  const allScores = data || [];
const bestMap = {};

allScores.forEach(function (item) {
  if (!bestMap[item.login_id] || item.score > bestMap[item.login_id].score) {
  bestMap[item.login_id] = item;
}
});

const ranking = Object.values(bestMap)
  .sort(function (a, b) {
    return b.score - a.score;
  })
  .slice(0, 10);

  rankingList.innerHTML = "";

  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = "まだランキングはありません";
    rankingList.appendChild(li);
  } else {
    ranking.forEach(function (item, index) {
  const li = document.createElement("li");

  // 順位ごとのクラス
  if (index === 0) li.className = "rank-1";
  else if (index === 1) li.className = "rank-2";
  else if (index === 2) li.className = "rank-3";
  else li.className = "rank-other";

  li.textContent =
    (index + 1) + "位　" + item.name + "　" + item.score + "点";
      rankingList.appendChild(li);
    });
  }

  showScreen(rankingScreen);
}

// ===== シャッフル =====
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[randomIndex];
    array[randomIndex] = temp;
  }

  return array;
}

function showJudge() {
  judgeMark.classList.remove("show");
  void judgeMark.offsetWidth;
  judgeMark.classList.add("show");
}

function showCombo() {
  comboText.classList.remove("show");
  void comboText.offsetWidth;
  comboText.classList.add("show");
}

function showGo() {
  goText.classList.remove("show");
  void goText.offsetWidth;
  goText.classList.add("show");
}

function generateLoginId() {
  const random = Math.random().toString(36).substring(2, 6);
  return "user-" + random;
}

function showScorePlus(points, comboCount) {
  scorePlus.textContent = "+" + points;

  scorePlus.classList.remove("combo-low");
  scorePlus.classList.remove("combo-mid");
  scorePlus.classList.remove("combo-high");

  if (comboCount >= 10) {
    scorePlus.classList.add("combo-high");
  } else if (comboCount >= 5) {
    scorePlus.classList.add("combo-mid");
  } else {
    scorePlus.classList.add("combo-low");
  }

  scorePlus.classList.remove("show");
  void scorePlus.offsetWidth;
  scorePlus.classList.add("show");
}

function animateScore(from, to) {
  const duration = 250;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.floor(from + (to - from) * progress);

    scoreEl.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      displayedScore = to;
      scoreEl.textContent = to;
    }
  }

  requestAnimationFrame(update);
}

function updateComboGauge() {
  const comboInGauge = combo % 40;
  const percent = (comboInGauge / 40) * 100;

  comboGauge.style.width = percent + "%";
}

function showTimeBonus() {
  comboText.textContent = "3秒追加!!";
  comboText.classList.remove("show");
  void comboText.offsetWidth;
  comboText.classList.add("show");
}

function openProfile() {
  closeMenu();

  loginId = localStorage.getItem("loginId");
  username = localStorage.getItem("username");

  if (!loginId) {
    loginId = generateLoginId();
    localStorage.setItem("loginId", loginId);
  }

  profileIdInput.value = loginId;
  profileNameInput.value = username || "";

  showScreen(document.getElementById("profileScreen"));
}

async function saveProfile() {
  const newName = profileNameInput.value.trim();

  if (!newName) {
    alert("ユーザーネームを入力してください");
    return;
  }

  loginId = localStorage.getItem("loginId");

  username = newName;
  localStorage.setItem("username", username);

  const { error } = await supabaseClient
    .from("scores")
    .update({ name: username })
    .eq("login_id", loginId);

  if (error) {
    console.error("名前更新エラー:", error);
    alert("名前の更新に失敗しました");
    return;
  }

  alert("プロフィールを保存しました");
}

function goTop() {
  closeMenu();
  clearInterval(timer);
  showScreen(topScreen);
}

function showVocabHome() {
  closeMenu();
  clearInterval(timer);
  showScreen(homeScreen);
}

function showTestScreen() {
  closeMenu();
  clearInterval(timer);
  showScreen(testScreen);
}