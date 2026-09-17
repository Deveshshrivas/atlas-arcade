/**
 * Galaxy Invaders Game
 */
class InvadersGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 440;
    this.canvas.height = 480;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Player Cannon
    this.playerWidth = 32;
    this.playerHeight = 16;
    this.playerX = (this.canvas.width - this.playerWidth) / 2;
    this.playerY = this.canvas.height - 30;
    this.playerSpeed = 5;
    this.leftPressed = false;
    this.rightPressed = false;
    this.shootCooldown = 0;

    // Bullets
    this.playerBullets = [];
    this.alienBullets = [];

    // Aliens (4 rows x 8 columns)
    this.alienRows = 4;
    this.alienCols = 8;
    this.alienWidth = 24;
    this.alienHeight = 16;
    this.alienPadding = 14;
    this.alienOffsetTop = 50;
    this.alienOffsetLeft = 30;
    this.alienSpeed = 1.0;
    this.alienDir = 1; // 1 = right, -1 = left
    this.aliens = [];

    const rowColors = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'];
    const rowPoints = [40, 30, 20, 10];

    for (let r = 0; r < this.alienRows; r++) {
      for (let c = 0; c < this.alienCols; c++) {
        this.aliens.push({
          x: c * (this.alienWidth + this.alienPadding) + this.alienOffsetLeft,
          y: r * (this.alienHeight + this.alienPadding) + this.alienOffsetTop,
          alive: true,
          color: rowColors[r],
          points: rowPoints[r],
        });
      }
    }

    // Defense Bunkers (3 bunkers)
    this.bunkers = [];
    const bunkerWidth = 44;
    const bunkerHeight = 24;
    for (let i = 0; i < 3; i++) {
      const bx = 60 + i * 130;
      this.bunkers.push({ x: bx, y: this.canvas.height - 85, width: bunkerWidth, height: bunkerHeight, hp: 12 });
    }

    // Mystery UFO
    this.ufo = null;
    this.ufoTimer = 0;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.onScoreUpdate(this.score);
    this.bindEvents();
    this.loop();
  }

  shoot() {
    if (!this.isRunning || this.isPaused) return;
    if (this.shootCooldown <= 0) {
      this.playerBullets.push({
        x: this.playerX + this.playerWidth / 2 - 2,
        y: this.playerY - 8,
        speed: 7,
      });
      window.sound?.playTone(720, 'square', 0.05, 0.15);
      this.shootCooldown = 18; // frame delay between shots
    }
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
    if (this.shootCooldown > 0) this.shootCooldown--;

    // Move player
    if (this.leftPressed && this.playerX > 10) {
      this.playerX -= this.playerSpeed;
    }
    if (this.rightPressed && this.playerX < this.canvas.width - this.playerWidth - 10) {
      this.playerX += this.playerSpeed;
    }

    // Update player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.y -= b.speed;
      if (b.y < 0) {
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Check bunker hit
      let hitBunker = false;
      for (let bk of this.bunkers) {
        if (bk.hp > 0 && b.x > bk.x && b.x < bk.x + bk.width && b.y > bk.y && b.y < bk.y + bk.height) {
          bk.hp--;
          hitBunker = true;
          break;
        }
      }
      if (hitBunker) {
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Check alien hit
      for (let a of this.aliens) {
        if (a.alive && b.x > a.x && b.x < a.x + this.alienWidth && b.y > a.y && b.y < a.y + this.alienHeight) {
          a.alive = false;
          this.playerBullets.splice(i, 1);
          this.score += a.points;
          window.sound?.playEat();
          this.onScoreUpdate(this.score);
          break;
        }
      }

      // Check UFO hit
      if (this.ufo && b.x > this.ufo.x && b.x < this.ufo.x + 36 && b.y > this.ufo.y && b.y < this.ufo.y + 14) {
        this.score += 150;
        this.onScoreUpdate(this.score);
        window.sound?.playWin();
        this.ufo = null;
        this.playerBullets.splice(i, 1);
      }
    }

    // Move aliens
    let shouldShiftDown = false;
    const livingAliens = this.aliens.filter((a) => a.alive);

    if (livingAliens.length === 0) {
      // Wave Cleared bonus!
      this.score += 300;
      this.onScoreUpdate(this.score);
      window.sound?.playWin();
      this.resetWave();
      return;
    }

    // Dynamic speed based on remaining aliens
    const currentSpeed = this.alienSpeed + (this.alienRows * this.alienCols - livingAliens.length) * 0.04;

    for (let a of livingAliens) {
      a.x += currentSpeed * this.alienDir;
      if (a.x + this.alienWidth > this.canvas.width - 10 || a.x < 10) {
        shouldShiftDown = true;
      }
    }

    if (shouldShiftDown) {
      this.alienDir *= -1;
      for (let a of livingAliens) {
        a.y += 14;
        if (a.y + this.alienHeight >= this.playerY) {
          // Aliens invaded Earth!
          this.endGame();
          return;
        }
      }
    }

    // Alien firing logic
    if (Math.random() < 0.025 && this.alienBullets.length < 5) {
      const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
      if (shooter) {
        this.alienBullets.push({
          x: shooter.x + this.alienWidth / 2,
          y: shooter.y + this.alienHeight,
          speed: 3.5,
        });
      }
    }

    // Update alien bullets
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const b = this.alienBullets[i];
      b.y += b.speed;
      if (b.y > this.canvas.height) {
        this.alienBullets.splice(i, 1);
        continue;
      }

      // Bunker hit
      let hitBunker = false;
      for (let bk of this.bunkers) {
        if (bk.hp > 0 && b.x > bk.x && b.x < bk.x + bk.width && b.y > bk.y && b.y < bk.y + bk.height) {
          bk.hp--;
          hitBunker = true;
          break;
        }
      }
      if (hitBunker) {
        this.alienBullets.splice(i, 1);
        continue;
      }

      // Player hit
      if (
        b.x > this.playerX &&
        b.x < this.playerX + this.playerWidth &&
        b.y > this.playerY &&
        b.y < this.playerY + this.playerHeight
      ) {
        this.alienBullets.splice(i, 1);
        this.lives--;
        window.sound?.playHit();
        if (this.lives <= 0) {
          this.endGame();
          return;
        }
      }
    }

    // UFO management
    this.ufoTimer++;
    if (!this.ufo && this.ufoTimer > 600) {
      if (Math.random() < 0.01) {
        this.ufo = { x: -40, y: 22, speed: 2.5 };
        this.ufoTimer = 0;
      }
    }
    if (this.ufo) {
      this.ufo.x += this.ufo.speed;
      if (this.ufo.x > this.canvas.width + 40) {
        this.ufo = null;
      }
    }
  }

  resetWave() {
    this.alienSpeed += 0.2;
    for (let a of this.aliens) {
      a.alive = true;
      a.y -= 40;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Player Cannon
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.playerX, this.playerY + 6, this.playerWidth, this.playerHeight - 6);
    ctx.fillRect(this.playerX + this.playerWidth / 2 - 3, this.playerY, 6, 6);

    // Draw Player Bullets
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    for (let b of this.playerBullets) {
      ctx.fillRect(b.x, b.y, 3, 9);
    }

    // Draw Aliens
    for (let a of this.aliens) {
      if (a.alive) {
        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(a.x, a.y, this.alienWidth, this.alienHeight, 3);
        ctx.fill();

        // Eye dots
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillRect(a.x + 5, a.y + 4, 3, 3);
        ctx.fillRect(a.x + this.alienWidth - 8, a.y + 4, 3, 3);
      }
    }

    // Draw Alien Bullets
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 6;
    for (let b of this.alienBullets) {
      ctx.fillRect(b.x - 1, b.y, 3, 8);
    }

    // Draw Bunkers
    ctx.shadowBlur = 0;
    for (let bk of this.bunkers) {
      if (bk.hp > 0) {
        const alpha = bk.hp / 12;
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.roundRect(bk.x, bk.y, bk.width, bk.height, 4);
        ctx.fill();
      }
    }

    // Draw UFO
    if (this.ufo) {
      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(this.ufo.x + 18, this.ufo.y + 7, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD: Lives
    ctx.shadowBlur = 0;
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('SHIPS:', 14, 25);
    for (let i = 0; i < this.lives; i++) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(65 + i * 16, 17, 10, 8);
    }
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.leftPressed = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.rightPressed = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.shoot();
      }
    };
    this.keyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.leftPressed = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.rightPressed = false;
    };

    this.pointerDown = (e) => {
      this.shoot();
    };

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    this.canvas.addEventListener('pointerdown', this.pointerDown);
  }

  handleDirection(dir) {
    if (dir === 'LEFT') this.playerX = Math.max(10, this.playerX - 25);
    if (dir === 'RIGHT') this.playerX = Math.min(this.canvas.width - this.playerWidth - 10, this.playerX + 25);
    if (dir === 'UP') this.shoot();
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.sound?.playGameOver();
    this.onGameOver(this.score, { remainingLives: this.lives });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.pointerDown);
    }
  }
}

window.InvadersGame = InvadersGame;
