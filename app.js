const supabaseUrl = "https://evusndlinnzewkommeib.supabase.co";
const supabaseKey = "sb_publishable_LbcCpdtehJlEBmVlzFWQmg_TFf6AU4L";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== 状態 =====
let vocabWords = [];
let words = [];
let grammarWords = [];
let jodoushiWords = [];
let currentMode = "vocab";
let username = "";
let loginId = "";
let score = 0;
let displayedScore = 0;
let combo = 0;
let timeLeft = 60;
let timer = null;
let currentQuestion = null;
let answering = false;
let exploreEndTime = null;
let exploreInterval = null;

// ===== 要素 =====
const topScreen = document.getElementById("topScreen");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const rankingScreen = document.getElementById("rankingScreen");
const testScreen = document.getElementById("testScreen");
const exploreScreen = document.getElementById("exploreScreen");
const jodoushiScreen = document.getElementById("jodoushiScreen");

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
  await loadGrammar();
  await loadJodoushi();
  loadExplore();
};

// ===== メニュー =====
menuButton.onclick = function () {
  sideMenu.classList.add("open");
  overlay.classList.add("show");

  document.body.classList.add("menu-open");
};

closeMenuButton.onclick = closeMenu;
overlay.onclick = closeMenu;

function closeMenu() {
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");

  document.body.classList.remove("menu-open");
}
// ===== CSV読み込み =====
async function loadWords() {
  try {
    const res = await fetch("words.csv");

    if (!res.ok) {
      throw new Error("words.csvが見つからない");
    }

    const text = await res.text();
    vocabWords = parseCSV(text);
    words = [...vocabWords];

    if (words.length === 0) {
      throw new Error("CSVの中身が空");
    }

    console.log("読み込み成功:", words.length);
  } catch (e) {
    console.error(e);
    alert("words.csvを確認しろ");
  }
}

async function loadGrammar() {
  try {
    const res = await fetch("grammar.csv");

    if (!res.ok) {
      throw new Error("grammar.csvが見つからない");
    }

    const text = await res.text();
    grammarWords = parseCSV(text);

    if (grammarWords.length === 0) {
      throw new Error("grammar.csvの中身が空");
    }

    console.log("文法読み込み成功:", grammarWords.length);
  } catch (e) {
    console.error(e);
    alert("grammar.csvを確認しろ");
  }
}

async function loadJodoushi() {
  try {
    const res = await fetch("jodoushi.csv");

    if (!res.ok) {
      throw new Error("jodoushi.csvが見つからない");
    }

    const text = await res.text();
    jodoushiWords = parseCSV(text);

    if (jodoushiWords.length === 0) {
      throw new Error("jodoushi.csvの中身が空");
    }

    console.log("助動詞読み込み成功:", jodoushiWords.length);
  } catch (e) {
    console.error(e);
    alert("jodoushi.csvを確認しろ");
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    if (cols.length < 2) continue;

    const word = cols[0].trim();
    const answer = cols[1].trim();
    const info = cols[2] ? cols[2].trim() : "";

    if (!word || !answer) continue;

    data.push({
      question: word,
      answer: answer,
      info: info
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
  jodoushiScreen.classList.remove("active");
  exploreScreen.classList.remove("active");
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

   document.body.classList.add("no-scroll");

  loginId = localStorage.getItem("loginId");
  username = localStorage.getItem("username");

if (!loginId || !username) {
  alert("記録者プロフィールを設定してください");
  openProfile();
  return;
}

  if (loginId === "") {
  alert("ログインIDを入力してください");
  return;
}

if (username === "") {
  alert("記録者名を入力してください");
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

  const modeTitle = document.getElementById("modeTitle");

if (currentMode === "vocab") {
  modeTitle.textContent = "📘 古典語彙";
} else if (currentMode === "grammar") {
  modeTitle.textContent = "📜 妖文法";
} else {
  modeTitle.textContent = "⚔ 呪句助動詞";
}

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

  if (currentQuestion.info) {
  questionEl.innerHTML =
    currentQuestion.question +
    "<br><span class='question-info'>" +
    currentQuestion.info +
    "</span>";
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
      comboText.textContent = "共鳴 " + combo + "!!";
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
  document.body.classList.remove("no-scroll");

  clearInterval(timer);

  finalScoreEl.textContent = score;

  saveRanking(loginId, username, score);

  giveGameReward(score, currentMode);

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
        score: score,
        mode: currentMode
      }
    ]);

  if (error) {
    console.error("保存エラー:", error);
  } else {
    console.log("保存成功");
  }
}

// ===== ランキング表示 =====
// ===== ランキング表示 =====
async function showRanking() {
  closeMenu();
  clearInterval(timer);

  // ランキングを開くときは、まず古典語彙ランキングから表示
  await showRankingByMode("vocab");
}

async function showRankingByMode(mode) {
  currentMode = mode;

  const rankingTitle = document.getElementById("rankingTitle");

if (currentMode === "vocab") {
  rankingTitle.textContent = "古典語彙ランキング";
} else if (currentMode === "grammar") {
  rankingTitle.textContent = "文法ランキング";
} else if (currentMode === "jodoushi") {
  rankingTitle.textContent = "助動詞ランキング";
}

  const { data, error } = await supabaseClient
    .from("scores")
    .select("*")
    .eq("mode", currentMode)
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

      if (index === 0) li.className = "rank-1";
      else if (index === 1) li.className = "rank-2";
      else if (index === 2) li.className = "rank-3";
      else li.className = "rank-other";

      li.textContent =
        (index + 1) + "位　" + item.name + "　" + item.score + "深度";

      rankingList.appendChild(li);
    });
  }

  showScreen(rankingScreen);
}

function toggleRankingMode() {
  if (currentMode === "vocab") {
    showRankingByMode("grammar");
  } else if (currentMode === "grammar") {
    showRankingByMode("jodoushi");
  } else {
    showRankingByMode("vocab");
  }
}

