/**
 * Cyber Minesweeper Game
 */
class MinesweeperGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.rows = 9;
    this.cols = 9;
    this.mineCount = 10;
    this.reset();
  }

  reset() {
    this.grid = [];
    this.flags = 0;
    this.revealedCount = 0;
    this.firstClick = true;
    this.isGameOver = false;
    this.isRunning = false;
    this.isPaused = false;
    this.timer = 0;
    this.timerInterval = null;
    this.score = 0;
    this.flagMode = false; // For mobile toggle

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = {
          row: r,
          col: c,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0,
        };
      }
    }
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.onScoreUpdate(this.score);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="minesweeper-wrap">
        <div class="ms-hud">
          <div class="ms-hud-item">💣 <strong id="ms-mines">${this.mineCount - this.flags}</strong></div>
          <button id="ms-flag-toggle" class="btn btn-sm btn-secondary ${this.flagMode ? 'active' : ''}">
            🚩 Flag Mode: <span>${this.flagMode ? 'ON' : 'OFF'}</span>
          </button>
          <div class="ms-hud-item">⏱️ <strong id="ms-timer">0s</strong></div>
        </div>

        <div class="ms-grid" id="ms-grid">
          ${this.grid
            .flat()
            .map(
              (cell) => `
            <button class="ms-cell" data-r="${cell.row}" data-c="${cell.col}"></button>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const gridEl = this.container.querySelector('#ms-grid');
    const flagBtn = this.container.querySelector('#ms-flag-toggle');

    flagBtn.addEventListener('click', () => {
      this.flagMode = !this.flagMode;
      flagBtn.classList.toggle('active', this.flagMode);
      flagBtn.querySelector('span').textContent = this.flagMode ? 'ON' : 'OFF';
      window.sound?.playClick();
    });

    gridEl.addEventListener('click', (e) => {
      const cellBtn = e.target.closest('.ms-cell');
      if (!cellBtn) return;
      const r = parseInt(cellBtn.dataset.r, 10);
      const c = parseInt(cellBtn.dataset.c, 10);

      if (this.flagMode) {
        this.toggleFlag(r, c);
      } else {
        this.revealCell(r, c);
      }
    });

    gridEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cellBtn = e.target.closest('.ms-cell');
      if (!cellBtn) return;
      const r = parseInt(cellBtn.dataset.r, 10);
      const c = parseInt(cellBtn.dataset.c, 10);
      this.toggleFlag(r, c);
    });
  }

  plantMines(safeR, safeC) {
    let planted = 0;
    while (planted < this.mineCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);

      // Avoid safe cell and its 8 immediate neighbors on first click
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;

      if (!this.grid[r][c].isMine) {
        this.grid[r][c].isMine = true;
        planted++;
      }
    }

    // Calculate neighboring mine numbers
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].isMine) {
                count++;
              }
            }
          }
          this.grid[r][c].neighborMines = count;
        }
      }
    }

    // Start timer on first click
    this.timerInterval = setInterval(() => {
      if (!this.isPaused && this.isRunning && !this.isGameOver) {
        this.timer++;
        const timerEl = this.container.querySelector('#ms-timer');
        if (timerEl) timerEl.textContent = `${this.timer}s`;
      }
    }, 1000);
  }

  toggleFlag(r, c) {
    if (this.isGameOver || !this.isRunning) return;
    const cell = this.grid[r][c];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    this.flags += cell.flagged ? 1 : -1;
    window.sound?.playClick();

    const btn = this.container.querySelector(`.ms-cell[data-r="${r}"][data-c="${c}"]`);
    if (btn) {
      btn.textContent = cell.flagged ? '🚩' : '';
      btn.classList.toggle('flagged', cell.flagged);
    }

    const minesEl = this.container.querySelector('#ms-mines');
    if (minesEl) minesEl.textContent = this.mineCount - this.flags;
  }

  revealCell(r, c) {
    if (this.isGameOver || !this.isRunning) return;
    const cell = this.grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (this.firstClick) {
      this.firstClick = false;
      this.plantMines(r, c);
    }

    cell.revealed = true;
    this.revealedCount++;

    const btn = this.container.querySelector(`.ms-cell[data-r="${r}"][data-c="${c}"]`);

    if (cell.isMine) {
      // Game Over: Mine Hit!
      btn.textContent = '💥';
      btn.classList.add('mine-hit');
      window.sound?.playHit();
      this.handleGameOver(false);
      return;
    }

    window.sound?.playTone(400 + cell.neighborMines * 60, 'sine', 0.05, 0.1);
    btn.classList.add('revealed');

    if (cell.neighborMines > 0) {
      btn.textContent = cell.neighborMines;
      btn.classList.add(`num-${cell.neighborMines}`);
    } else {
      // Cascade reveal for empty 0 cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            if (!this.grid[nr][nc].revealed) {
              this.revealCell(nr, nc);
            }
          }
        }
      }
    }

    // Check Win condition (All non-mine cells revealed)
    if (this.revealedCount === this.rows * this.cols - this.mineCount) {
      this.handleGameOver(true);
    }
  }

  handleGameOver(won) {
    this.isGameOver = true;
    clearInterval(this.timerInterval);

    // Reveal all remaining mines
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const btn = this.container.querySelector(`.ms-cell[data-r="${r}"][data-c="${c}"]`);
        if (cell.isMine && !cell.revealed && btn) {
          btn.textContent = '💣';
          btn.classList.add('mine-revealed');
        }
      }
    }

    if (won) {
      // Score calculation based on speed
      const timeBonus = Math.max(100, 1500 - this.timer * 12);
      this.score = 500 + timeBonus;
      window.sound?.playWin();
      this.onScoreUpdate(this.score);
    } else {
      this.score = this.revealedCount * 15;
      window.sound?.playGameOver();
      this.onScoreUpdate(this.score);
    }

    setTimeout(() => {
      this.onGameOver(this.score, { won, timeSeconds: this.timer, revealed: this.revealedCount });
    }, 1000);
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  destroy() {
    this.isGameOver = true;
    clearInterval(this.timerInterval);
    this.container.innerHTML = '';
  }
}

window.MinesweeperGame = MinesweeperGame;
