/**
 * Space Platformer Game
 */
class PlatformerGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 400;

    this.keys = {};
    this.reset();
  }

  reset() {
    this.score = 0;
    this.camera = 0;
    this.player = {
      x: 50,
      y: 100,
      width: 20,
      height: 30,
      vx: 0,
      vy: 0,
      speed: 4,
      jumpForce: -12,
      grounded: false
    };

    this.gravity = 0.6;
    this.friction = 0.8;

    this.platforms = [
      { x: 0, y: 350, w: 800, h: 50 } // Floor
    ];
    this.coins = [];
    this.spikes = [];

    this.generateLevel(10);

    this.isRunning = false;
    this.isPaused = false;
  }

  generateLevel(screens) {
    let lastX = 400;
    for (let i = 0; i < screens * 10; i++) {
      let w = Math.random() * 100 + 50;
      let x = lastX + Math.random() * 150 + 50;
      let y = Math.random() * 200 + 100;
      this.platforms.push({ x, y, w, h: 20 });
      lastX = x + w;

      // Add coin
      if (Math.random() > 0.3) {
        this.coins.push({ x: x + w/2 - 10, y: y - 30, w: 15, h: 15, collected: false });
      }

      // Add spike
      if (Math.random() > 0.7) {
        this.spikes.push({ x: x + Math.random()*(w-20), y: y - 20, w: 20, h: 20 });
      }
    }
    // Final floor to catch fallers at the end
    this.platforms.push({ x: lastX, y: 350, w: 2000, h: 50 });
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
    if (!this.isPaused) requestAnimationFrame((time) => this.loop(time));
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

  loop(time) {
    if (!this.isRunning || this.isPaused) return;
    this.update();
    this.draw();
    requestAnimationFrame((time) => this.loop(time));
  }

  update() {
    // Input
    if (this.keys['ArrowLeft'] || this.keys['a']) this.player.vx -= 1.5;
    if (this.keys['ArrowRight'] || this.keys['d']) this.player.vx += 1.5;
    
    // Jump
    if ((this.keys['ArrowUp'] || this.keys['w'] || this.keys[' ']) && this.player.grounded) {
      this.player.vy = this.player.jumpForce;
      this.player.grounded = false;
      if (window.sound) window.sound.playJump();
    }

    // Physics
    this.player.vy += this.gravity;
    this.player.vx *= this.friction;

    // Limit speed
    if (this.player.vx > this.player.speed) this.player.vx = this.player.speed;
    if (this.player.vx < -this.player.speed) this.player.vx = -this.player.speed;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.grounded = false;

    // Collisions with platforms
    for (let p of this.platforms) {
      if (this.rectIntersect(this.player, p)) {
        // Resolve collision
        // Coming from above
        if (this.player.vy > 0 && this.player.y + this.player.height - this.player.vy <= p.y + 10) {
          this.player.grounded = true;
          this.player.y = p.y - this.player.height;
          this.player.vy = 0;
        } else if (this.player.vy < 0 && this.player.y - this.player.vy >= p.y + p.h - 10) { // from below
          this.player.y = p.y + p.h;
          this.player.vy = 0;
        } else {
          // Side collision
          if (this.player.vx > 0) this.player.x = p.x - this.player.width;
          else if (this.player.vx < 0) this.player.x = p.x + p.w;
          this.player.vx = 0;
        }
      }
    }

    // Collect coins
    for (let c of this.coins) {
      if (!c.collected && this.rectIntersect(this.player, c)) {
        c.collected = true;
        this.score += 10;
        this.onScoreUpdate(this.score);
        if (window.sound) window.sound.playPoint();
      }
    }

    // Hit spikes
    for (let s of this.spikes) {
      if (this.rectIntersect(this.player, { x: s.x+5, y: s.y+5, w: s.w-10, h: s.h-5 })) { // Smaller hitbox for spike
        this.gameOver();
        return;
      }
    }

    // Fall in pit
    if (this.player.y > this.canvas.height) {
      this.gameOver();
      return;
    }

    // Camera follow
    if (this.player.x > this.camera + this.canvas.width * 0.5) {
      this.camera = this.player.x - this.canvas.width * 0.5;
    }
  }

  rectIntersect(r1, r2) {
    let w2 = r2.w || r2.width;
    let h2 = r2.h || r2.height;
    return !(
      r2.x > r1.x + r1.width || 
      r2.x + w2 < r1.x || 
      r2.y > r1.y + r1.height ||
      r2.y + h2 < r1.y
    );
  }

  draw() {
    // BG
    this.ctx.fillStyle = '#0a0a2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.camera, 0);

    // Platforms
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00ffff';
    for (let p of this.platforms) {
      if (p.x + p.w > this.camera && p.x < this.camera + this.canvas.width) {
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    }
    this.ctx.shadowBlur = 0;

    // Coins
    this.ctx.fillStyle = '#ffff00';
    for (let c of this.coins) {
      if (!c.collected && c.x > this.camera && c.x < this.camera + this.canvas.width) {
        this.ctx.beginPath();
        this.ctx.arc(c.x + c.w/2, c.y + c.h/2, c.w/2, 0, Math.PI*2);
        this.ctx.fill();
      }
    }

    // Spikes
    this.ctx.fillStyle = '#ff0000';
    for (let s of this.spikes) {
      if (s.x > this.camera && s.x < this.camera + this.canvas.width) {
        this.ctx.beginPath();
        this.ctx.moveTo(s.x + s.w/2, s.y);
        this.ctx.lineTo(s.x + s.w, s.y + s.h);
        this.ctx.lineTo(s.x, s.y + s.h);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // Player
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.restore();
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'LEFT') {
      this.keys['ArrowLeft'] = true;
      setTimeout(() => this.keys['ArrowLeft'] = false, 150);
    } else if (dir === 'RIGHT') {
      this.keys['ArrowRight'] = true;
      setTimeout(() => this.keys['ArrowRight'] = false, 150);
    } else if (dir === 'UP') {
      this.keys['ArrowUp'] = true;
      setTimeout(() => this.keys['ArrowUp'] = false, 150);
    }
  }

  handleKeyDown = (e) => {
    this.keys[e.key] = true;
  };

  handleKeyUp = (e) => {
    this.keys[e.key] = false;
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
}

window.PlatformerGame = PlatformerGame;