function setModeTheme(mode) {
  document.body.classList.remove("mode-vocab", "mode-grammar", "mode-jodoushi");
  document.body.classList.add("mode-" + mode);
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
  comboText.textContent = "結界+3秒!!";
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
    alert("記録者名を入力してください");
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

  alert("記録者プロフィールを保存しました");
}

function goTop() {
  closeMenu();
  clearInterval(timer);
  showScreen(topScreen);
}

function showVocabHome() {
  currentMode = "vocab";
  setModeTheme("vocab");

  // 語彙問題に戻す
  words = [...vocabWords];

  closeMenu();
  clearInterval(timer);
  showScreen(homeScreen);
}

function showGrammarScreen() {
  closeMenu();
  clearInterval(timer);
  showScreen(testScreen);
}

function startGrammarGame() {

  if (grammarWords.length === 0) {
    alert("文法データが読み込まれていません");
    return;
  }

  currentMode = "grammar";
  setModeTheme("grammar");

  // 文法問題を使う
  words = [...grammarWords];

  startGame();
}

function showJodoushiScreen() {
  closeMenu();
  clearInterval(timer);
  showScreen(jodoushiScreen);
}

function startJodoushiGame() {
  if (jodoushiWords.length === 0) {
    alert("助動詞データが読み込まれていません");
    return;
  }

  currentMode = "jodoushi";
  setModeTheme("jodoushi");

  // 助動詞問題を使う
  words = [...jodoushiWords];

  startGame();
}

/* =========================
   探索システム
========================= */

function startExplore(place, hours) {
  if (exploreEndTime) {
    alert("すでに探索中です");
    return;
  }

  exploreEndTime = Date.now() + hours * 60 * 60 * 1000;

  localStorage.setItem("exploreEndTime", exploreEndTime);
  localStorage.setItem("explorePlace", place);

  alert(place + "へ妖界探索に出発しました！");

  updateExploreUI();
  exploreInterval = setInterval(updateExploreUI, 1000);

  goTop();
}

function updateExploreUI() {

  const panel =
    document.getElementById(
      "explorePanel"
    );

  const timer =
    document.getElementById(
      "exploreTimer"
    );

    const placeEl = document.getElementById("explorePlace");
const savedPlace = localStorage.getItem("explorePlace") || "月夜の竹林";
placeEl.textContent = savedPlace;

  if (!exploreEndTime) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");

  const remain =
    exploreEndTime - Date.now();

  if (remain <= 0) {

    timer.textContent =
      "探索完了！";

    return;
  }

  const totalSec =
    Math.floor(remain / 1000);

  const h =
    String(
      Math.floor(totalSec / 3600)
    ).padStart(2, "0");

  const m =
    String(
      Math.floor(
        (totalSec % 3600) / 60
      )
    ).padStart(2, "0");

  const s =
    String(totalSec % 60)
    .padStart(2, "0");

  timer.textContent =
    `${h}:${m}:${s}`;
}

function collectExploreReward() {

  if (!exploreEndTime) {
    return;
  }

  const remain =
    exploreEndTime - Date.now();

  if (remain > 0) {
    return;
  }

  const reward =
    Math.floor(
      Math.random() * 200
    ) + 100;

  alert(
    `探索成功！\n霊力 +${reward}`
  );

  exploreEndTime = null;

  localStorage.removeItem(
    "exploreEndTime"
  );

  document
    .getElementById(
      "explorePanel"
    )
    .classList.add("hidden");

  clearInterval(
    exploreInterval
  );
}

function loadExplore() {

  const saved =
    localStorage.getItem(
      "exploreEndTime"
    );

  if (!saved) {
    return;
  }

  exploreEndTime =
    Number(saved);

  updateExploreUI();

  exploreInterval =
    setInterval(
      updateExploreUI,
      1000
    );
}

function showExploreScreen() {
  closeMenu();
  clearInterval(timer);
  showScreen(exploreScreen);
}


/* ==================================================
   Phase3.5：探索画面をソシャゲ風育成画面に統一
   ホームとサイドメニューの順番は壊しません。
================================================== */


/* ---------- 式神マスター ---------- */

const SHIKIGAMI_MASTER = {
  "白狐ノ影": {
    image: "img/fox.png",
    element: "水",
    role: "語彙特化",
    baseHp: 1200,
    baseAtk: 240,
    baseDef: 180,
    baseSpd: 120
  },

  "鴉天狗": {
    image: "img/tengu.png",
    element: "風",
    role: "文法特化",
    baseHp: 1050,
    baseAtk: 260,
    baseDef: 150,
    baseSpd: 170
  },

  "青龍": {
    image: "img/dragon.png",
    element: "水",
    role: "高得点特化",
    baseHp: 1500,
    baseAtk: 300,
    baseDef: 230,
    baseSpd: 100
  },

  "九尾ノ焔": {
    image: "img/kitsune.png",
    element: "火",
    role: "助動詞特化",
    baseHp: 1100,
    baseAtk: 340,
    baseDef: 150,
    baseSpd: 140
  }
};


/* ---------- 保存データ ---------- */

let spiritPower =
  Number(localStorage.getItem("spiritPower") || 0);

let coins =
  Number(localStorage.getItem("coins") || 0);

let gems =
  Number(localStorage.getItem("gems") || 0);

let inventory =
  JSON.parse(
    localStorage.getItem("inventory") ||
    JSON.stringify({
      soul: 0,
      blueCrystal: 0,
      redCrystal: 0,
      scroll: 0
    })
  );

let activeShikigami =
  localStorage.getItem("activeShikigami") ||
  "白狐ノ影";

let activeShikigamiImage =
  localStorage.getItem("activeShikigamiImage") ||
  SHIKIGAMI_MASTER[activeShikigami].image;

let shikigamiData =
  JSON.parse(
    localStorage.getItem("shikigamiData") ||
    JSON.stringify({
      "白狐ノ影": {
        level: 1,
        exp: 0
      },

      "鴉天狗": {
        level: 1,
        exp: 0
      },

      "青龍": {
        level: 1,
        exp: 0
      },

      "九尾ノ焔": {
        level: 1,
        exp: 0
      }
    })
  );


