/**
 * Whack-A-Cyberbug Game
 */
class WhackGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.timeLeft = 30; // 30 seconds match
    this.streak = 0;
    this.maxStreak = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.timerInterval = null;
    this.popupTimeout = null;
    this.activeHoles = new Set();
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.onScoreUpdate(this.score);
    this.render();

    this.timerInterval = setInterval(() => {
      if (!this.isPaused && this.isRunning) {
        this.timeLeft--;
        const timeEl = this.container.querySelector('#whack-timer');
        if (timeEl) timeEl.textContent = `${this.timeLeft}s`;

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }
    }, 1000);

    this.scheduleNextBug();
  }

  render() {
    this.container.innerHTML = `
      <div class="whack-wrap">
        <div class="whack-hud">
          <span>Time: <strong id="whack-timer">${this.timeLeft}s</strong></span>
          <span>Combo: <strong id="whack-combo" class="badge-combo">0x</strong></span>
        </div>

        <div class="whack-grid" id="whack-grid">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
            .map(
              (idx) => `
            <div class="whack-hole" data-idx="${idx}">
              <div class="whack-bug hidden" data-idx="${idx}">
                <span class="bug-icon">👾</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const gridEl = this.container.querySelector('#whack-grid');
    gridEl.addEventListener('pointerdown', (e) => {
      if (!this.isRunning || this.isPaused) return;

      const bugEl = e.target.closest('.whack-bug');
      if (bugEl && !bugEl.classList.contains('hidden') && !bugEl.classList.contains('whacked')) {
        const idx = parseInt(bugEl.dataset.idx, 10);
        this.whack(idx, bugEl);
      } else {
        // Missed click resets combo
        this.streak = 0;
        this.updateComboHUD();
      }
    });
  }

  scheduleNextBug() {
    if (!this.isRunning || this.timeLeft <= 0) return;

    // Faster popups as time ticks down
    const delay = Math.max(350, 750 - (30 - this.timeLeft) * 12);
    this.popupTimeout = setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.popBug();
      }
      this.scheduleNextBug();
    }, delay);
  }

  popBug() {
    const openHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((idx) => !this.activeHoles.has(idx));
    if (openHoles.length === 0) return;

    const holeIdx = openHoles[Math.floor(Math.random() * openHoles.length)];
    this.activeHoles.add(holeIdx);

    const bugEl = this.container.querySelector(`.whack-bug[data-idx="${holeIdx}"]`);
    if (!bugEl) return;

    const isGolden = Math.random() < 0.18;
    const bugIcons = isGolden ? ['🌟', '💎'] : ['👾', '🪲', '🕷️', '🦠'];
    const icon = bugIcons[Math.floor(Math.random() * bugIcons.length)];

    bugEl.querySelector('.bug-icon').textContent = icon;
    bugEl.dataset.golden = isGolden ? 'true' : 'false';
    bugEl.classList.remove('hidden', 'whacked');

    // Bug stay duration
    const stayDuration = Math.max(550, 950 - (30 - this.timeLeft) * 14);
    setTimeout(() => {
      if (this.activeHoles.has(holeIdx)) {
        bugEl.classList.add('hidden');
        this.activeHoles.delete(holeIdx);
      }
    }, stayDuration);
  }

  whack(idx, bugEl) {
    bugEl.classList.add('whacked');
    const isGolden = bugEl.dataset.golden === 'true';

    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;

    const multiplier = Math.min(4, 1 + Math.floor(this.streak / 5) * 0.5);
    const basePts = isGolden ? 60 : 20;
    const points = Math.round(basePts * multiplier);

    this.score += points;
    if (isGolden) {
      window.sound?.playScore();
    } else {
      window.sound?.playEat();
    }

    this.onScoreUpdate(this.score);
    this.updateComboHUD();

    setTimeout(() => {
      bugEl.classList.add('hidden');
      this.activeHoles.delete(idx);
    }, 150);
  }

  updateComboHUD() {
    const comboEl = this.container.querySelector('#whack-combo');
    if (comboEl) {
      comboEl.textContent = `${this.streak}x`;
      comboEl.classList.toggle('active', this.streak >= 5);
    }
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    clearTimeout(this.popupTimeout);
    window.sound?.playWin();
    this.onGameOver(this.score, { maxStreak: this.maxStreak });
  }

  destroy() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    clearTimeout(this.popupTimeout);
    this.container.innerHTML = '';
  }
}

window.WhackGame = WhackGame;
