/**
 * Cyber Tetris Game
 */
class TetrisGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.cols = 10;
    this.rows = 20;
    this.blockSize = 20;
    this.canvas.width = this.cols * this.blockSize;
    this.canvas.height = this.rows * this.blockSize;

    this.colors = [
      '#000000',
      '#00ffff', // I
      '#0000ff', // J
      '#ff8800', // L
      '#ffff00', // O
      '#00ff00', // S
      '#ff00ff', // T
      '#ff0000'  // Z
    ];

    this.tetrominoes = [
      [],
      [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
      [[2,0,0], [2,2,2], [0,0,0]], // J
      [[0,0,3], [3,3,3], [0,0,0]], // L
      [[4,4], [4,4]], // O
      [[0,5,5], [5,5,0], [0,0,0]], // S
      [[0,6,0], [6,6,6], [0,0,0]], // T
      [[7,7,0], [0,7,7], [0,0,0]]  // Z
    ];

    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.player = {
      pos: { x: 0, y: 0 },
      matrix: null,
      color: 0
    };
    this.resetPlayer();
  }

  resetPlayer() {
    const pieces = [1, 2, 3, 4, 5, 6, 7];
    const typeId = pieces[Math.floor(Math.random() * pieces.length)];
    this.player.matrix = this.tetrominoes[typeId];
    this.player.color = typeId;
    this.player.pos.y = 0;
    this.player.pos.x = Math.floor((this.cols / 2) - (this.player.matrix[0].length / 2));

    if (this.collide(this.board, this.player)) {
      this.gameOver();
    }
  }

  collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] !== 0 &&
            (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  merge(board, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          board[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
  }

  rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) {
      matrix.forEach(row => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  playerRotate(dir) {
    const pos = this.player.pos.x;
    let offset = 1;
    this.rotate(this.player.matrix, dir);
    while (this.collide(this.board, this.player)) {
      this.player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > this.player.matrix[0].length) {
        this.rotate(this.player.matrix, -dir);
        this.player.pos.x = pos;
        return;
      }
    }
    if (window.sound) window.sound.playBeep(400, 'sine', 0.05);
  }

  playerMove(offset) {
    this.player.pos.x += offset;
    if (this.collide(this.board, this.player)) {
      this.player.pos.x -= offset;
    } else {
      if (window.sound) window.sound.playBeep(300, 'square', 0.05);
    }
  }

  playerDrop() {
    this.player.pos.y++;
    if (this.collide(this.board, this.player)) {
      this.player.pos.y--;
      this.merge(this.board, this.player);
      this.resetPlayer();
      this.arenaSweep();
      if (window.sound) window.sound.playBeep(150, 'triangle', 0.1);
    }
    this.dropCounter = 0;
  }

  arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    outer: for (let y = this.board.length - 1; y >= 0; --y) {
      for (let x = 0; x < this.board[y].length; ++x) {
        if (this.board[y][x] === 0) {
          continue outer;
        }
      }

      const row = this.board.splice(y, 1)[0].fill(0);
      this.board.unshift(row);
      ++y;

      this.score += rowCount * 100;
      rowCount *= 2;
      linesCleared++;
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      this.onScoreUpdate(this.score);
      if (window.sound) window.sound.playBeep(600, 'sine', 0.3);
    }
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.bindEvents();
    requestAnimationFrame((time) => this.loop(time));
  }

  pause() {
    if (!this.isRunning) return false;
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
      requestAnimationFrame((time) => this.loop(time));
    }
    return this.isPaused;
  }

  destroy() {
    this.isRunning = false;
    this.unbindEvents();
  }

  gameOver() {
    this.isRunning = false;
    if (window.sound) window.sound.playExplosion();
    this.onGameOver(this.score);
  }

  loop(time = 0) {
    if (!this.isRunning || this.isPaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.playerDrop();
    }

    this.draw();
    requestAnimationFrame((time) => this.loop(time));
  }

  draw() {
    this.ctx.fillStyle = '#050a15';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawMatrix(this.board, { x: 0, y: 0 });
    this.drawMatrix(this.player.matrix, this.player.pos);

    // Draw grid
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.cols; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.blockSize, 0);
      this.ctx.lineTo(i * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.rows; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.blockSize);
      this.ctx.lineTo(this.canvas.width, i * this.blockSize);
      this.ctx.stroke();
    }
  }

  drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          this.ctx.fillStyle = this.colors[value];
          this.ctx.fillRect((x + offset.x) * this.blockSize, (y + offset.y) * this.blockSize, this.blockSize - 1, this.blockSize - 1);
          // Highlight
          this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
          this.ctx.fillRect((x + offset.x) * this.blockSize, (y + offset.y) * this.blockSize, this.blockSize - 1, 3);
          this.ctx.fillRect((x + offset.x) * this.blockSize, (y + offset.y) * this.blockSize, 3, this.blockSize - 1);
        }
      });
    });
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'LEFT') this.playerMove(-1);
    else if (dir === 'RIGHT') this.playerMove(1);
    else if (dir === 'UP') this.playerRotate(1);
    else if (dir === 'DOWN') this.playerDrop();
  }

  handleKeyDown = (e) => {
    if (!this.isRunning || this.isPaused) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.playerMove(-1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.playerMove(1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.playerDrop();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.playerRotate(1);
        break;
      case ' ':
        // Hard drop
        while (!this.collide(this.board, this.player)) {
          this.player.pos.y++;
        }
        this.player.pos.y--;
        this.playerDrop();
        break;
    }
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

window.TetrisGame = TetrisGame;