/* ---------- 保存 ---------- */

function savePhase35Data() {
  localStorage.setItem("spiritPower", spiritPower);
  localStorage.setItem("coins", coins);
  localStorage.setItem("gems", gems);
  localStorage.setItem("inventory", JSON.stringify(inventory));
  localStorage.setItem("activeShikigami", activeShikigami);
  localStorage.setItem("activeShikigamiImage", activeShikigamiImage);
  localStorage.setItem("shikigamiData", JSON.stringify(shikigamiData));
}


/* ---------- 表示更新 ---------- */

function updateShikigamiUI() {
  const master =
    SHIKIGAMI_MASTER[activeShikigami];

  const data =
    shikigamiData[activeShikigami];

  if (!master || !data) {
    return;
  }

  const level =
    data.level;

  const requiredExp =
    getRequiredExp(level);

  const expPercent =
    Math.min(
      100,
      Math.floor((data.exp / requiredExp) * 100)
    );

  setText("activeShikigamiName", activeShikigami);
  setText("activeShikigamiNameTop", activeShikigami);
  setText("activeShikigamiRole", master.role);
  setText("activeShikigamiElement", master.element);
  setText("activeShikigamiLevel", level);
  setText("activeShikigamiLevelTop", level);

  setText("spiritPowerText", spiritPower);
  setText("coinText", coins);
  setText("gemText", gems);

  setText("soulText", inventory.soul);
  setText("blueCrystalText", inventory.blueCrystal);
  setText("redCrystalText", inventory.redCrystal);
  setText("scrollText", inventory.scroll);

  setText("battlePowerText", calcBattlePower(activeShikigami));
  setText("expText", data.exp + " / " + requiredExp);

  setText("hpText", calcStat(master.baseHp, level));
  setText("atkText", calcStat(master.baseAtk, level));
  setText("defText", calcStat(master.baseDef, level));
  setText("spdText", calcStat(master.baseSpd, level));

  const imageEl =
    document.getElementById("activeShikigamiImage");

  if (imageEl) {
    imageEl.src = activeShikigamiImage;
  }

  const expFill =
    document.getElementById("expFill");

  if (expFill) {
    expFill.style.width = expPercent + "%";
  }
}


/* ---------- 小さい便利関数 ---------- */

function setText(id, value) {
  const el =
    document.getElementById(id);

  if (!el) {
    return;
  }

  el.textContent = value;
}

function getRequiredExp(level) {
  return 100 + (level - 1) * 60;
}

function calcStat(base, level) {
  return Math.floor(
    base + level * base * 0.08
  );
}

function calcBattlePower(name) {
  const master =
    SHIKIGAMI_MASTER[name];

  const data =
    shikigamiData[name];

  if (!master || !data) {
    return 0;
  }

  const level =
    data.level;

  const hp =
    calcStat(master.baseHp, level);

  const atk =
    calcStat(master.baseAtk, level);

  const def =
    calcStat(master.baseDef, level);

  const spd =
    calcStat(master.baseSpd, level);

  return Math.floor(
    hp * 0.8 +
    atk * 4 +
    def * 3 +
    spd * 2
  );
}


/* ---------- 式神選択 ---------- */

function selectShikigami(name, image) {
  activeShikigami =
    name;

  activeShikigamiImage =
    image;

  savePhase35Data();

  updateShikigamiUI();
}


/* ---------- 強化 ---------- */

function trainShikigami() {
  const data =
    shikigamiData[activeShikigami];

  if (!data) {
    return;
  }

  const level =
    data.level;

  const spiritCost =
    level * 80;

  const soulCost =
    Math.max(
      1,
      Math.floor(level / 2)
    );

  if (spiritPower < spiritCost) {
    alert("霊力が足りません。必要霊力：" + spiritCost);
    return;
  }

  if (inventory.soul < soulCost) {
    alert("霊魂が足りません。必要霊魂：" + soulCost);
    return;
  }

  spiritPower -= spiritCost;
  inventory.soul -= soulCost;

  data.exp += 50;

  while (data.exp >= getRequiredExp(data.level)) {
    data.exp -= getRequiredExp(data.level);
    data.level += 1;
  }

  savePhase35Data();

  updateShikigamiUI();
}


/* ---------- 探索画面 ---------- */

function showExploreScreen() {
  closeMenu();

  clearInterval(timer);

  showScreen(exploreScreen);

  updateExploreUI();

  updateShikigamiUI();
}


/* ---------- 探索開始 ---------- */

function startExplore(place, hours) {
  if (exploreEndTime) {
    alert("すでに探索中です");
    return;
  }

  exploreEndTime =
    Date.now() + hours * 60 * 60 * 1000;

  localStorage.setItem("exploreEndTime", exploreEndTime);
  localStorage.setItem("explorePlace", place);
  localStorage.setItem("exploreShikigami", activeShikigami);

  alert(place + "へ妖界探索に出発しました！");

  updateExploreUI();

  clearInterval(exploreInterval);

  exploreInterval =
    setInterval(
      updateExploreUI,
      1000
    );
}


/* ---------- 探索表示 ---------- */

function updateExploreUI() {
  const panel =
    document.getElementById("explorePanel");

  const timerEl =
    document.getElementById("exploreTimer");

  const placeEl =
    document.getElementById("explorePlace");

  const shikigamiEl =
    document.getElementById("exploreShikigamiName");

  if (!panel || !timerEl || !placeEl) {
    return;
  }

  if (!exploreEndTime) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");

  const place =
    localStorage.getItem("explorePlace") ||
    "月夜の竹林";

  const shikigami =
    localStorage.getItem("exploreShikigami") ||
    activeShikigami;

  placeEl.textContent =
    place;

  if (shikigamiEl) {
    shikigamiEl.textContent =
      shikigami;
  }

  const remain =
    exploreEndTime - Date.now();

  if (remain <= 0) {
    timerEl.textContent = "探索完了！";
    return;
  }

  timerEl.textContent =
    formatRemainTime(remain);
}

