/**
 * Asteroids Game
 */
class AsteroidsGame {
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
    this.ship = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      a: 90 / 180 * Math.PI, // angle
      r: 10, // radius
      blinkNum: Math.ceil(10 * 0.1),
      blinkTime: Math.ceil(0.1 * 30),
      canShoot: true,
      lasers: [],
      rot: 0,
      thrusting: false,
      thrust: { x: 0, y: 0 }
    };
    this.asteroids = [];
    this.createAsteroidBelt();
    
    this.level = 0;
    this.lives = 3;
    this.score = 0;
    this.scoreHigh = 0;
    
    this.isRunning = false;
    this.isPaused = false;
  }

  createAsteroidBelt() {
    this.asteroids = [];
    let x, y;
    for (let i = 0; i < 3 + this.level; i++) {
      do {
        x = Math.floor(Math.random() * this.canvas.width);
        y = Math.floor(Math.random() * this.canvas.height);
      } while (this.distBetweenPoints(this.ship.x, this.ship.y, x, y) < 50 * 2 + this.ship.r);
      this.asteroids.push(this.newAsteroid(x, y, Math.ceil(50 / 2)));
    }
  }

  distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  newAsteroid(x, y, r) {
    let lvlMult = 1 + .1 * this.level;
    let roff = Math.random() * Math.PI * 2;
    return {
      x: x,
      y: y,
      xv: Math.random() * 50 * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
      yv: Math.random() * 50 * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
      r: r,
      a: roff,
      vert: Math.floor(Math.random() * (10 - 5 + 1) + 5),
      offs: []
    };
  }

  shootLaser() {
    if (this.ship.canShoot && this.ship.lasers.length < 10) {
      this.ship.lasers.push({
        x: this.ship.x + 4 / 3 * this.ship.r * Math.cos(this.ship.a),
        y: this.ship.y - 4 / 3 * this.ship.r * Math.sin(this.ship.a),
        xv: 500 * Math.cos(this.ship.a) / 30,
        yv: -500 * Math.sin(this.ship.a) / 30,
        dist: 0,
        explodeTime: 0
      });
      if (window.sound) window.sound.playLaser();
    }
    this.ship.canShoot = false;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.bindEvents();
    this.loop();
  }

  pause() {
    if (!this.isRunning) return false;
    this.isPaused = !this.isPaused;
    if (!this.isPaused) this.loop();
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

  loop = () => {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.draw();

    requestAnimationFrame(this.loop);
  };

  update() {
    // Thrust
    if (this.keys['ArrowUp'] || this.keys['w']) {
      this.ship.thrusting = true;
      this.ship.thrust.x += 5 * Math.cos(this.ship.a) / 30;
      this.ship.thrust.y -= 5 * Math.sin(this.ship.a) / 30;
    } else {
      this.ship.thrusting = false;
      this.ship.thrust.x -= 0.7 * this.ship.thrust.x / 30;
      this.ship.thrust.y -= 0.7 * this.ship.thrust.y / 30;
    }

    // Rotate
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.ship.rot = 360 / 180 * Math.PI / 30;
    } else if (this.keys['ArrowRight'] || this.keys['d']) {
      this.ship.rot = -360 / 180 * Math.PI / 30;
    } else {
      this.ship.rot = 0;
    }

    this.ship.a += this.ship.rot;
    this.ship.x += this.ship.thrust.x;
    this.ship.y += this.ship.thrust.y;

    // Screen wrap
    if (this.ship.x < 0 - this.ship.r) this.ship.x = this.canvas.width + this.ship.r;
    else if (this.ship.x > this.canvas.width + this.ship.r) this.ship.x = 0 - this.ship.r;
    if (this.ship.y < 0 - this.ship.r) this.ship.y = this.canvas.height + this.ship.r;
    else if (this.ship.y > this.canvas.height + this.ship.r) this.ship.y = 0 - this.ship.r;

    // Move lasers
    for (let i = this.ship.lasers.length - 1; i >= 0; i--) {
      this.ship.lasers[i].x += this.ship.lasers[i].xv;
      this.ship.lasers[i].y += this.ship.lasers[i].yv;

      this.ship.lasers[i].dist += Math.sqrt(Math.pow(this.ship.lasers[i].xv, 2) + Math.pow(this.ship.lasers[i].yv, 2));

      if (this.ship.lasers[i].dist > this.canvas.width * 0.6) {
        this.ship.lasers.splice(i, 1);
        continue;
      }
    }

    // Move asteroids
    let a, x, y, r, xv, yv;
    for (let i = 0; i < this.asteroids.length; i++) {
      a = this.asteroids[i];
      a.x += a.xv;
      a.y += a.yv;

      if (a.x < 0 - a.r) a.x = this.canvas.width + a.r;
      else if (a.x > this.canvas.width + a.r) a.x = 0 - a.r;
      if (a.y < 0 - a.r) a.y = this.canvas.height + a.r;
      else if (a.y > this.canvas.height + a.r) a.y = 0 - a.r;
    }

    // Detect laser hits on asteroids
    let ax, ay, ar, lx, ly;
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      ax = this.asteroids[i].x;
      ay = this.asteroids[i].y;
      ar = this.asteroids[i].r;

      for (let j = this.ship.lasers.length - 1; j >= 0; j--) {
        lx = this.ship.lasers[j].x;
        ly = this.ship.lasers[j].y;

        if (this.distBetweenPoints(ax, ay, lx, ly) < ar) {
          this.ship.lasers.splice(j, 1);
          this.destroyAsteroid(i);
          break;
        }
      }
    }

    // Detect asteroid hits on ship
    if (this.ship.blinkNum == 0) {
      for (let i = 0; i < this.asteroids.length; i++) {
        if (this.distBetweenPoints(this.ship.x, this.ship.y, this.asteroids[i].x, this.asteroids[i].y) < this.ship.r + this.asteroids[i].r) {
          this.destroyAsteroid(i);
          this.shipHit();
          break;
        }
      }
    }
  }

  destroyAsteroid(index) {
    let x = this.asteroids[index].x;
    let y = this.asteroids[index].y;
    let r = this.asteroids[index].r;

    if (r == Math.ceil(50 / 2)) {
      this.asteroids.push(this.newAsteroid(x, y, Math.ceil(50 / 4)));
      this.asteroids.push(this.newAsteroid(x, y, Math.ceil(50 / 4)));
      this.score += 20;
    } else if (r == Math.ceil(50 / 4)) {
      this.asteroids.push(this.newAsteroid(x, y, Math.ceil(50 / 8)));
      this.asteroids.push(this.newAsteroid(x, y, Math.ceil(50 / 8)));
      this.score += 50;
    } else {
      this.score += 100;
    }

    this.asteroids.splice(index, 1);
    this.onScoreUpdate(this.score);
    if (window.sound) window.sound.playBeep(200, 'square', 0.1);

    if (this.asteroids.length == 0) {
      this.level++;
      this.createAsteroidBelt();
    }
  }

  shipHit() {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.ship.x = this.canvas.width / 2;
      this.ship.y = this.canvas.height / 2;
      this.ship.a = 90 / 180 * Math.PI;
      this.ship.thrust = { x: 0, y: 0 };
      if (window.sound) window.sound.playExplosion();
    }
  }

  draw() {
    this.ctx.fillStyle = '#050a15';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ship
    if (this.lives > 0) {
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.ship.x + 4 / 3 * this.ship.r * Math.cos(this.ship.a),
        this.ship.y - 4 / 3 * this.ship.r * Math.sin(this.ship.a)
      );
      this.ctx.lineTo(
        this.ship.x - this.ship.r * (2 / 3 * Math.cos(this.ship.a) + Math.sin(this.ship.a)),
        this.ship.y + this.ship.r * (2 / 3 * Math.sin(this.ship.a) - Math.cos(this.ship.a))
      );
      this.ctx.lineTo(
        this.ship.x - this.ship.r * (2 / 3 * Math.cos(this.ship.a) - Math.sin(this.ship.a)),
        this.ship.y + this.ship.r * (2 / 3 * Math.sin(this.ship.a) + Math.cos(this.ship.a))
      );
      this.ctx.closePath();
      this.ctx.stroke();

      // Thrust fire
      if (this.ship.thrusting) {
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.moveTo(
          this.ship.x - this.ship.r * (2 / 3 * Math.cos(this.ship.a) + 0.5 * Math.sin(this.ship.a)),
          this.ship.y + this.ship.r * (2 / 3 * Math.sin(this.ship.a) - 0.5 * Math.cos(this.ship.a))
        );
        this.ctx.lineTo(
          this.ship.x - this.ship.r * 5 / 3 * Math.cos(this.ship.a),
          this.ship.y + this.ship.r * 5 / 3 * Math.sin(this.ship.a)
        );
        this.ctx.lineTo(
          this.ship.x - this.ship.r * (2 / 3 * Math.cos(this.ship.a) - 0.5 * Math.sin(this.ship.a)),
          this.ship.y + this.ship.r * (2 / 3 * Math.sin(this.ship.a) + 0.5 * Math.cos(this.ship.a))
        );
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
    }

    // Draw lasers
    this.ctx.fillStyle = '#ff00ff';
    for (let i = 0; i < this.ship.lasers.length; i++) {
      this.ctx.beginPath();
      this.ctx.arc(this.ship.lasers[i].x, this.ship.lasers[i].y, 2, 0, Math.PI * 2, false);
      this.ctx.fill();
    }

    // Draw asteroids
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    let a, x, y, r, vert;
    for (let i = 0; i < this.asteroids.length; i++) {
      a = this.asteroids[i];
      x = a.x;
      y = a.y;
      r = a.r;
      vert = a.vert;

      this.ctx.beginPath();
      for (let j = 0; j < vert; j++) {
        this.ctx.lineTo(
          x + r * Math.cos(a.a + j * Math.PI * 2 / vert),
          y + r * Math.sin(a.a + j * Math.PI * 2 / vert)
        );
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }

    // Draw Lives
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px "Press Start 2P"';
    this.ctx.fillText(`LIVES: ${this.lives}`, 20, 30);
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'LEFT') {
      this.keys['ArrowLeft'] = true;
      setTimeout(() => this.keys['ArrowLeft'] = false, 100);
    } else if (dir === 'RIGHT') {
      this.keys['ArrowRight'] = true;
      setTimeout(() => this.keys['ArrowRight'] = false, 100);
    } else if (dir === 'UP') {
      this.keys['ArrowUp'] = true;
      setTimeout(() => this.keys['ArrowUp'] = false, 100);
    }
  }

  handleKeyDown = (e) => {
    this.keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Spacebar') {
      this.shootLaser();
    }
  };

  handleKeyUp = (e) => {
    this.keys[e.key] = false;
    if (e.key === ' ' || e.key === 'Spacebar') {
      this.ship.canShoot = true;
    }
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

window.AsteroidsGame = AsteroidsGame;
