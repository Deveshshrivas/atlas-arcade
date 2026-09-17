/**
 * Cyber Frogger Game
 */
class FroggerGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.grid = 40;
    this.canvas.width = this.grid * 13;
    this.canvas.height = this.grid * 14;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    
    this.frogger = {
      x: this.grid * 6,
      y: this.grid * 13,
      width: this.grid,
      height: this.grid,
      color: '#00ff00'
    };

    this.cars = [];
    this.logs = [];
    this.createObstacles();

    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
  }

  createObstacles() {
    this.cars = [];
    this.logs = [];
    let speedMult = 1 + (this.level * 0.2);

    // Cars (bottom half)
    this.createLane(12, 1, 2, 2, '#ff00ff', 'car');
    this.createLane(11, -1.5, 3, 2, '#00ffff', 'car');
    this.createLane(10, 1.2, 2, 3, '#ff0000', 'car');
    this.createLane(9, -2, 1, 2, '#ffff00', 'car');
    this.createLane(8, 2.5, 2, 1, '#ff8800', 'car');

    // River (top half) - Logs
    this.createLane(6, 1.5, 3, 3, '#8b4513', 'log');
    this.createLane(5, -2, 2, 4, '#8b4513', 'log');
    this.createLane(4, 2.5, 3, 2, '#8b4513', 'log');
    this.createLane(3, -1.2, 2, 5, '#8b4513', 'log');
    this.createLane(2, 3, 2, 3, '#8b4513', 'log');
  }

  createLane(row, speed, count, length, color, type) {
    const spacing = this.canvas.width / count;
    for (let i = 0; i < count; i++) {
      let obj = {
        x: i * spacing,
        y: row * this.grid,
        width: this.grid * length,
        height: this.grid,
        speed: speed,
        color: color,
        type: type
      };
      if (type === 'car') this.cars.push(obj);
      else this.logs.push(obj);
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

    // Fixed timestep for simple physics
    this.update();
    this.draw();

    requestAnimationFrame((time) => this.loop(time));
  }

  update() {
    // Update cars
    this.cars.forEach(car => {
      car.x += car.speed;
      if (car.speed > 0 && car.x > this.canvas.width) car.x = -car.width;
      else if (car.speed < 0 && car.x < -car.width) car.x = this.canvas.width;
    });

    // Update logs
    this.logs.forEach(log => {
      log.x += log.speed;
      if (log.speed > 0 && log.x > this.canvas.width) log.x = -log.width;
      else if (log.speed < 0 && log.x < -log.width) log.x = this.canvas.width;
    });

    // Check collisions
    let dead = false;
    
    // Car collision
    if (this.frogger.y >= 8 * this.grid && this.frogger.y <= 12 * this.grid) {
      this.cars.forEach(car => {
        if (this.rectIntersect(this.frogger, car)) {
          dead = true;
        }
      });
    }

    // River collision (needs to be ON a log)
    let onLog = false;
    if (this.frogger.y >= 2 * this.grid && this.frogger.y <= 6 * this.grid) {
      this.logs.forEach(log => {
        if (this.rectIntersect(this.frogger, log)) {
          onLog = true;
          this.frogger.x += log.speed; // Move with log
        }
      });
      if (!onLog) dead = true; // Drowned
    }

    // Check bounds
    if (this.frogger.x < 0 || this.frogger.x + this.frogger.width > this.canvas.width) {
      dead = true;
    }

    if (dead) {
      this.die();
    }

    // Win condition (reached top)
    if (this.frogger.y < 2 * this.grid) {
      this.win();
    }
  }

  rectIntersect(r1, r2) {
    // Make hitbox slightly smaller for fairness
    let shrink = 8;
    return !(
      r2.x > r1.x + r1.width - shrink || 
      r2.x + r2.width < r1.x + shrink || 
      r2.y > r1.y + r1.height - shrink ||
      r2.y + r2.height < r1.y + shrink
    );
  }

  die() {
    if (window.sound) window.sound.playExplosion();
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.resetFrog();
    }
  }

  win() {
    if (window.sound) window.sound.playPowerup();
    this.score += 50 + (this.level * 10);
    this.level++;
    this.onScoreUpdate(this.score);
    this.createObstacles();
    this.resetFrog();
  }

  resetFrog() {
    this.frogger.x = this.grid * 6;
    this.frogger.y = this.grid * 13;
  }

  draw() {
    // Background
    this.ctx.fillStyle = '#050a15'; // Start/End
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // River
    this.ctx.fillStyle = '#000033';
    this.ctx.fillRect(0, 2 * this.grid, this.canvas.width, 5 * this.grid);
    
    // Road
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 8 * this.grid, this.canvas.width, 5 * this.grid);
    
    // Safe zones
    this.ctx.fillStyle = '#003300';
    this.ctx.fillRect(0, 7 * this.grid, this.canvas.width, this.grid);
    this.ctx.fillRect(0, 13 * this.grid, this.canvas.width, this.grid);
    this.ctx.fillRect(0, 1 * this.grid, this.canvas.width, this.grid);

    // Draw logs
    this.logs.forEach(log => {
      this.ctx.fillStyle = log.color;
      this.ctx.fillRect(log.x, log.y, log.width, log.height);
      this.ctx.strokeStyle = '#5c3a21';
      this.ctx.strokeRect(log.x, log.y, log.width, log.height);
    });

    // Draw cars
    this.cars.forEach(car => {
      this.ctx.fillStyle = car.color;
      this.ctx.fillRect(car.x, car.y, car.width, car.height);
      this.ctx.strokeStyle = '#fff';
      this.ctx.strokeRect(car.x, car.y, car.width, car.height);
      // headlights
      this.ctx.fillStyle = '#fff';
      if (car.speed > 0) {
        this.ctx.fillRect(car.x + car.width - 5, car.y + 5, 5, 5);
        this.ctx.fillRect(car.x + car.width - 5, car.y + car.height - 10, 5, 5);
      } else {
        this.ctx.fillRect(car.x, car.y + 5, 5, 5);
        this.ctx.fillRect(car.x, car.y + car.height - 10, 5, 5);
      }
    });

    // Draw frog
    this.ctx.fillStyle = this.frogger.color;
    this.ctx.beginPath();
    this.ctx.arc(this.frogger.x + this.grid/2, this.frogger.y + this.grid/2, this.grid/2 - 2, 0, Math.PI*2);
    this.ctx.fill();

    // Draw UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px "Press Start 2P"';
    this.ctx.fillText(`LVL:${this.level}`, 10, 30);
    this.ctx.fillText(`LIVES:${this.lives}`, this.canvas.width - 150, 30);
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'LEFT' && this.frogger.x > 0) this.frogger.x -= this.grid;
    else if (dir === 'RIGHT' && this.frogger.x < this.canvas.width - this.grid) this.frogger.x += this.grid;
    else if (dir === 'UP' && this.frogger.y > 0) {
      this.frogger.y -= this.grid;
      this.score += 5; // Points for moving up
      this.onScoreUpdate(this.score);
    }
    else if (dir === 'DOWN' && this.frogger.y < this.canvas.height - this.grid) this.frogger.y += this.grid;
    
    if (window.sound) window.sound.playBeep(400, 'square', 0.05);
  }

  handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': this.handleDirection('LEFT'); break;
      case 'ArrowRight': case 'd': case 'D': this.handleDirection('RIGHT'); break;
      case 'ArrowUp': case 'w': case 'W': this.handleDirection('UP'); break;
      case 'ArrowDown': case 's': case 'S': this.handleDirection('DOWN'); break;
    }
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

window.FroggerGame = FroggerGame;