function formatRemainTime(ms) {
  const totalSec =
    Math.floor(ms / 1000);

  const h =
    String(Math.floor(totalSec / 3600))
      .padStart(2, "0");

  const m =
    String(Math.floor((totalSec % 3600) / 60))
      .padStart(2, "0");

  const s =
    String(totalSec % 60)
      .padStart(2, "0");

  return h + ":" + m + ":" + s;
}


/* ---------- 探索回収 ---------- */

function collectExploreReward() {
  if (!exploreEndTime) {
    return;
  }

  const remain =
    exploreEndTime - Date.now();

  if (remain > 0) {
    alert("まだ探索中です");
    return;
  }

  const place =
    localStorage.getItem("explorePlace") ||
    "月夜の竹林";

  const reward =
    createExploreReward(place);

  applyExploreReward(reward);

  alert("探索成功！\n" + reward.message);

  exploreEndTime =
    null;

  localStorage.removeItem("exploreEndTime");
  localStorage.removeItem("explorePlace");
  localStorage.removeItem("exploreShikigami");

  clearInterval(exploreInterval);

  savePhase35Data();

  updateExploreUI();

  updateShikigamiUI();
}

function createExploreReward(place) {
  const reward = {
    spirit: randomReward(120, 260),
    coins: randomReward(30, 90),
    gems: 0,
    soul: randomReward(4, 14),
    blueCrystal: 0,
    redCrystal: 0,
    scroll: 0,
    message: ""
  };

  if (place === "月夜の竹林") {
    reward.blueCrystal = randomReward(1, 4);
  }

  if (place === "幽玄の社") {
    reward.scroll = randomReward(1, 3);
    reward.gems = randomReward(0, 2);
  }

  if (place === "紅蓮峡谷") {
    reward.redCrystal = randomReward(1, 5);
    reward.spirit += 80;
  }

  reward.message =
    "霊力 +" + reward.spirit + "\n" +
    "古銭 +" + reward.coins + "\n" +
    "霊魂 +" + reward.soul + "\n" +
    "蒼晶石 +" + reward.blueCrystal + "\n" +
    "紅晶石 +" + reward.redCrystal + "\n" +
    "巻物 +" + reward.scroll;

  if (reward.gems > 0) {
    reward.message += "\n晶石 +" + reward.gems;
  }

  return reward;
}

function applyExploreReward(reward) {
  spiritPower += reward.spirit;
  coins += reward.coins;
  gems += reward.gems;

  inventory.soul += reward.soul;
  inventory.blueCrystal += reward.blueCrystal;
  inventory.redCrystal += reward.redCrystal;
  inventory.scroll += reward.scroll;
}

function randomReward(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}


/* ---------- 起動時探索復元 ---------- */

function loadExplore() {
  const saved =
    localStorage.getItem("exploreEndTime");

  if (!saved) {
    updateShikigamiUI();
    return;
  }

  exploreEndTime =
    Number(saved);

  clearInterval(exploreInterval);

  exploreInterval =
    setInterval(
      updateExploreUI,
      1000
    );

  updateExploreUI();

  updateShikigamiUI();
}


/* ---------- 古典タイムアタック報酬 ---------- */

function giveGameReward(score, mode) {
  const base =
    Math.floor(score / 10);

  let spiritBonus =
    base;

  let coinBonus =
    Math.floor(base / 2);

  if (mode === "grammar") {
    spiritBonus =
      Math.floor(base * 1.1);
  }

  if (mode === "jodoushi") {
    spiritBonus =
      Math.floor(base * 1.2);
  }

  spiritPower += spiritBonus;
  coins += coinBonus;

  if (mode === "vocab") {
    inventory.blueCrystal += Math.floor(score / 300);
  }

  if (mode === "jodoushi") {
    inventory.redCrystal += Math.floor(score / 300);
  }

  if (mode === "grammar") {
    inventory.scroll += Math.floor(score / 500);
  }

  savePhase35Data();
}


/* ---------- 下メニューからサイドメニューを開く ---------- */

function openSideMenuFromBottom() {
  sideMenu.classList.add("open");
  overlay.classList.add("show");

  document.body.classList.add("menu-open");
}


/* ---------- ヘルプ ---------- */

function showPhase35Help() {
  alert(
    "古典をプレイすると霊力と古銭が増えます。\n" +
    "タイムアタックで素材を集め、式神を強化できます。"
  );
}




/* ==================================================
   Phase4：素材画像・探索成功演出・ランク報酬
   Phase3.5の関数を上書きしています。
================================================== */


/* ---------- Phase4素材定義 ---------- */

const PHASE4_MATERIALS = {
  soul: {
    label: "霊魂",
    image: "img/materials/soul_normal.png",
    rare: "normal"
  },

  fireSoul: {
    label: "炎魂",
    image: "img/materials/soul_fire.png",
    rare: "rare"
  },

  waterSoul: {
    label: "水魂",
    image: "img/materials/soul_water.png",
    rare: "rare"
  },

  windSoul: {
    label: "風魂",
    image: "img/materials/soul_wind.png",
    rare: "rare"
  },

  blueCrystal: {
    label: "蒼晶石",
    image: "img/materials/crystal_blue.png",
    rare: "normal"
  },

  redCrystal: {
    label: "紅晶石",
    image: "img/materials/crystal_red.png",
    rare: "normal"
  },

  greenCrystal: {
    label: "翠晶石",
    image: "img/materials/crystal_green.png",
    rare: "rare"
  },

  purpleCrystal: {
    label: "紫晶石",
    image: "img/materials/crystal_purple.png",
    rare: "rare"
  },

  rainbowCrystal: {
    label: "虹晶石",
    image: "img/materials/crystal_rainbow.png",
    rare: "legend"
  },

  scroll: {
    label: "古文巻物",
    image: "img/materials/scroll_vocab.png",
    rare: "normal"
  },

  grammarScroll: {
    label: "文法秘巻",
    image: "img/materials/scroll_grammar.png",
    rare: "rare"
  },

  jodoushiScroll: {
    label: "助動詞秘伝書",
    image: "img/materials/scroll_jodoushi.png",
    rare: "rare"
  }
};


