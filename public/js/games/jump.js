/**
 * Sky Jumper Game (Doodle Jump style)
 */
class JumpGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 360;
    this.canvas.height = 480;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.heightScore = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Player Jumper
    this.playerRadius = 14;
    this.playerX = this.canvas.width / 2;
    this.playerY = this.canvas.height - 100;
    this.vx = 0;
    this.vy = -10; // Initial upward launch
    this.gravity = 0.36;
    this.bounceForce = -9.5;

    this.leftPressed = false;
    this.rightPressed = false;

    // Platforms
    this.platformCount = 8;
    this.platformWidth = 60;
    this.platformHeight = 10;
    this.platforms = [];

    // Base landing platform
    this.platforms.push({
      x: this.canvas.width / 2 - 30,
      y: this.canvas.height - 40,
      width: 60,
      height: 10,
      type: 'static',
    });

    for (let i = 1; i < this.platformCount; i++) {
      this.platforms.push(this.generatePlatform(this.canvas.height - (i * this.canvas.height) / this.platformCount));
    }
  }

  generatePlatform(y) {
    const isMoving = Math.random() < 0.25;
    const hasSpring = !isMoving && Math.random() < 0.2;
    return {
      x: Math.random() * (this.canvas.width - this.platformWidth),
      y,
      width: this.platformWidth,
      height: this.platformHeight,
      type: isMoving ? 'moving' : 'static',
      vx: isMoving ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0,
      hasSpring,
    };
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
    // Horizontal steering
    if (this.leftPressed) this.vx = -4.5;
    else if (this.rightPressed) this.vx = 4.5;
    else this.vx *= 0.82;

    this.playerX += this.vx;

    // Screen wraparound
    if (this.playerX < -this.playerRadius) this.playerX = this.canvas.width + this.playerRadius;
    if (this.playerX > this.canvas.width + this.playerRadius) this.playerX = -this.playerRadius;

    // Vertical physics
    this.vy += this.gravity;
    this.playerY += this.vy;

    // Camera scrolling when player jumps into upper 45%
    if (this.playerY < this.canvas.height * 0.45) {
      const deltaY = this.canvas.height * 0.45 - this.playerY;
      this.playerY = this.canvas.height * 0.45;
      this.heightScore += Math.round(deltaY);
      this.score = this.heightScore;
      this.onScoreUpdate(this.score);

      // Scroll platforms down
      for (let p of this.platforms) {
        p.y += deltaY;
      }
    }

    // Update platforms & check respawn
    for (let p of this.platforms) {
      if (p.type === 'moving') {
        p.x += p.vx;
        if (p.x <= 0 || p.x + p.width >= this.canvas.width) {
          p.vx = -p.vx;
        }
      }

      // If platform scrolled off bottom, recycle to top
      if (p.y > this.canvas.height) {
        const highestY = Math.min(...this.platforms.map((pl) => pl.y));
        const newY = highestY - (this.canvas.height / this.platformCount) * (0.85 + Math.random() * 0.3);
        Object.assign(p, this.generatePlatform(newY));
      }

      // Check landing on platform from above (only when falling)
      if (this.vy > 0) {
        if (
          this.playerX + this.playerRadius > p.x &&
          this.playerX - this.playerRadius < p.x + p.width &&
          this.playerY + this.playerRadius >= p.y &&
          this.playerY + this.playerRadius <= p.y + p.height + this.vy
        ) {
          this.playerY = p.y - this.playerRadius;
          if (p.hasSpring) {
            this.vy = this.bounceForce * 1.6; // Super bounce
            window.sound?.playScore();
          } else {
            this.vy = this.bounceForce;
            window.sound?.playJump();
          }
        }
      }
    }

    // Fallen off bottom of screen = Game Over
    if (this.playerY - this.playerRadius > this.canvas.height) {
      this.endGame();
    }
  }

  draw() {
    const ctx = this.ctx;
    // Deep Space Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle star dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 73 + this.heightScore * 0.1) % this.canvas.width);
      const sy = (i * 47) % this.canvas.height;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Draw Platforms
    for (let p of this.platforms) {
      if (p.type === 'moving') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
      } else {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
      }
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 4);
      ctx.fill();

      // Draw spring if present
      if (p.hasSpring) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x + p.width / 2 - 5, p.y - 7, 10, 7);
      }
    }

    // Draw Jumper Alien (Glowing Purple/Violet)
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, this.playerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.playerX - 4, this.playerY - 3, 3.5, 0, Math.PI * 2);
    ctx.arc(this.playerX + 4, this.playerY - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.playerX - 4 + this.vx * 0.3, this.playerY - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(this.playerX + 4 + this.vx * 0.3, this.playerY - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Altitude indicator
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ALTITUDE: ${Math.round(this.heightScore / 10)}m`, 16, 26);
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.leftPressed = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.rightPressed = true;
    };
    this.keyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.leftPressed = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.rightPressed = false;
    };

    // Tilt or click on sides
    this.pointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < this.canvas.width / 2) {
        this.leftPressed = true;
        this.rightPressed = false;
      } else {
        this.rightPressed = true;
        this.leftPressed = false;
      }
    };
    this.pointerUp = () => {
      this.leftPressed = false;
      this.rightPressed = false;
    };

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    this.canvas.addEventListener('pointerdown', this.pointerDown);
    window.addEventListener('pointerup', this.pointerUp);
  }

  handleDirection(dir) {
    if (dir === 'LEFT') {
      this.vx = -5;
      this.playerX -= 15;
    }
    if (dir === 'RIGHT') {
      this.vx = 5;
      this.playerX += 15;
    }
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.sound?.playGameOver();
    this.onGameOver(this.score, { maxAltitude: Math.round(this.heightScore / 10) });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('pointerup', this.pointerUp);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.pointerDown);
    }
  }
}

window.JumpGame = JumpGame;
