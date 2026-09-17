/**
 * Neon Brick Breaker (Breakout)
 */
class BreakoutGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 440;
    this.canvas.height = 460;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Paddle
    this.paddleWidth = 80;
    this.paddleHeight = 12;
    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
    this.paddleSpeed = 7;
    this.rightPressed = false;
    this.leftPressed = false;

    // Ball
    this.ballRadius = 7;
    this.resetBall();

    // Bricks
    this.brickRowCount = 5;
    this.brickColumnCount = 7;
    this.brickWidth = 52;
    this.brickHeight = 16;
    this.brickPadding = 8;
    this.brickOffsetTop = 45;
    this.brickOffsetLeft = 14;

    this.colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
    this.points = [50, 40, 30, 20, 10];

    this.bricks = [];
    for (let c = 0; c < this.brickColumnCount; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < this.brickRowCount; r++) {
        this.bricks[c][r] = { x: 0, y: 0, status: 1, color: this.colors[r], point: this.points[r] };
      }
    }
  }

  resetBall() {
    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height - 40;
    const speed = 4;
    const angle = (Math.random() * Math.PI) / 3 + Math.PI / 3; // between 60 and 120 deg
    this.ballDX = speed * Math.cos(angle) * (Math.random() < 0.5 ? 1 : -1);
    this.ballDY = -speed * Math.sin(angle);
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
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // Move paddle with keys
    if (this.rightPressed && this.paddleX < this.canvas.width - this.paddleWidth) {
      this.paddleX += this.paddleSpeed;
    } else if (this.leftPressed && this.paddleX > 0) {
      this.paddleX -= this.paddleSpeed;
    }

    // Move ball
    this.ballX += this.ballDX;
    this.ballY += this.ballDY;

    // Wall bounce (Left/Right)
    if (this.ballX + this.ballDX > this.canvas.width - this.ballRadius || this.ballX + this.ballDX < this.ballRadius) {
      this.ballDX = -this.ballDX;
      window.sound?.playHit();
    }

    // Wall bounce (Top)
    if (this.ballY + this.ballDY < this.ballRadius) {
      this.ballDY = -this.ballDY;
      window.sound?.playHit();
    } else if (this.ballY + this.ballDY > this.canvas.height - this.ballRadius - this.paddleHeight - 10) {
      // Check paddle collision
      if (this.ballX + this.ballRadius > this.paddleX && this.ballX - this.ballRadius < this.paddleX + this.paddleWidth) {
        // Calculate bounce angle based on hit location
        const hitPoint = (this.ballX - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
        const maxAngle = Math.PI / 3; // 60 degrees
        const currentSpeed = Math.sqrt(this.ballDX * this.ballDX + this.ballDY * this.ballDY);
        this.ballDX = currentSpeed * Math.sin(hitPoint * maxAngle);
        this.ballDY = -Math.abs(currentSpeed * Math.cos(hitPoint * maxAngle));

        // Prevent sticking to paddle
        this.ballY = this.canvas.height - this.ballRadius - this.paddleHeight - 10;

        window.sound?.playJump();
      } else if (this.ballY + this.ballDY > this.canvas.height - this.ballRadius) {
        // Ball lost
        this.lives--;
        window.sound?.playHit();
        if (this.lives <= 0) {
          this.endGame();
          return;
        } else {
          this.resetBall();
        }
      }
    }

    // Brick collision
    let activeBricks = 0;
    for (let c = 0; c < this.brickColumnCount; c++) {
      for (let r = 0; r < this.brickRowCount; r++) {
        const b = this.bricks[c][r];
        if (b.status === 1) {
          activeBricks++;
          if (
            this.ballX + this.ballRadius > b.x &&
            this.ballX - this.ballRadius < b.x + this.brickWidth &&
            this.ballY + this.ballRadius > b.y &&
            this.ballY - this.ballRadius < b.y + this.brickHeight
          ) {
            this.ballDY = -this.ballDY;
            b.status = 0;
            this.score += b.point;
            window.sound?.playEat();
            this.onScoreUpdate(this.score);

            // Speed up slightly, but clamp to max speed to prevent tunneling
            const maxSpeed = 10;
            this.ballDX *= 1.015;
            this.ballDY *= 1.015;
            
            if (this.ballDX > maxSpeed) this.ballDX = maxSpeed;
            if (this.ballDX < -maxSpeed) this.ballDX = -maxSpeed;
            if (this.ballDY > maxSpeed) this.ballDY = maxSpeed;
            if (this.ballDY < -maxSpeed) this.ballDY = -maxSpeed;
          }
        }
      }
    }

    // All bricks cleared!
    if (activeBricks === 0) {
      this.score += 200;
      this.onScoreUpdate(this.score);
      window.sound?.playWin();
      this.endGame(true);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw bricks
    for (let c = 0; c < this.brickColumnCount; c++) {
      for (let r = 0; r < this.brickRowCount; r++) {
        const b = this.bricks[c][r];
        if (b.status === 1) {
          const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
          const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
          b.x = brickX;
          b.y = brickY;

          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.roundRect(brickX, brickY, this.brickWidth, this.brickHeight, 3);
          ctx.fill();
        }
      }
    }

    // Draw paddle
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(this.paddleX, this.canvas.height - this.paddleHeight - 10, this.paddleWidth, this.paddleHeight, 6);
    ctx.fill();

    // Draw ball
    ctx.fillStyle = '#f3f4f6';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw lives top HUD
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('LIVES: ', 14, 25);
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(65 + i * 16, 21, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.rightPressed = true;
      if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.leftPressed = true;
    };
    this.keyUp = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.rightPressed = false;
      if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.leftPressed = false;
    };

    // Mouse movement
    this.mouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      if (relativeX > 0 && relativeX < this.canvas.width) {
        this.paddleX = Math.max(0, Math.min(this.canvas.width - this.paddleWidth, relativeX - this.paddleWidth / 2));
      }
    };

    // Touch movement
    this.touchMove = (e) => {
      if (!e.touches[0]) return;
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      if (relativeX > 0 && relativeX < this.canvas.width) {
        this.paddleX = Math.max(0, Math.min(this.canvas.width - this.paddleWidth, relativeX - this.paddleWidth / 2));
      }
    };

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    this.canvas.addEventListener('mousemove', this.mouseMove);
    this.canvas.addEventListener('touchmove', this.touchMove, { passive: true });
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame(cleared = false) {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    if (!cleared) {
      window.sound?.playGameOver();
    }
    this.onGameOver(this.score, { cleared, remainingLives: this.lives });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.mouseMove);
      this.canvas.removeEventListener('touchmove', this.touchMove);
    }
  }
}

window.BreakoutGame = BreakoutGame;
