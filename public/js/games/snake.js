/**
 * Neon Snake Game
 */
class SnakeGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.gridSize = 20;
    this.tileCount = 20; // 20x20 = 400x400
    this.canvas.width = 400;
    this.canvas.height = 400;

    this.reset();
  }

  reset() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    this.velocity = { x: 0, y: -1 };
    this.nextVelocity = { x: 0, y: -1 };
    this.score = 0;
    this.speed = 120; // ms per tick
    this.isRunning = false;
    this.isPaused = false;
    this.food = this.generateFood();
    this.goldenFood = null;
    this.goldenTimer = null;
    this.loopTimeout = null;
  }

  generateFood() {
    let position;
    while (!position || this.snake.some((s) => s.x === position.x && s.y === position.y)) {
      position = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount),
      };
    }
    return position;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.onScoreUpdate(this.score);
    this.bindEvents();
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    if (!this.isPaused) {
      this.update();
      this.draw();
    }
    this.loopTimeout = setTimeout(() => this.loop(), this.speed);
  }

  update() {
    this.velocity = { ...this.nextVelocity };
    const head = {
      x: this.snake[0].x + this.velocity.x,
      y: this.snake[0].y + this.velocity.y,
    };

    // Wall collision check
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.endGame();
      return;
    }

    // Self collision check
    if (this.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    // Normal Food check
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      window.sound?.playEat();
      this.onScoreUpdate(this.score);
      this.food = this.generateFood();

      // Slightly increase speed
      if (this.speed > 60) this.speed -= 2;

      // 20% chance to spawn golden food
      if (!this.goldenFood && Math.random() < 0.25) {
        this.goldenFood = this.generateFood();
        clearTimeout(this.goldenTimer);
        this.goldenTimer = setTimeout(() => {
          this.goldenFood = null;
        }, 5000);
      }
    } else if (this.goldenFood && head.x === this.goldenFood.x && head.y === this.goldenFood.y) {
      this.score += 35;
      window.sound?.playScore();
      this.onScoreUpdate(this.score);
      this.goldenFood = null;
      clearTimeout(this.goldenTimer);
    } else {
      this.snake.pop();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.canvas.width, i);
      ctx.stroke();
    }

    // Draw regular food
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw golden food
    if (this.goldenFood) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(
        this.goldenFood.x * this.gridSize + this.gridSize / 2,
        this.goldenFood.y * this.gridSize + this.gridSize / 2,
        this.gridSize / 2.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
      } else {
        // Body
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
    });

    ctx.shadowBlur = 0;
  }

  handleKey(e) {
    const key = e.key;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (this.velocity.y === 0) this.nextVelocity = { x: 0, y: -1 };
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      if (this.velocity.y === 0) this.nextVelocity = { x: 0, y: 1 };
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (this.velocity.x === 0) this.nextVelocity = { x: -1, y: 0 };
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (this.velocity.x === 0) this.nextVelocity = { x: 1, y: 0 };
    }
  }

  handleDirection(dir) {
    if (dir === 'UP' && this.velocity.y === 0) this.nextVelocity = { x: 0, y: -1 };
    if (dir === 'DOWN' && this.velocity.y === 0) this.nextVelocity = { x: 0, y: 1 };
    if (dir === 'LEFT' && this.velocity.x === 0) this.nextVelocity = { x: -1, y: 0 };
    if (dir === 'RIGHT' && this.velocity.x === 0) this.nextVelocity = { x: 1, y: 0 };
  }

  bindEvents() {
    this.keyHandler = (e) => this.handleKey(e);
    window.addEventListener('keydown', this.keyHandler);
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    window.sound?.playGameOver();
    clearTimeout(this.goldenTimer);
    clearTimeout(this.loopTimeout);
    this.onGameOver(this.score, { length: this.snake.length });
  }

  destroy() {
    this.isRunning = false;
    clearTimeout(this.goldenTimer);
    clearTimeout(this.loopTimeout);
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
}

window.SnakeGame = SnakeGame;
