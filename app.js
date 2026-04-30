let words = [];
let currentQuestion = null;
let score = 0;
let timeLeft = 60;
let timerId = null;
let isAnswering = false;
let lastQuestion = null;
let combo = 0;

const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const wordEl = document.getElementById("word");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const finalScoreEl = document.getElementById("finalScore");

let comboEl;
let bonusEl;
let judgeEl;

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);

createEffectElements();

async function loadWords() {
  const response = await fetch("words.csv");
  const text = await response.text();
  const lines = text.trim().split("\n").slice(1);

  words = lines
    .map(line => {
      const [word, answer, wrong1, wrong2, wrong3] = line.split(",");
      if (!word || !answer || !wrong1 || !wrong2 || !wrong3) return null;

      return {
        word: word.trim(),
        answer: answer.trim(),
        choices: [
          answer.trim(),
          wrong1.trim(),
          wrong2.trim(),
          wrong3.trim()
        ]
      };
    })
    .filter(Boolean);
}

async function startGame() {
  if (words.length === 0) {
    await loadWords();
  }

  score = 0;
  combo = 0;
  timeLeft = 60;
  lastQuestion = null;
  isAnswering = false;

  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  showQuestion();

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function showQuestion() {
  isAnswering = false;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  let nextQuestion;

  do {
    nextQuestion = words[Math.floor(Math.random() * words.length)];
  } while (words.length > 1 && nextQuestion === lastQuestion);

  currentQuestion = nextQuestion;
  lastQuestion = currentQuestion;

  wordEl.textContent = currentQuestion.word;

  const shuffledChoices = shuffleArray([...currentQuestion.choices]);
  choicesEl.innerHTML = "";

  shuffledChoices.forEach(choice => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.className = "choice-btn";
    button.addEventListener("click", () => checkAnswer(choice, button));
    choicesEl.appendChild(button);
  });
}

function checkAnswer(selectedChoice, clickedButton) {
  if (isAnswering) return;
  isAnswering = true;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(btn => btn.disabled = true);

  if (selectedChoice === currentQuestion.answer) {
    score++;
    combo++;

    scoreEl.textContent = score;
    clickedButton.classList.add("choice-correct");

    showJudgeMark(true);

    if (combo >= 5) {
      showComboText(combo);
    }

    if (combo % 10 === 0) {
      timeLeft += 5;
      timeEl.textContent = timeLeft;
      showTimeBonus();
    }

    feedbackEl.textContent = "正解！";
    feedbackEl.classList.add("correct");
  } else {
    combo = 0;

    clickedButton.classList.add("choice-wrong");

    buttons.forEach(btn => {
      if (btn.textContent === currentQuestion.answer) {
        btn.classList.add("choice-correct");
      }
    });

    showJudgeMark(false);

    feedbackEl.textContent = `不正解… 正解は「${currentQuestion.answer}」`;
    feedbackEl.classList.add("wrong");
  }

  setTimeout(() => {
    if (timeLeft > 0) {
      showQuestion();
    }
  }, 650);
}

function endGame() {
  clearInterval(timerId);

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  finalScoreEl.textContent = score;
}

function createEffectElements() {
  comboEl = document.createElement("div");
  comboEl.className = "combo-text";
  document.body.appendChild(comboEl);

  bonusEl = document.createElement("div");
  bonusEl.className = "time-bonus";
  document.body.appendChild(bonusEl);

  judgeEl = document.createElement("div");
  judgeEl.className = "judge-mark";
  document.body.appendChild(judgeEl);
}

function showComboText(combo) {
  comboEl.textContent = `${combo} COMBO!!`;
  comboEl.className = `combo-text show ${getComboClass(combo)}`;

  setTimeout(() => {
    comboEl.className = "combo-text";
  }, 500);
}

function showTimeBonus() {
  bonusEl.textContent = "+5秒！";
  bonusEl.className = "time-bonus show";

  setTimeout(() => {
    bonusEl.className = "time-bonus";
  }, 500);
}

function showJudgeMark(isCorrect) {
  judgeEl.textContent = isCorrect ? "○" : "×";
  judgeEl.className = isCorrect
    ? "judge-mark show judge-correct"
    : "judge-mark show judge-wrong";

  setTimeout(() => {
    judgeEl.className = "judge-mark";
  }, 400);
}

function getComboClass(combo) {
  if (combo >= 30) return "combo-max";
  if (combo >= 20) return "combo-high";
  if (combo >= 10) return "combo-mid";
  return "combo-low";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}