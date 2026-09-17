/**
 * Tic-Tac-Toe Master with Minimax AI
 */
class TicTacToeGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.mode = 'ai'; // 'ai' or 'pvp'
    this.difficulty = 'hard'; // 'hard' (Minimax) or 'easy'
    this.reset();
  }

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X'; // X is always human player
    this.isGameOver = false;
    this.isRunning = false;
    this.score = 0;
    this.streak = 0;
    this.round = 1;
    this.winningCombo = null;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.onScoreUpdate(this.score);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ttt-wrap">
        <div class="ttt-controls">
          <select id="ttt-mode" class="ttt-select">
            <option value="ai" ${this.mode === 'ai' ? 'selected' : ''}>vs AI</option>
            <option value="pvp" ${this.mode === 'pvp' ? 'selected' : ''}>2 Players (Local)</option>
          </select>
          <select id="ttt-diff" class="ttt-select" ${this.mode === 'pvp' ? 'style="display:none;"' : ''}>
            <option value="hard" ${this.difficulty === 'hard' ? 'selected' : ''}>Unbeatable AI</option>
            <option value="easy" ${this.difficulty === 'easy' ? 'selected' : ''}>Casual AI</option>
          </select>
        </div>

        <div class="ttt-status" id="ttt-status">
          Player <span class="badge-${this.currentPlayer.toLowerCase()}">${this.currentPlayer}</span>'s Turn
        </div>

        <div class="ttt-grid">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
            .map(
              (idx) => `
            <button class="ttt-cell" data-idx="${idx}"></button>
          `
            )
            .join('')}
        </div>

        <div class="ttt-footer-hud">
          <span>Streak: <strong id="ttt-streak">${this.streak}</strong></span>
          <span>Round: <strong id="ttt-round">${this.round}</strong></span>
          <button id="ttt-next-round" class="btn btn-sm btn-secondary" style="display:none;">Next Round</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const cells = this.container.querySelectorAll('.ttt-cell');
    cells.forEach((cell) => {
      cell.addEventListener('click', () => {
        const idx = parseInt(cell.dataset.idx, 10);
        this.makeMove(idx);
      });
    });

    const modeSelect = this.container.querySelector('#ttt-mode');
    const diffSelect = this.container.querySelector('#ttt-diff');
    const nextBtn = this.container.querySelector('#ttt-next-round');

    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.mode = e.target.value;
        if (diffSelect) {
          diffSelect.style.display = this.mode === 'ai' ? 'inline-block' : 'none';
        }
        this.resetRound();
      });
    }

    if (diffSelect) {
      diffSelect.addEventListener('change', (e) => {
        this.difficulty = e.target.value;
        this.resetRound();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.round++;
        this.resetRound();
      });
    }
  }

  resetRound() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.winningCombo = null;

    const cells = this.container.querySelectorAll('.ttt-cell');
    cells.forEach((c) => {
      c.textContent = '';
      c.className = 'ttt-cell';
      c.disabled = false;
    });

    const nextBtn = this.container.querySelector('#ttt-next-round');
    if (nextBtn) nextBtn.style.display = 'none';

    const roundEl = this.container.querySelector('#ttt-round');
    if (roundEl) roundEl.textContent = this.round;

    this.updateStatusText();
  }

  makeMove(idx) {
    if (this.board[idx] || this.isGameOver) return;

    this.board[idx] = this.currentPlayer;
    window.sound?.playClick();
    this.updateCell(idx, this.currentPlayer);

    const win = this.checkWin(this.board);
    if (win) {
      this.handleWin(win);
      return;
    }

    if (this.isBoardFull(this.board)) {
      this.handleDraw();
      return;
    }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.updateStatusText();

    if (this.mode === 'ai' && this.currentPlayer === 'O') {
      setTimeout(() => this.makeAIMove(), 300);
    }
  }

  updateCell(idx, player) {
    const cell = this.container.querySelector(`.ttt-cell[data-idx="${idx}"]`);
    if (cell) {
      cell.textContent = player;
      cell.classList.add(`ttt-cell-${player.toLowerCase()}`);
    }
  }

  makeAIMove() {
    if (this.isGameOver) return;

    let moveIdx;
    if (this.difficulty === 'easy' && Math.random() < 0.45) {
      // Random open spot for casual AI
      const open = this.board.map((val, i) => (val === null ? i : null)).filter((i) => i !== null);
      moveIdx = open[Math.floor(Math.random() * open.length)];
    } else {
      // Minimax unbeatable AI
      moveIdx = this.getBestMove();
    }

    if (moveIdx !== undefined && moveIdx !== null) {
      this.makeMove(moveIdx);
    }
  }

  getBestMove() {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'O';
        let score = this.minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  minimax(board, depth, isMaximizing) {
    const win = this.checkWin(board);
    if (win) {
      return win.winner === 'O' ? 10 - depth : depth - 10;
    }
    if (this.isBoardFull(board)) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          let score = this.minimax(board, depth + 1, false);
          board[i] = null;
          maxScore = Math.max(score, maxScore);
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          let score = this.minimax(board, depth + 1, true);
          board[i] = null;
          minScore = Math.min(score, minScore);
        }
      }
      return minScore;
    }
  }

  checkWin(board) {
    const winningLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Cols
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (let line of winningLines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return null;
  }

  isBoardFull(board) {
    return board.every((cell) => cell !== null);
  }

  handleWin(win) {
    this.isGameOver = true;
    win.line.forEach((idx) => {
      const cell = this.container.querySelector(`.ttt-cell[data-idx="${idx}"]`);
      if (cell) cell.classList.add('win-cell');
    });

    const statusEl = this.container.querySelector('#ttt-status');
    const nextBtn = this.container.querySelector('#ttt-next-round');

    if (win.winner === 'X') {
      this.streak++;
      const roundPoints = 100 + this.streak * 25;
      this.score += roundPoints;
      window.sound?.playWin();
      if (statusEl) statusEl.innerHTML = `<span class="badge-win">🎉 Player X Won! (+${roundPoints} pts)</span>`;
    } else {
      this.streak = 0;
      window.sound?.playGameOver();
      if (statusEl) statusEl.innerHTML = `<span class="badge-lose">🤖 Player O Won!</span>`;
    }

    this.onScoreUpdate(this.score);
    this.updateStreakHUD();
    if (nextBtn) nextBtn.style.display = 'inline-block';

    // End match if 3 rounds completed or human lost to AI
    if (this.round >= 3 || (this.mode === 'ai' && win.winner === 'O')) {
      setTimeout(() => {
        this.onGameOver(this.score, { streak: this.streak, rounds: this.round });
      }, 1200);
    }
  }

  handleDraw() {
    this.isGameOver = true;
    window.sound?.playScore();
    this.score += 40;
    this.onScoreUpdate(this.score);

    const statusEl = this.container.querySelector('#ttt-status');
    const nextBtn = this.container.querySelector('#ttt-next-round');
    if (statusEl) statusEl.innerHTML = `<span>🤝 It's a Draw! (+40 pts)</span>`;
    if (nextBtn) nextBtn.style.display = 'inline-block';

    if (this.round >= 3) {
      setTimeout(() => {
        this.onGameOver(this.score, { streak: this.streak, rounds: this.round });
      }, 1200);
    }
  }

  updateStatusText() {
    const statusEl = this.container.querySelector('#ttt-status');
    if (statusEl && !this.isGameOver) {
      statusEl.innerHTML = `Player <strong class="badge-${this.currentPlayer.toLowerCase()}">${this.currentPlayer}</strong>'s Turn`;
    }
  }

  updateStreakHUD() {
    const streakEl = this.container.querySelector('#ttt-streak');
    if (streakEl) streakEl.textContent = this.streak;
  }

  pause() {
    return false; // Turn-based
  }

  destroy() {
    this.isGameOver = true;
    this.container.innerHTML = '';
  }
}

window.TicTacToeGame = TicTacToeGame;
