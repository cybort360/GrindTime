'use strict';

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const timerView = document.getElementById('timerView');
const historyView = document.getElementById('historyView');

// Setup Panel
const setupPanel = document.getElementById('setupPanel');
const workDurationEl = document.getElementById('workDuration');
const restDurationEl = document.getElementById('restDuration');
const roundsEl = document.getElementById('rounds');
const totalTimeEl = document.getElementById('totalTime');
const btnStart = document.getElementById('btnStart');
const durationBtns = document.querySelectorAll('.duration-btn');

// Active Timer
const activeTimer = document.getElementById('activeTimer');
const phaseIndicator = document.getElementById('phaseIndicator');
const phaseText = document.getElementById('phaseText');
const timerTime = document.getElementById('timerTime');
const timerRound = document.getElementById('timerRound');
const timerProgress = document.getElementById('timerProgress');
const progressBar = document.getElementById('progressBar');
const progressRounds = document.getElementById('progressRounds');
const btnPause = document.getElementById('btnPause');
const btnStop = document.getElementById('btnStop');

// Workout Complete
const workoutComplete = document.getElementById('workoutComplete');
const completedRounds = document.getElementById('completedRounds');
const completedTime = document.getElementById('completedTime');
const btnNewWorkout = document.getElementById('btnNewWorkout');

// History
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');

// State Variables
let workDuration = 10;
let restDuration = 5;
let totalRounds = 1;

let currentRound = 1;
let currentPhase = 'work'; // 'work' or 'rest'
let timeRemaining = 0;
let timerInterval = null;
let isPaused = false;
let workoutStartTime = null;

let workoutHistory = [];

const updateTotalTime = function () {
  const totalTime = (workDuration + restDuration) * totalRounds - restDuration;
  const hour = Math.floor(totalTime / (60 * 60));
  const minute = Math.floor((totalTime % (60 * 60)) / 60);
  const second = Math.floor(totalTime % 60);

  const formatHour = String(hour).padStart(2, '0');
  const formatMinute = String(minute).padStart(2, '0');
  const formateSecond = String(second).padStart(2, '0');

  totalTimeEl.textContent = `${formatHour}:${formatMinute}:${formateSecond}`;
};

durationBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const target = btn.dataset.target; // 'workDuration', 'restDuration', or 'rounds'
    const action = btn.dataset.action; // 'increase' or 'decrease'

    if (target === 'workDuration') {
      if (action === 'increase' && workDuration < 120) {
        workDuration += 5;
      } else if (action === 'decrease' && workDuration > 10) {
        workDuration -= 5;
      }
      workDurationEl.textContent = workDuration;
    } else if (target === 'restDuration') {
      if (action === 'increase' && restDuration < 60) {
        restDuration += 5;
      } else if (action === 'decrease' && restDuration > 5) {
        restDuration -= 5;
      }
      restDurationEl.textContent = restDuration;
    } else if (target === 'rounds') {
      if (action === 'increase' && totalRounds < 20) {
        totalRounds += 1;
      } else if (action === 'decrease' && totalRounds > 1) {
        totalRounds -= 1;
      }
      roundsEl.textContent = totalRounds;
    }
    updateTotalTime();
  });
});

const formatTime = function (totalSeconds) {
  const hour = Math.floor(totalSeconds / (60 * 60));
  const minute = Math.floor((totalSeconds % (60 * 60)) / 60);
  const second = Math.floor(totalSeconds % 60);

  const formatHour = String(hour).padStart(2, '0');
  const formatMinute = String(minute).padStart(2, '0');
  const formateSecond = String(second).padStart(2, '0');

  return `${formatHour}:${formatMinute}:${formateSecond}`;
};

const updateTimerDisplay = function () {
  timerTime.textContent = formatTime(timeRemaining);
  timerRound.textContent = `Round ${currentRound} of ${totalRounds}`;

  let phaseDuration;

  if (currentPhase === 'work') {
    phaseDuration = workDuration;
  } else {
    phaseDuration = restDuration;
  }

  const percentComplete = (phaseDuration - timeRemaining) / phaseDuration;

  const circumference = 565.48;
  const offset = circumference * percentComplete;

  timerProgress.style.strokeDashoffset = offset;
};

const updatePhaseIndicator = function () {
  if (currentPhase === 'work') {
    phaseText.textContent = 'WORK';
    phaseIndicator.classList.remove('rest');
  } else {
    phaseText.textContent = 'REST';
    phaseIndicator.classList.add('rest');
  }
};

const playSound = function (type = 'beep') {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();

  if (type === 'beep') {
    oscillator.frequency.value = 800;
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } else if (type === 'complete') {
    oscillator.frequency.value = 600;
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }
};

const createRoundIndicators = function () {
  progressRounds.innerHTML = '';
  for (let i = 0; i < totalRounds; i++) {
    const dot = document.createElement('div');
    dot.classList.add('round-dot');

    if (i === 0) {
      dot.classList.add('active');
    }

    progressRounds.appendChild(dot);
  }
};

const updateRoundIndicators = function () {
  const dots = progressRounds.querySelectorAll('.round-dot');

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];

    dot.classList.remove('completed', 'active');

    if (i < currentRound - 1) {
      dot.classList.add('completed');
    } else if (i === currentRound - 1) {
      dot.classList.add('active');
    }
  }
};