/* ---------- inventory初期化強化 ---------- */

function ensurePhase4Inventory() {

  const defaults = {
    soul: 0,
    fireSoul: 0,
    waterSoul: 0,
    windSoul: 0,
    blueCrystal: 0,
    redCrystal: 0,
    greenCrystal: 0,
    purpleCrystal: 0,
    rainbowCrystal: 0,
    scroll: 0,
    grammarScroll: 0,
    jodoushiScroll: 0
  };

  Object.keys(defaults).forEach(function (key) {

    if (inventory[key] === undefined) {
      inventory[key] = defaults[key];
    }

  });

}


/* ---------- 表示更新をPhase4対応に上書き ---------- */

const oldUpdateShikigamiUIPhase4 =
  updateShikigamiUI;

updateShikigamiUI = function () {

  ensurePhase4Inventory();

  oldUpdateShikigamiUIPhase4();

  setText("fireSoulText", inventory.fireSoul);
  setText("rainbowCrystalText", inventory.rainbowCrystal);

};


/* ---------- 探索回収を演出つきに上書き ---------- */

collectExploreReward = function () {

  if (!exploreEndTime) {
    return;
  }

  const remain =
    exploreEndTime - Date.now();

  if (remain > 0) {
    alert("まだ探索中です");
    return;
  }

  const place =
    localStorage.getItem("explorePlace") ||
    "月夜の竹林";

  const reward =
    createExploreReward(place);

  applyExploreReward(reward);

  exploreEndTime =
    null;

  localStorage.removeItem("exploreEndTime");
  localStorage.removeItem("explorePlace");
  localStorage.removeItem("exploreShikigami");

  clearInterval(exploreInterval);

  savePhase35Data();

  updateExploreUI();

  updateShikigamiUI();

  showRewardOverlay(reward);

};


/* ---------- ランクつき報酬生成 ---------- */

createExploreReward = function (place) {

  ensurePhase4Inventory();

  const rank =
    decideExploreRank();

  const multiplier =
    getRankMultiplier(rank);

  const reward = {
    rank: rank,
    spirit: Math.floor(randomReward(120, 260) * multiplier),
    coins: Math.floor(randomReward(30, 90) * multiplier),
    gems: 0,
    items: [],
    message: ""
  };

  addRewardItem(
    reward,
    "soul",
    Math.floor(randomReward(4, 14) * multiplier)
  );

  if (place === "月夜の竹林") {

    addRewardItem(
      reward,
      "blueCrystal",
      randomReward(1, 4)
    );

    addRewardItem(
      reward,
      "waterSoul",
      randomReward(0, 2)
    );

  }

  if (place === "幽玄の社") {

    addRewardItem(
      reward,
      "scroll",
      randomReward(1, 3)
    );

    addRewardItem(
      reward,
      "grammarScroll",
      randomReward(0, 1)
    );

    reward.gems =
      randomReward(0, 2);

  }

  if (place === "紅蓮峡谷") {

    reward.spirit +=
      80;

    addRewardItem(
      reward,
      "redCrystal",
      randomReward(1, 5)
    );

    addRewardItem(
      reward,
      "fireSoul",
      randomReward(1, 3)
    );

    addRewardItem(
      reward,
      "jodoushiScroll",
      randomReward(0, 1)
    );

  }

  if (rank === "S" || rank === "SS") {

    addRewardItem(
      reward,
      "purpleCrystal",
      randomReward(1, 2)
    );

  }

  if (rank === "SS") {

    addRewardItem(
      reward,
      "rainbowCrystal",
      1
    );

  }

  reward.message =
    "霊力 +" + reward.spirit + "\n" +
    "古銭 +" + reward.coins;

  if (reward.gems > 0) {
    reward.message +=
      "\n晶石 +" + reward.gems;
  }

  return reward;

};


/* ---------- 報酬アイテム追加 ---------- */

function addRewardItem(reward, key, amount) {

  if (!amount || amount <= 0) {
    return;
  }

  reward.items.push({
    key: key,
    amount: amount
  });

}


/* ---------- 報酬反映をPhase4対応に上書き ---------- */

applyExploreReward = function (reward) {

  ensurePhase4Inventory();

  spiritPower +=
    reward.spirit;

  coins +=
    reward.coins;

  gems +=
    reward.gems || 0;

  reward.items.forEach(function (item) {

    if (inventory[item.key] === undefined) {
      inventory[item.key] = 0;
    }

    inventory[item.key] +=
      item.amount;

  });

};


/* ---------- ランク決定 ---------- */

function decideExploreRank() {

  const r =
    Math.random();

  if (r < 0.03) {
    return "SS";
  }

  if (r < 0.14) {
    return "S";
  }

  if (r < 0.34) {
    return "A";
  }

  if (r < 0.64) {
    return "B";
  }

  return "C";

}

function getRankMultiplier(rank) {

  if (rank === "SS") {
    return 2.2;
  }

  if (rank === "S") {
    return 1.7;
  }

  if (rank === "A") {
    return 1.3;
  }

  if (rank === "B") {
    return 1.0;
  }

  return 0.8;

}


/* ---------- 探索成功演出 ---------- */

