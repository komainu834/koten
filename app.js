let words = [];

let username = "";
let score = 0;
let combo = 0;
let timeLeft = 30;
let timer = null;
let currentQuestion = null;
let answering = false;

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const rankingScreen = document.getElementById("rankingScreen");

const usernameInput = document.getElementById("username");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const finalScoreEl = document.getElementById("finalScore");
const rankingList = document.getElementById("rankingList");
const comboText = document.getElementById("comboText");
const judgeMark = document.getElementById("judgeMark");

const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const closeMenu = document.getElementById("closeMenu");
const overlay = document.getElementById("overlay");

window.onload = async function () {
  const savedName = localStorage.getItem("username");
  if (savedName) {
    usernameInput.value = savedName;
  }

  await loadWords();
};

menuButton.addEventListener("click", openMenu);
closeMenu.addEventListener("click", closeSideMenu);
overlay.addEventListener("click", closeSideMenu);

function openMenu() {
  sideMenu.classList.add("open");
  overlay.classList.add("show");
}

function closeSideMenu() {
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
}

function showScreen(screen) {
  homeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  rankingScreen.classList.remove("active");

  screen.classList.add("active");
}

function goHome() {
  closeSideMenu();
  clearInterval(timer);
  showScreen(homeScreen);
}

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
      reading: reading,
      answer: correct
    });
  }

  return data;
}

function startGame() {
  const inputName = usernameInput.value.trim();

  if (inputName === "") {
    alert("ユーザー名を入力してください");
    return;
  }

  if (words.length === 0) {
    alert("問題が読み込まれていません。words.csvを確認してください。");
    return;
  }

  username = inputName;
  localStorage.setItem("username", username);

  score = 0;
  combo = 0;
  timeLeft = 30;
  answering = false;

  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  comboText.textContent = "";
  judgeMark.textContent = "";

  closeSideMenu();
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

function showQuestion() {
  answering = false;
  judgeMark.textContent = "";

  currentQuestion = words[Math.floor(Math.random() * words.length)];

  if (currentQuestion.reading) {
    questionEl.textContent = currentQuestion.question + "（" + currentQuestion.reading + "）";
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

function checkAnswer(choice) {
  if (answering) return;
  answering = true;

  if (choice === currentQuestion.answer) {
    combo++;
    score += 10 + combo;

    judgeMark.textContent = "○";
    judgeMark.style.color = "#ffcc33";

    if (combo >= 2) {
      comboText.textContent = "COMBO " + combo + "!!";
    } else {
      comboText.textContent = "";
    }
  } else {
    combo = 0;
    timeLeft = Math.max(0, timeLeft - 2);

    judgeMark.textContent = "×";
    judgeMark.style.color = "#ff4444";
    comboText.textContent = "";
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

function finishGame() {
  clearInterval(timer);

  finalScoreEl.textContent = score;
  saveRanking(username, score);

  showScreen(resultScreen);
}

function saveRanking(name, score) {
  const ranking = JSON.parse(localStorage.getItem("ranking") || "[]");

  ranking.push({
    name: name,
    score: score
  });

  ranking.sort(function (a, b) {
    return b.score - a.score;
  });

  localStorage.setItem("ranking", JSON.stringify(ranking.slice(0, 10)));
}

function showRanking() {
  closeSideMenu();
  clearInterval(timer);

  const ranking = JSON.parse(localStorage.getItem("ranking") || "[]");

  rankingList.innerHTML = "";

  if (ranking.length === 0) {
    const li = document.createElement("li");
    li.textContent = "まだランキングはありません";
    rankingList.appendChild(li);
  } else {
    ranking.forEach(function (item, index) {
      const li = document.createElement("li");
      li.textContent = `${index + 1}位　${item.name}　${item.score}点`;
      rankingList.appendChild(li);
    });
  }

  showScreen(rankingScreen);
}

function makeChoices(questionData) {
  const correctAnswer = questionData.answer;

  const wrongAnswers = words
    .map(function (word) {
      return word.answer;
    })
    .filter(function (answer) {
      return answer !== correctAnswer;
    });

  const shuffledWrongAnswers = shuffleArray([...wrongAnswers]);

  const selectedWrongAnswers = shuffledWrongAnswers.slice(0, 3);

  return [correctAnswer, ...selectedWrongAnswers];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[randomIndex];
    array[randomIndex] = temp;
  }

  return array;
}