/**
 * Neon Copter Game
 */
class CopterGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 600;
    this.canvas.height = 400;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.distance = 0;
    
    this.player = {
      x: 100,
      y: 200,
      width: 30,
      height: 15,
      vy: 0,
      gravity: 0.3,
      lift: -0.6
    };

    this.isThrusting = false;
    this.obstacles = [];
    this.cave = []; // Top and bottom bounds
    
    // Generate initial cave
    for (let i = 0; i <= this.canvas.width; i += 20) {
      this.cave.push({
        x: i,
        top: 50,
        bottom: 350
      });
    }

    this.gapSize = 300;
    this.speed = 4;
    this.frame = 0;

    this.isRunning = false;
    this.isPaused = false;
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
    this.frame++;
    this.distance++;
    
    if (this.distance % 60 === 0) {
      this.score += 10;
      this.onScoreUpdate(this.score);
    }

    // Physics
    if (this.isThrusting) {
      this.player.vy += this.player.lift;
    }
    this.player.vy += this.player.gravity;
    
    // Terminal velocity
    if (this.player.vy > 8) this.player.vy = 8;
    if (this.player.vy < -8) this.player.vy = -8;
    
    this.player.y += this.player.vy;

    // Move cave
    for (let i = 0; i < this.cave.length; i++) {
      this.cave[i].x -= this.speed;
    }
    
    // Generate new cave segments
    if (this.cave[0].x < -20) {
      this.cave.shift();
      let last = this.cave[this.cave.length - 1];
      
      // Random walk the cave center
      let center = (last.top + last.bottom) / 2;
      center += (Math.random() - 0.5) * 40;
      
      // Shrink gap over time
      this.gapSize = Math.max(150, 300 - this.distance / 50);
      
      if (center - this.gapSize/2 < 10) center = 10 + this.gapSize/2;
      if (center + this.gapSize/2 > this.canvas.height - 10) center = this.canvas.height - 10 - this.gapSize/2;
      
      this.cave.push({
        x: last.x + 20,
        top: center - this.gapSize/2,
        bottom: center + this.gapSize/2
      });
    }

    // Spawn obstacles
    if (this.frame % 100 === 0 && this.distance > 500) {
      this.obstacles.push({
        x: this.canvas.width,
        y: this.canvas.height/2 + (Math.random() - 0.5) * 100,
        width: 20,
        height: 60 + Math.random() * 40
      });
    }

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.speed;
      if (this.obstacles[i].x + this.obstacles[i].width < 0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Collisions
    // Cave
    let playerCenter = this.player.x + this.player.width/2;
    for (let i = 0; i < this.cave.length - 1; i++) {
      if (playerCenter >= this.cave[i].x && playerCenter <= this.cave[i+1].x) {
        if (this.player.y < this.cave[i].top || this.player.y + this.player.height > this.cave[i].bottom) {
          this.gameOver();
          return;
        }
      }
    }
    
    // Obstacles
    for (let obs of this.obstacles) {
      if (this.rectIntersect(this.player, obs)) {
        this.gameOver();
        return;
      }
    }
  }

  rectIntersect(r1, r2) {
    return !(
      r2.x > r1.x + r1.width || 
      r2.x + r2.width < r1.x || 
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  draw() {
    this.ctx.fillStyle = '#050a15';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Cave bounds
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    for (let c of this.cave) this.ctx.lineTo(c.x, c.top);
    this.ctx.lineTo(this.canvas.width, 0);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    for (let c of this.cave) this.ctx.lineTo(c.x, c.bottom);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.fill();

    // Draw Obstacles
    this.ctx.fillStyle = '#ff0055';
    for (let obs of this.obstacles) {
      this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    // Draw Copter
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    // Rotor blade
    this.ctx.fillStyle = '#fff';
    let rotorWidth = this.isThrusting ? (this.frame % 4 < 2 ? 30 : 10) : 30;
    this.ctx.fillRect(this.player.x + this.player.width/2 - rotorWidth/2, this.player.y - 4, rotorWidth, 2);
    // Tail
    this.ctx.fillRect(this.player.x - 10, this.player.y + 2, 10, 4);
    let tailRotor = this.isThrusting ? (this.frame % 4 < 2 ? 8 : 2) : 8;
    this.ctx.fillRect(this.player.x - 12, this.player.y + 4 - tailRotor/2, 2, tailRotor);
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'UP') {
      this.isThrusting = true;
      setTimeout(() => this.isThrusting = false, 150);
    }
  }

  handlePointerDown = (e) => {
    // Only handle if clicking inside arena
    if (e.target.id === 'game-canvas' || e.target.closest('.mobile-dpad')) {
      this.isThrusting = true;
      if (window.sound && this.frame % 10 === 0) window.sound.playBeep(100, 'sawtooth', 0.1);
    }
  };

  handlePointerUp = (e) => {
    this.isThrusting = false;
  };

  handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
      this.isThrusting = true;
    }
  };

  handleKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
      this.isThrusting = false;
    }
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('pointerdown', this.handlePointerDown);
    document.addEventListener('pointerup', this.handlePointerUp);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('pointerdown', this.handlePointerDown);
    document.removeEventListener('pointerup', this.handlePointerUp);
  }
}

window.CopterGame = CopterGame;