function showRewardOverlay(reward) {

  const overlay =
    document.getElementById("rewardOverlay");

  const rankEl =
    document.getElementById("rewardRank");

  const listEl =
    document.getElementById("rewardList");

  const messageEl =
    document.getElementById("rewardMessage");

  if (!overlay || !rankEl || !listEl || !messageEl) {
    alert("探索成功！\n" + reward.message);
    return;
  }

  rankEl.textContent =
    reward.rank + " RANK";

  rankEl.className =
    "reward-rank rank-" + reward.rank.toLowerCase();

  listEl.innerHTML =
    "";

  reward.items.forEach(function (item) {

    const master =
      PHASE4_MATERIALS[item.key];

    if (!master) {
      return;
    }

    const card =
      document.createElement("div");

    card.className =
      "reward-item reward-" + master.rare;

    card.innerHTML =
      "<img src='" + master.image + "' alt='" + master.label + "'>" +
      "<div>" + master.label + "</div>" +
      "<strong>×" + item.amount + "</strong>";

    listEl.appendChild(card);

  });

  messageEl.textContent =
    reward.message.replace(/\n/g, " / ");

  overlay.classList.remove("hidden");

  overlay.classList.remove("show");

  void overlay.offsetWidth;

  overlay.classList.add("show");

}


/* ---------- 報酬演出を閉じる ---------- */

function closeRewardOverlay() {

  const overlay =
    document.getElementById("rewardOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.add("hidden");
  overlay.classList.remove("show");

}




/* ==================================================
   Phase5：覚醒・限界突破の土台
   ホームとメニューの順番は壊しません。
================================================== */

let shikigamiAwaken =
  JSON.parse(
    localStorage.getItem("shikigamiAwaken") ||
    JSON.stringify({
      "白狐ノ影": 0,
      "鴉天狗": 0,
      "青龍": 0,
      "九尾ノ焔": 0
    })
  );

function savePhase5Data() {
  localStorage.setItem(
    "shikigamiAwaken",
    JSON.stringify(shikigamiAwaken)
  );

  savePhase35Data();
}

const oldUpdateShikigamiUIPhase5 =
  updateShikigamiUI;

updateShikigamiUI = function () {
  oldUpdateShikigamiUIPhase5();

  const awaken =
    shikigamiAwaken[activeShikigami] || 0;

  setText(
    "awakenRankText",
    awaken
  );

  const powerEl =
    document.getElementById("battlePowerText");

  if (powerEl) {
    const basePower =
      calcBattlePower(activeShikigami);

    const bonusPower =
      Math.floor(basePower * awaken * 0.12);

    powerEl.textContent =
      basePower + bonusPower;
  }
};

function awakenShikigami() {
  ensurePhase4Inventory();

  const awaken =
    shikigamiAwaken[activeShikigami] || 0;

  const rainbowCost =
    awaken + 1;

  const scrollCost =
    2 + awaken;

  if (inventory.rainbowCrystal < rainbowCost) {
    alert("虹晶石が足りません。必要数：" + rainbowCost);
    return;
  }

  if (inventory.scroll < scrollCost) {
    alert("巻物が足りません。必要数：" + scrollCost);
    return;
  }

  inventory.rainbowCrystal -= rainbowCost;
  inventory.scroll -= scrollCost;

  shikigamiAwaken[activeShikigami] = awaken + 1;

  savePhase5Data();
  updateShikigamiUI();

  alert(activeShikigami + " が覚醒しました！");
}

function scrollToExploreArea() {
  const area =
    document.getElementById("phase5ExploreArea");

  if (!area) {
    return;
  }

  area.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}



/* ==================================================
   Phase6修正版：下メニューの役割整理
================================================== */

function hideAllPhase6Pages() {
  const pageIds = [
    "phase6HomePage",
    "phase6ExplorePage",
    "phase6ShikigamiPage",
    "phase6UpgradePage",
    "phase6ShopPage"
  ];

  pageIds.forEach(function (id) {
    const page = document.getElementById(id);
    if (page) page.classList.add("hidden");
  });

  const buttonIds = [
    "tabHomeBtn",
    "tabExploreBtn",
    "tabShikigamiBtn",
    "tabUpgradeBtn",
    "tabShopBtn"
  ];

  buttonIds.forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });
}

function showHomeTab() {
  hideAllPhase6Pages();

  const page = document.getElementById("phase6HomePage");
  const btn = document.getElementById("tabHomeBtn");

  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  updateShikigamiUI();
}

function showExploreTab() {
  hideAllPhase6Pages();

  const page = document.getElementById("phase6ExplorePage");
  const btn = document.getElementById("tabExploreBtn");

  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  updateExploreUI();
}

function showShikigamiTab() {
  hideAllPhase6Pages();

  const page = document.getElementById("phase6ShikigamiPage");
  const btn = document.getElementById("tabShikigamiBtn");

  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");
}

function showUpgradeTab() {
  hideAllPhase6Pages();

  const page = document.getElementById("phase6UpgradePage");
  const btn = document.getElementById("tabUpgradeBtn");

  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  updateShikigamiUI();
}

function showShopTab() {
  hideAllPhase6Pages();

  const page = document.getElementById("phase6ShopPage");
  const btn = document.getElementById("tabShopBtn");

  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");
}

const oldShowExploreScreenPhase6Fixed = showExploreScreen;

showExploreScreen = function () {
  oldShowExploreScreenPhase6Fixed();

  setTimeout(function () {
    showHomeTab();
  }, 0);
};

const oldUpdateShikigamiUIPhase6Fixed = updateShikigamiUI;

updateShikigamiUI = function () {
  oldUpdateShikigamiUIPhase6Fixed();

  const awaken = shikigamiAwaken[activeShikigami] || 0;

  setText("awakenRankTextUpgrade", awaken);
};



/* ==================================================
   Phase7：探索マップ・インベントリ・式神詳細
================================================== */

function hideAllPhase7Pages() {
  ["phase7HomePage","phase7ExplorePage","phase7ShikigamiPage","phase7InventoryPage","phase7GachaPage","phase7MenuPage"].forEach(function(id){
    const page = document.getElementById(id);
    if (page) page.classList.add("hidden");
  });

  ["tabHomeBtn","tabExploreBtn","tabShikigamiBtn","tabInventoryBtn","tabGachaBtn","tabMenuBtn"].forEach(function(id){
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });
}

