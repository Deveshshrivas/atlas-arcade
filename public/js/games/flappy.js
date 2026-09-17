/**
 * Flappy Wings Game
 */
class FlappyGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 380;
    this.canvas.height = 480;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Bird
    this.birdX = 60;
    this.birdY = 200;
    this.birdRadius = 13;
    this.velocity = 0;
    this.gravity = 0.38;
    this.jumpForce = -6.5;

    // Pipes
    this.pipes = [];
    this.pipeWidth = 52;
    this.pipeGap = 135;
    this.pipeSpeed = 2.2;
    this.pipeInterval = 100; // frames
    this.frameCount = 0;

    // Stars background
    this.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * (this.canvas.height - 40),
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    }));
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.onScoreUpdate(this.score);
    this.bindEvents();
    this.loop();
  }

  flap() {
    if (!this.isRunning || this.isPaused) return;
    this.velocity = this.jumpForce;
    window.sound?.playJump();
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
    this.frameCount++;

    // Bird physics
    this.velocity += this.gravity;
    this.birdY += this.velocity;

    // Floor and ceiling collisions
    const floorY = this.canvas.height - 24;
    if (this.birdY + this.birdRadius >= floorY) {
      this.birdY = floorY - this.birdRadius;
      this.endGame();
      return;
    }
    if (this.birdY - this.birdRadius <= 0) {
      this.birdY = this.birdRadius;
      this.velocity = 0;
    }

    // Spawn pipes
    if (this.frameCount % this.pipeInterval === 0) {
      const minHeight = 50;
      const maxHeight = floorY - this.pipeGap - minHeight;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

      this.pipes.push({
        x: this.canvas.width,
        topHeight,
        bottomY: topHeight + this.pipeGap,
        passed: false,
      });
    }

    // Move and test pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.pipeSpeed;

      // Score check
      if (!p.passed && p.x + this.pipeWidth < this.birdX) {
        p.passed = true;
        this.score++;
        window.sound?.playScore();
        this.onScoreUpdate(this.score);

        // Gradually increase speed
        if (this.pipeSpeed < 3.8) this.pipeSpeed += 0.04;
      }

      // Pipe Collision check (Bounding Box)
      if (
        this.birdX + this.birdRadius > p.x &&
        this.birdX - this.birdRadius < p.x + this.pipeWidth
      ) {
        if (this.birdY - this.birdRadius < p.topHeight || this.birdY + this.birdRadius > p.bottomY) {
          this.endGame();
          return;
        }
      }

      // Remove off-screen pipes
      if (p.x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Scroll stars
    this.stars.forEach((s) => {
      s.x -= s.speed;
      if (s.x < 0) s.x = this.canvas.width;
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.stars.forEach((s) => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw pipes
    this.pipes.forEach((p) => {
      // Neon green pipe gradient
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;

      // Top pipe
      ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
      // Top pipe rim
      ctx.fillRect(p.x - 3, p.topHeight - 16, this.pipeWidth + 6, 16);

      // Bottom pipe
      const bottomHeight = this.canvas.height - 24 - p.bottomY;
      ctx.fillRect(p.x, p.bottomY, this.pipeWidth, bottomHeight);
      // Bottom pipe rim
      ctx.fillRect(p.x - 3, p.bottomY, this.pipeWidth + 6, 16);
    });

    // Draw floor
    ctx.fillStyle = '#1f2937';
    ctx.shadowBlur = 0;
    ctx.fillRect(0, this.canvas.height - 24, this.canvas.width, 24);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, this.canvas.height - 24, this.canvas.width, 3);

    // Draw bird with rotation based on velocity
    ctx.save();
    ctx.translate(this.birdX, this.birdY);
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 4 * Math.PI) / 180));
    ctx.rotate(rotation);

    // Bird body
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, this.birdRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111827';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(5, -4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(8, -1);
    ctx.lineTo(17, 2);
    ctx.lineTo(8, 6);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  bindEvents() {
    this.keyHandler = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.flap();
      }
    };
    this.clickHandler = () => this.flap();

    window.addEventListener('keydown', this.keyHandler);
    this.canvas.addEventListener('pointerdown', this.clickHandler);
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.sound?.playGameOver();
    this.onGameOver(this.score, { pipesPassed: this.score });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyHandler);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.clickHandler);
    }
  }
}

window.FlappyGame = FlappyGame;
