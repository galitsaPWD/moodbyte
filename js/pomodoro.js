// --- Pomodoro Timer ---
const TIMER_MODES = {
  pomodoro: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
  'quick-focus': 15 * 60,
  'deep-work': 45 * 60,
  'micro-break': 2 * 60,
  'lunch-break': 30 * 60,
  'custom': null
};
let timerInterval = null;
let timeRemaining = TIMER_MODES.pomodoro;
let isTimerRunning = false;
let completedPomodoros = parseInt(localStorage.getItem('completedPomodoros') || '0');
const timerMinutes = document.getElementById('timer-minutes');
const timerSeconds = document.getElementById('timer-seconds');
const timerToggle = document.getElementById('timer-toggle');
const timerReset = document.getElementById('timer-reset');
const timerMode = document.getElementById('timer-mode');
const pomodoroCount = document.getElementById('pomodoro-count');

function updatePomodoroCount() {
  pomodoroCount.textContent = `${completedPomodoros} Pomodoro${completedPomodoros !== 1 ? 's' : ''}`;
}
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return {
    minutes: mins.toString().padStart(2, '0'),
    seconds: secs.toString().padStart(2, '0')
  };
}
function updateTimerDisplay() {
  if (!timerMinutes || !timerSeconds) return;
  const { minutes, seconds } = formatTime(timeRemaining);
  timerMinutes.textContent = minutes;
  timerSeconds.textContent = seconds;
  document.title = `${minutes}:${seconds} - MoodByte`;
}
function initializeTimer() {
  if (timerMinutes && timerSeconds) {
    updateTimerDisplay();
    updatePomodoroCount();
  }
}
function updateTimerModeOptions() {
  if (!timerMode) return;
  const modeLabels = {
    'pomodoro': 'Pomodoro (25m)',
    'short-break': 'Short Break (5m)',
    'long-break': 'Long Break (15m)',
    'quick-focus': 'Quick Focus (15m)',
    'deep-work': 'Deep Work (45m)',
    'micro-break': 'Micro Break (2m)',
    'lunch-break': 'Lunch Break (30m)'
  };
  timerMode.innerHTML = '';
  Object.keys(TIMER_MODES).forEach(mode => {
    if (mode !== 'custom') {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = modeLabels[mode];
      timerMode.appendChild(option);
    }
  });
  timerMode.addEventListener('change', () => {
    changeTimerMode();
  });
}
function promptCustomTime() {
  const customTime = prompt('Enter custom time in minutes (e.g., 30 for 30 minutes):');
  if (customTime === null) return;
  const minutes = parseInt(customTime);
  if (isNaN(minutes) || minutes <= 0 || minutes > 480) {
    // Optionally show notification
    return;
  }
  TIMER_MODES.custom = minutes * 60;
  currentMode = 'custom';
  timeRemaining = TIMER_MODES.custom;
  updateTimerDisplay();
}
function timerTick() {
  timeRemaining--;
  updateTimerDisplay();

  const timerCircle = document.querySelector('.timer-circle-visual');
  if (timerCircle) {
    timerCircle.classList.add('beat');
    setTimeout(() => {
      timerCircle.classList.remove('beat');
    }, 200); // Duration should match the CSS transition
  }

  if (timeRemaining <= 0) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerToggle.querySelector('i').className = 'fas fa-play';
    
    // Play alarm sound multiple times for better notification
    const sfxTimerComplete = document.getElementById('sfx-timer-complete');
    if (window.ambientAudio && window.ambientAudio.volume > 0) {
      window.ambientAudio.volume = 0;
    }
    if (sfxTimerComplete) {
      // Play alarm 3 times with intervals
      let alarmCount = 0;
      const playAlarm = () => {
        sfxTimerComplete.currentTime = 0;
        sfxTimerComplete.play().catch(e => console.log('Audio play failed:', e));
        alarmCount++;
        if (alarmCount < 3) {
          setTimeout(playAlarm, 2000); // Play again after 2 seconds
        } else {
          // Restore ambient sound after alarm finishes
          if (window.ambientAudio) {
            window.ambientAudio.volume = 0.3;
          }
        }
      };
      playAlarm();
    }
    
    // Track pomodoro completion for stats
    if (typeof trackPomodoroCompletion === 'function') {
      trackPomodoroCompletion();
    }
    
    // Show notification based on timer mode
    const currentMode = timerMode.value;
    let title, body;
    
    switch (currentMode) {
      case 'pomodoro':
        completedPomodoros++;
        localStorage.setItem('completedPomodoros', completedPomodoros);
        updatePomodoroCount();
        title = '🍅 Pomodoro Complete!';
        body = `Great work! You've completed ${completedPomodoros} pomodoro${completedPomodoros !== 1 ? 's' : ''}. Time for a break!`;
        break;
      case 'short-break':
        title = '☕ Short Break Complete!';
        body = 'Break time is over. Ready to focus again?';
        break;
      case 'long-break':
        title = '🌴 Long Break Complete!';
        body = 'You\'ve had a nice long break. Time to get back to work!';
        break;
      case 'quick-focus':
        title = '⚡ Quick Focus Complete!';
        body = 'Quick focus session done! Great job staying focused.';
        break;
      case 'deep-work':
        title = '🧠 Deep Work Complete!';
        body = 'Amazing! You\'ve completed a deep work session. Take a well-deserved break.';
        break;
      case 'micro-break':
        title = '😌 Micro Break Complete!';
        body = 'Quick refresh complete. Ready for more?';
        break;
      case 'lunch-break':
        title = '🍽️ Lunch Break Complete!';
        body = 'Lunch break is over. Time to get back to productivity!';
        break;
      case 'custom':
        title = '⏰ Custom Timer Complete!';
        body = 'Your custom timer has finished. Great job!';
        break;
      default:
        title = '⏰ Timer Complete!';
        body = 'Your timer has finished.';
    }
    
    // Show notification
    if (typeof showNotification === 'function') {
      showNotification(title, { 
        body: body,
        tag: 'timer-complete',
        requireInteraction: true
      });
    }
  }
}
function toggleTimer() {
  const playIcon = timerToggle.querySelector('i');
  if (isTimerRunning) {
    clearInterval(timerInterval);
    playIcon.className = 'fas fa-play';
  } else {
    timerInterval = setInterval(timerTick, 1000);
    playIcon.className = 'fas fa-pause';
  }
  isTimerRunning = !isTimerRunning;
}
function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerToggle.querySelector('i').className = 'fas fa-play';
  timeRemaining = TIMER_MODES[timerMode.value];
  updateTimerDisplay();
}
function changeTimerMode() {
  currentMode = timerMode.value;
  timeRemaining = TIMER_MODES[timerMode.value];
  resetTimer();
}
timerToggle.addEventListener('click', toggleTimer);
timerReset.addEventListener('click', resetTimer);
document.getElementById('timer-custom').addEventListener('click', promptCustomTime);

initializeTimer();
updateTimerModeOptions();