function showPhase7Page(pageId, buttonId) {
  const page = document.getElementById(pageId);
  const btn = document.getElementById(buttonId);
  if (page) page.classList.remove("hidden");
  if (btn) btn.classList.add("active");
}

function showHomeTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7HomePage", "tabHomeBtn");
  updateShikigamiUI();
}

function showExploreTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7ExplorePage", "tabExploreBtn");
  updateExploreUI();
}

function showShikigamiTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7ShikigamiPage", "tabShikigamiBtn");
  updateShikigamiUI();
  updateShikigamiDetail();
}

function showInventoryTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7InventoryPage", "tabInventoryBtn");
  updateShikigamiUI();
  updateRequiredMaterialUI();
}

function showGachaTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7GachaPage", "tabGachaBtn");
}

function showMenuTab() {
  hideAllPhase7Pages();
  showPhase7Page("phase7MenuPage", "tabMenuBtn");
}

const oldShowExploreScreenPhase7 = showExploreScreen;
showExploreScreen = function () {
  oldShowExploreScreenPhase7();
  setTimeout(function () { showHomeTab(); }, 0);
};

function updateShikigamiDetail() {
  const master = SHIKIGAMI_MASTER[detailCandidateName];
  const data = shikigamiData[detailCandidateName];
  const awaken = shikigamiAwaken[detailCandidateName] || 0;
  if (!master || !data) return;

  setText("detailShikigamiName", detailCandidateName);
  setText("detailShikigamiRole", master.element + "属性 / " + master.role);
  setText("detailPowerText", calcBattlePower(detailCandidateName));
  setText("detailLevelText", data.level);
  setText("detailAwakenText", awaken);

  const img = document.getElementById("detailShikigamiImage");
  if (img) img.src = master.image;
}

function getLevelUpCost() {
  const data = shikigamiData[activeShikigami];
  if (!data) return { spirit: 0, soul: 0, scroll: 0 };

  const level = data.level;
  return {
    spirit: level * 90,
    soul: Math.max(1, Math.floor(level * 0.8)),
    scroll: Math.floor(level / 5)
  };
}

function updateRequiredMaterialUI() {
  const cost = getLevelUpCost();
  setText("needSpiritText", cost.spirit);
  setText("needSoulText", cost.soul);
  setText("needScrollText", cost.scroll);
}

trainShikigami = function () {
  const data = shikigamiData[activeShikigami];
  if (!data) return;

  const cost = getLevelUpCost();

  if (spiritPower < cost.spirit) {
    alert("霊力が足りません。必要霊力：" + cost.spirit);
    return;
  }

  if (inventory.soul < cost.soul) {
    alert("霊魂が足りません。必要霊魂：" + cost.soul);
    return;
  }

  if (inventory.scroll < cost.scroll) {
    alert("巻物が足りません。必要巻物：" + cost.scroll);
    return;
  }

  spiritPower -= cost.spirit;
  inventory.soul -= cost.soul;
  inventory.scroll -= cost.scroll;

  data.exp += 50 + data.level * 5;

  while (data.exp >= getRequiredExp(data.level)) {
    data.exp -= getRequiredExp(data.level);
    data.level += 1;
  }

  savePhase35Data();
  updateShikigamiUI();
  updateRequiredMaterialUI();
  updateShikigamiDetail();
};

giveGameReward = function (score, mode) {
  const base = Math.floor(score / 10);
  let spiritBonus = base;
  let coinBonus = Math.floor(base / 2);

  if (mode === "grammar") spiritBonus = Math.floor(base * 1.1);
  if (mode === "jodoushi") spiritBonus = Math.floor(base * 1.2);

  spiritPower += spiritBonus;
  coins += coinBonus;

  savePhase35Data();
};

function showEquipmentComingSoon() {
  alert("装備は今後追加予定です。大量の素材から作成、またはガチャから入手できる仕組みにします。");
}



let detailCandidateName = activeShikigami;
let detailCandidateImage = activeShikigamiImage;

function chooseDetailShikigami() {
  selectShikigami(detailCandidateName, detailCandidateImage);
  updateShikigamiDetail();
  updateRequiredMaterialUI();
  alert(detailCandidateName + " をホームに表示する式神にしました");
  showHomeTab();
}


/* ==================================================
   Phase7.1：式神一覧 → 個別詳細画面
================================================== */

function openShikigamiDetail(name, image) {

  detailCandidateName = name;
  detailCandidateImage = image;

  const listView =
    document.getElementById("phase7ShikigamiListView");

  const detailView =
    document.getElementById("phase7ShikigamiDetailView");

  if (listView) {
    listView.classList.add("hidden");
  }

  if (detailView) {
    detailView.classList.remove("hidden");
  }

  updateShikigamiDetail();
  updateRequiredMaterialUI();

}

function backToShikigamiList() {

  const listView =
    document.getElementById("phase7ShikigamiListView");

  const detailView =
    document.getElementById("phase7ShikigamiDetailView");

  if (detailView) {
    detailView.classList.add("hidden");
  }

  if (listView) {
    listView.classList.remove("hidden");
  }

}

const oldShowShikigamiTabPhase71 =
  showShikigamiTab;

showShikigamiTab = function () {

  oldShowShikigamiTabPhase71();

  const listView =
    document.getElementById("phase7ShikigamiListView");

  const detailView =
    document.getElementById("phase7ShikigamiDetailView");

  if (detailView) {
    detailView.classList.add("hidden");
  }

  if (listView) {
    listView.classList.remove("hidden");
  }

};

const oldUpdateShikigamiDetailPhase71 =
  updateShikigamiDetail;

updateShikigamiDetail = function () {

  oldUpdateShikigamiDetailPhase71();

  const master =
    SHIKIGAMI_MASTER[activeShikigami];

  const data =
    shikigamiData[activeShikigami];

  if (!master || !data) {
    return;
  }

  const level =
    data.level;

  setText(
    "detailHpText",
    calcStat(master.baseHp, level)
  );

  setText(
    "detailAtkText",
    calcStat(master.baseAtk, level)
  );

  setText(
    "detailDefText",
    calcStat(master.baseDef, level)
  );

  setText(
    "detailSpdText",
    calcStat(master.baseSpd, level)
  );

};

