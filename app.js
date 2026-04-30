const supabaseUrl = "https://evusndlinnzewkommeib.supabase.co";
const supabaseKey = "sb_publishable_LbcCpdtehJlEBmVlzFWQmg_TFf6AU4L";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== 状態 =====
let words = [];
let username = "";
let score = 0;
let combo = 0;
let timeLeft = 30;
let timer = null;
let currentQuestion = null;
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

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const closeMenuButton = document.getElementById("closeMenu");
const overlay = document.getElementById("overlay");

// ===== 初期処理 =====
window.onload = async function () {
  const savedName = localStorage.getItem("username");
  if (savedName) {
    usernameInput.value = savedName;
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
    const response = await fetch("words.csv");

    if (!response.ok) {
      throw new Error("words.csvを読み込めませんでした");
    }

    const text = await response.text();
    words = parseCSV(text);

    console.log("読み込んだ問題数:", words.length);
  } catch (error) {
    console.error(error);
    alert("words.csvの読み込みに失敗しました");
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
  homeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  rankingScreen.classList.remove("active");

  screen.classList.add("active");
}

function goHome() {
  closeMenu();
  clearInterval(timer);
  showScreen(homeScreen);
}

// ===== ゲーム開始 =====
function startGame() {
  username = usernameInput.value.trim();

  if (username === "") {
    alert("ユーザー名を入力してください");
    return;
  }

  if (words.length === 0) {
    alert("問題が読み込まれていません。words.csvを確認してください。");
    return;
  }

  localStorage.setItem("username", username);

  score = 0;
  combo = 0;
  timeLeft = 30;
  answering = false;

  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  judgeMark.textContent = "";
  comboText.textContent = "";

  closeMenu();
  showScreen(gameScreen);
  showQuestion();

  clearInterval(timer);

  timer = setInterval(function () {
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      finishGame();
    }
  }, 1000);
}

// ===== 問題表示 =====
function showQuestion() {
  answering = false;
  judgeMark.textContent = "";

  currentQuestion = words[Math.floor(Math.random() * words.length)];

  if (currentQuestion.reading) {
    questionEl.textContent =
      currentQuestion.question + "（" + currentQuestion.reading + "）";
  } else {
    questionEl.textContent = currentQuestion.question;
  }

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

  if (choice === currentQuestion.answer) {
    combo++;
    score += 10 + combo;

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

    judgeMark.textContent = "×";
    judgeMark.style.color = "#ff4444";
    comboText.textContent = "";
    showJudge();
  }

  scoreEl.textContent = score;
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

  saveRanking(username, score);

  showScreen(resultScreen);
}

// ===== ランキング保存 =====
async function saveRanking(name, score) {
  const { error } = await supabaseClient
    .from("scores")
    .insert([
      {
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
  if (!bestMap[item.name] || item.score > bestMap[item.name].score) {
    bestMap[item.name] = item;
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