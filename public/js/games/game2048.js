/**
 * 2048 Puzzle Game
 */
class Game2048 {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.gridSize = 4;
    this.tileSize = 80;
    this.gap = 12;
    this.padding = 16;
    this.canvas.width = this.padding * 2 + this.gridSize * this.tileSize + (this.gridSize - 1) * this.gap;
    this.canvas.height = this.canvas.width;

    this.tileColors = {
      2: { bg: '#1e293b', text: '#f8fafc' },
      4: { bg: '#334155', text: '#f8fafc' },
      8: { bg: '#0d9488', text: '#ffffff' },
      16: { bg: '#059669', text: '#ffffff' },
      32: { bg: '#16a34a', text: '#ffffff' },
      64: { bg: '#2563eb', text: '#ffffff' },
      128: { bg: '#4f46e5', text: '#ffffff' },
      256: { bg: '#7c3aed', text: '#ffffff' },
      512: { bg: '#c026d3', text: '#ffffff' },
      1024: { bg: '#db2777', text: '#ffffff' },
      2048: { bg: '#e11d48', text: '#ffffff' },
      4096: { bg: '#ea580c', text: '#ffffff' },
    };

    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0));
    this.score = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.won = false;

    this.addRandomTile();
    this.addRandomTile();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.onScoreUpdate(this.score);
    this.bindEvents();
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid board background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(8, 8, this.canvas.width - 16, this.canvas.height - 16, 12);
    ctx.fill();

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const val = this.grid[r][c];
        const x = this.padding + c * (this.tileSize + this.gap);
        const y = this.padding + r * (this.tileSize + this.gap);

        if (val === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.beginPath();
          ctx.roundRect(x, y, this.tileSize, this.tileSize, 8);
          ctx.fill();
        } else {
          const config = this.tileColors[val] || { bg: '#f59e0b', text: '#ffffff' };
          ctx.fillStyle = config.bg;
          ctx.shadowColor = config.bg;
          ctx.shadowBlur = val >= 128 ? 14 : 4;

          ctx.beginPath();
          ctx.roundRect(x, y, this.tileSize, this.tileSize, 8);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Number Text
          ctx.fillStyle = config.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let fontSize = 28;
          if (val > 512) fontSize = 22;
          if (val > 8192) fontSize = 18;
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.fillText(val, x + this.tileSize / 2, y + this.tileSize / 2 + 1);
        }
      }
    }
  }

  slideRow(row) {
    let arr = row.filter((val) => val !== 0);
    let gainedScore = 0;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gainedScore += arr[i];
        arr[i + 1] = 0;
      }
    }

    arr = arr.filter((val) => val !== 0);
    while (arr.length < this.gridSize) {
      arr.push(0);
    }
    return { newRow: arr, gainedScore };
  }

  move(direction) {
    if (!this.isRunning || this.isPaused) return;

    let moved = false;
    let turnScore = 0;

    if (direction === 'LEFT') {
      for (let r = 0; r < this.gridSize; r++) {
        const { newRow, gainedScore } = this.slideRow(this.grid[r]);
        turnScore += gainedScore;
        if (newRow.some((val, i) => val !== this.grid[r][i])) moved = true;
        this.grid[r] = newRow;
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < this.gridSize; r++) {
        const reversed = [...this.grid[r]].reverse();
        const { newRow, gainedScore } = this.slideRow(reversed);
        turnScore += gainedScore;
        newRow.reverse();
        if (newRow.some((val, i) => val !== this.grid[r][i])) moved = true;
        this.grid[r] = newRow;
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < this.gridSize; c++) {
        const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
        const { newRow, gainedScore } = this.slideRow(col);
        turnScore += gainedScore;
        for (let r = 0; r < this.gridSize; r++) {
          if (this.grid[r][c] !== newRow[r]) moved = true;
          this.grid[r][c] = newRow[r];
        }
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < this.gridSize; c++) {
        const col = [this.grid[3][c], this.grid[2][c], this.grid[1][c], this.grid[0][c]];
        const { newRow, gainedScore } = this.slideRow(col);
        turnScore += gainedScore;
        newRow.reverse();
        for (let r = 0; r < this.gridSize; r++) {
          if (this.grid[r][c] !== newRow[r]) moved = true;
          this.grid[r][c] = newRow[r];
        }
      }
    }

    if (moved) {
      if (turnScore > 0) {
        this.score += turnScore;
        window.sound?.playEat();
        this.onScoreUpdate(this.score);
      } else {
        window.sound?.playClick();
      }

      this.addRandomTile();
      this.draw();

      if (this.checkGameOver()) {
        this.endGame();
      }
    }
  }

  checkGameOver() {
    // Check for empty space
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }
    // Check horizontal merges
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize - 1; c++) {
        if (this.grid[r][c] === this.grid[r][c + 1]) return false;
      }
    }
    // Check vertical merges
    for (let c = 0; c < this.gridSize; c++) {
      for (let r = 0; r < this.gridSize - 1; r++) {
        if (this.grid[r][c] === this.grid[r + 1][c]) return false;
      }
    }
    return true;
  }

  bindEvents() {
    this.keyHandler = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.move('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        this.move('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        this.move('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.move('RIGHT');
      }
    };

    // Touch swipe
    let touchStartX = 0;
    let touchStartY = 0;
    this.touchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    this.touchEnd = (e) => {
      if (!e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 25) {
        if (absDx > absDy) {
          this.move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          this.move(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    };

    window.addEventListener('keydown', this.keyHandler);
    this.canvas.addEventListener('touchstart', this.touchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.touchEnd, { passive: true });
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    window.sound?.playGameOver();
    let maxTile = 0;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] > maxTile) maxTile = this.grid[r][c];
      }
    }
    this.onGameOver(this.score, { highestTile: maxTile });
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('keydown', this.keyHandler);
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.touchStart);
      this.canvas.removeEventListener('touchend', this.touchEnd);
    }
  }
}

window.Game2048 = Game2048;