const timerTick = function () {
  if (isPaused) {
    return;
  }
  timeRemaining--;
  updateTimerDisplay();

  if (timeRemaining <= 0) {
    playSound('beep');
    if (currentPhase === 'work') {
      if (currentRound >= totalRounds) {
        completeWorkout();
      } else {
        currentPhase = 'rest';
        timeRemaining = restDuration;
        updatePhaseIndicator();
      }
    } else if (currentPhase === 'rest') {
      currentRound++;
      currentPhase = 'work';
      timeRemaining = workDuration;
      updatePhaseIndicator();
      updateRoundIndicators();
    }
  }
};

const startWorkout = function () {
  setupPanel.classList.add('hidden');
  activeTimer.classList.remove('hidden');

  currentRound = 1;
  currentPhase = 'work';
  timeRemaining = workDuration;
  isPaused = false;

  workoutStartTime = new Date();
  createRoundIndicators();

  updateTimerDisplay();
  updatePhaseIndicator();

  timerInterval = setInterval(timerTick, 1000);
};

const togglePause = function () {
  isPaused = !isPaused;

  const pauseIcon = btnPause.querySelector('.icon-pause');
  const playIcon = btnPause.querySelector('.icon-play');

  if (isPaused) {
    pauseIcon.classList.add('hidden');
    playIcon.classList.remove('hidden');
  } else {
    pauseIcon.classList.remove('hidden');
    playIcon.classList.add('hidden');
  }
};

const stopWorkout = function () {
  clearInterval(timerInterval);

  activeTimer.classList.add('hidden');
  setupPanel.classList.remove('hidden');

  isPaused = false;
  currentRound = 1;
  currentPhase = 'work';
  timeRemaining = 0;

  const pauseIcon = btnPause.querySelector('.icon-pause');
  const playIcon = btnPause.querySelector('.icon-play');

  pauseIcon.classList.remove('hidden');
  playIcon.classList.add('hidden');
};

const completeWorkout = function () {
  clearInterval(timerInterval);
  playSound('complete');

  const totalTime = (workDuration + restDuration) * totalRounds - restDuration;

  activeTimer.classList.add('hidden');
  workoutComplete.classList.remove('hidden');

  completedRounds.textContent = totalRounds;
  completedTime.textContent = formatTime(totalTime);

  saveWorkoutToHistory();
};

const saveWorkoutToHistory = function () {
  const totalTime = (workDuration + restDuration) * totalRounds - restDuration;

  const workout = {
    date: new Date().toISOString(),
    rounds: totalRounds,
    workDuration: workDuration,
    restDuration: restDuration,
    totalTime: totalTime,
  };

  workoutHistory.unshift(workout);

  localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
};

const formatRelativeTime = function (dateString) {
  const now = new Date();
  const workout = new Date(dateString);

  const diffTime = workout - now;
  const diffSeconds = Math.round(diffTime / 1000);
  const diffMinute = Math.round(diffTime / (1000 * 60));
  const diffHour = Math.round(diffTime / (1000 * 60 * 60));
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat('en', { style: 'long' });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, 'second');
  } else if (Math.abs(diffMinute) < 60) {
    return rtf.format(diffMinute, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else {
    return rtf.format(diffDays, 'day');
  }
};

const displayHistory = function () {
  const historyItems = historyList.querySelectorAll('.history-item');
  historyItems.forEach(function (item) {
    item.remove();
  });

  if (workoutHistory.length === 0) {
    emptyHistory.classList.remove('hidden');
    return;
  } else {
    emptyHistory.classList.add('hidden');
  }

  workoutHistory.forEach(function (workout) {
    const relativeTime = formatRelativeTime(workout.date);
    const formattedTime = formatTime(workout.totalTime);

    const html = `
      <div class="history-item">
        <div class="history-icon">💪</div>
        <div class="history-details">
          <p class="history-rounds">${workout.rounds} rounds</p>
          <p class="history-time">${relativeTime}</p>
        </div>
        <span class="history-duration">${formattedTime}</span>
      </div>
    `;
    historyList.insertAdjacentHTML('beforeend', html);
  });
};

navBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const view = btn.dataset.view;
    navBtns.forEach(function (b) {
      b.classList.remove('active');
    });

    btn.classList.add('active');

    if (view === 'timer') {
      timerView.classList.remove('hidden');
      historyView.classList.add('hidden');
    } else if (view === 'history') {
      timerView.classList.add('hidden');
      historyView.classList.remove('hidden');
      displayHistory();
    }
  });
});

const loadHistory = function () {
  const stored = localStorage.getItem('workoutHistory');
  if (stored) {
    workoutHistory = JSON.parse(stored);
  }
};

loadHistory();

btnStart.addEventListener('click', startWorkout);
btnPause.addEventListener('click', togglePause);
btnStop.addEventListener('click', stopWorkout);
btnNewWorkout.addEventListener('click', function () {
  setupPanel.classList.remove('hidden');
  workoutComplete.classList.add('hidden');
});

updateTotalTime();

workDurationEl.textContent = workDuration;
restDurationEl.textContent = restDuration;
roundsEl.textContent = totalRounds;