const oldTrainShikigamiPhase71 =
  trainShikigami;

trainShikigami = function () {

  oldTrainShikigamiPhase71();

  updateShikigamiDetail();
  updateRequiredMaterialUI();

};



/* ==================================================
   Phase8修正版：探索カード方式・条件解放・属性アイコン
================================================== */

const ELEMENT_ICON_PATHS={"水":"img/elements/water.png","火":"img/elements/fire.png","風":"img/elements/wind.png","光":"img/elements/light.png","闇":"img/elements/dark.png"};
const EXPLORE_AREAS={tsukikage:{name:"月影の竹林",desc:"月光が差し込む静かな竹林。語彙素材を集めやすい。",element:"水",minutes:20,cost:10,unlockText:"最初から解放",requiredRank:1,drops:["img/materials/soul_normal.png","img/materials/crystal_blue.png","img/elements/water.png"]},yashiro:{name:"忘れられた社",desc:"古びた社に文法の気配が残る。文法系素材を集めやすい。",element:"風",minutes:60,cost:18,unlockText:"プレイヤーランク3で解放",requiredRank:3,drops:["img/materials/scroll_grammar.png","img/materials/soul_wind.png","img/elements/wind.png"]},ohmagahara:{name:"逢魔ヶ原",desc:"妖気が濃い赤き原。助動詞素材を集めやすい。",element:"火",minutes:120,cost:30,unlockText:"プレイヤーランク5で解放",requiredRank:5,drops:["img/materials/crystal_red.png","img/materials/soul_fire.png","img/elements/fire.png"]},kosenjo:{name:"幽玄の古戦場",desc:"古語の怨念が眠る地。高レア素材を狙える。",element:"闇",minutes:180,cost:45,unlockText:"プレイヤーランク8で解放",requiredRank:8,drops:["img/materials/crystal_purple.png","img/materials/scroll_jodoushi.png","img/elements/dark.png"]},tenko:{name:"天狐の禁域",desc:"天狐が守る神域。覚醒素材を狙える高難度探索地。",element:"光",minutes:360,cost:70,unlockText:"プレイヤーランク12で解放",requiredRank:12,drops:["img/materials/crystal_rainbow.png","img/materials/soul_light.png","img/elements/light.png"]}};
let selectedExploreArea=localStorage.getItem("selectedExploreArea")||"tsukikage";
let playerRank=Number(localStorage.getItem("playerRank")||1);
let playerExp=Number(localStorage.getItem("playerExp")||0);
function getRequiredPlayerExp(rank){return 100+(rank-1)*80;}
function savePhase8Data(){localStorage.setItem("selectedExploreArea",selectedExploreArea);localStorage.setItem("playerRank",playerRank);localStorage.setItem("playerExp",playerExp);}
function addPlayerExp(amount){playerExp+=amount;while(playerExp>=getRequiredPlayerExp(playerRank)){playerExp-=getRequiredPlayerExp(playerRank);playerRank+=1;}savePhase8Data();}
function updatePlayerRankUI(){setText("playerRankText",playerRank);const need=getRequiredPlayerExp(playerRank);setText("playerExpText",playerExp+" / "+need);const fill=document.getElementById("playerExpFill");if(fill){fill.style.width=Math.min(100,Math.floor(playerExp/need*100))+"%";}}
function isExploreAreaUnlocked(key){const area=EXPLORE_AREAS[key];return !!area && playerRank>=area.requiredRank;}
function selectExploreArea(key){selectedExploreArea=key;savePhase8Data();updateExploreAreaUI();}
function updateExploreAreaUI(){const area=EXPLORE_AREAS[selectedExploreArea];if(!area)return;setText("areaNameText",area.name);setText("areaDescText",area.desc);setText("areaTimeText",area.minutes+"分");setText("areaCostText",area.cost);setText("areaElementText",area.element);setText("areaUnlockText",area.unlockText);const icon=document.getElementById("areaElementIcon");if(icon)icon.src=ELEMENT_ICON_PATHS[area.element];const drops=document.getElementById("areaDrops");if(drops){drops.innerHTML="";area.drops.forEach(src=>{const img=document.createElement("img");img.src=src;drops.appendChild(img);});}const startButton=document.getElementById("areaStartButton");if(startButton){if(isExploreAreaUnlocked(selectedExploreArea)){startButton.disabled=false;startButton.textContent="探索開始";}else{startButton.disabled=true;startButton.textContent="封印中";}}updateExploreUnlockUI();}
function updateExploreUnlockUI(){Object.keys(EXPLORE_AREAS).forEach(key=>{const card=document.getElementById("areaCard_"+key);if(!card)return;card.classList.toggle("locked",!isExploreAreaUnlocked(key));card.classList.toggle("unlocked",isExploreAreaUnlocked(key));card.classList.toggle("selected",selectedExploreArea===key);});}
function startSelectedExplore(){const area=EXPLORE_AREAS[selectedExploreArea];if(!area)return;if(!isExploreAreaUnlocked(selectedExploreArea)){alert("まだ解放されていません。\n条件："+area.unlockText);return;}if(spiritPower<area.cost){alert("霊力が足りません。\n必要霊力："+area.cost);return;}spiritPower-=area.cost;savePhase35Data();startExplore(area.name,area.minutes/60);updateShikigamiUI();updateExploreAreaUI();}
const oldShowExploreTabPhase8Fixed=showExploreTab;showExploreTab=function(){oldShowExploreTabPhase8Fixed();updatePlayerRankUI();updateExploreAreaUI();};
const oldGiveGameRewardPhase8Fixed=giveGameReward;giveGameReward=function(score,mode){oldGiveGameRewardPhase8Fixed(score,mode);addPlayerExp(Math.max(5,Math.floor(score/100)));savePhase8Data();};
