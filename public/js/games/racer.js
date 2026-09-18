/**
 * Cyber Highway Racer Game
 */
class RacerGame {
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
    this.distance = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Road lanes (3 lanes)
    this.lanes = [80, 180, 280];
    this.currentLane = 1;

    // Player Car
    this.playerWidth = 36;
    this.playerHeight = 62;
    this.playerX = this.lanes[this.currentLane] - this.playerWidth / 2;
    this.playerY = this.canvas.height - 90;
    this.targetX = this.playerX;
    this.roadSpeed = 5;

    // Road markings
    this.roadOffset = 0;

    // Traffic Cars
    this.traffic = [];
    this.trafficTimer = 0;
    this.trafficColors = ['#f43f5e', '#a855f7', '#eab308', '#ec4899'];

    // Collectible Nitro Canisters
    this.items = [];
    this.itemTimer = 0;
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
    this.distance++;
    if (this.distance % 5 === 0) {
      this.score += 1;
      this.onScoreUpdate(this.score);
    }

    // Gradually speed up
    if (this.roadSpeed < 10.5 && this.distance % 200 === 0) {
      this.roadSpeed += 0.3;
    }

    // Scroll road
    this.roadOffset = (this.roadOffset + this.roadSpeed) % 40;

    // Smooth horizontal steer
    this.playerX += (this.targetX - this.playerX) * 0.25;

    // Spawn traffic
    this.trafficTimer++;
    const spawnRate = Math.max(45, 90 - Math.floor(this.roadSpeed * 4));
    if (this.trafficTimer > spawnRate) {
      this.trafficTimer = 0;
      const laneIdx = Math.floor(Math.random() * this.lanes.length);
      const speed = this.roadSpeed * (0.4 + Math.random() * 0.3);
      this.traffic.push({
        x: this.lanes[laneIdx] - 18,
        y: -70,
        width: 36,
        height: 60,
        speed,
        color: this.trafficColors[Math.floor(Math.random() * this.trafficColors.length)],
        passed: false,
      });
    }

    // Spawn Nitro Canisters
    this.itemTimer++;
    if (this.itemTimer > 180 && Math.random() < 0.4) {
      this.itemTimer = 0;
      const laneIdx = Math.floor(Math.random() * this.lanes.length);
      this.items.push({
        x: this.lanes[laneIdx],
        y: -30,
        radius: 10,
      });
    }

    // Update traffic
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.y += this.roadSpeed - car.speed;

      // Close call near-miss detection
      if (!car.passed && car.y > this.playerY && car.y < this.playerY + this.playerHeight) {
        if (Math.abs(car.x - this.playerX) < 55) {
          car.passed = true;
          this.score += 25;
          window.sound?.playScore();
          this.onScoreUpdate(this.score);
        }
      }

      // Collision Check
      if (
        this.playerX < car.x + car.width - 6 &&
        this.playerX + this.playerWidth - 6 > car.x &&
        this.playerY < car.y + car.height - 6 &&
        this.playerY + this.playerHeight - 6 > car.y
      ) {
        this.endGame();
        return;
      }

      // Despawn off-screen
      if (car.y > this.canvas.height + 80) {
        this.traffic.splice(i, 1);
      }
    }

    // Update Nitro Canisters
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += this.roadSpeed;

      // Pickup collision
      const dist = Math.hypot(this.playerX + this.playerWidth / 2 - item.x, this.playerY + this.playerHeight / 2 - item.y);
      if (dist < 28) {
        this.score += 75;
        window.sound?.playEat();
        this.onScoreUpdate(this.score);
        this.items.splice(i, 1);
        continue;
      }

      if (item.y > this.canvas.height + 40) {
        this.items.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    // Asphalt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Road borders
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fillRect(20, 0, 4, this.canvas.height);
    ctx.fillRect(this.canvas.width - 24, 0, 4, this.canvas.height);

    // Dashed Lane Dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -this.roadOffset;

    ctx.beginPath();
    ctx.moveTo(130, 0);
    ctx.lineTo(130, this.canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(230, 0);
    ctx.lineTo(230, this.canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Draw Nitro Canisters
    for (let it of this.items) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('N₂O', it.x, it.y + 3);
    }

    // Draw Traffic Cars
    for (let car of this.traffic) {
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(car.x, car.y, car.width, car.height, 8);
      ctx.fill();

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(car.x + 4, car.y + car.height - 5, 6, 3);
      ctx.fillRect(car.x + car.width - 10, car.y + car.height - 5, 6, 3);

      // Windshield
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(car.x + 5, car.y + 16, car.width - 10, 14);
    }

    // Draw Player Sports Car (Cyan)
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(this.playerX, this.playerY, this.playerWidth, this.playerHeight, 8);
    ctx.fill();

    // Headlights (Twin white glow)
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 12;
    ctx.fillRect(this.playerX + 5, this.playerY + 2, 7, 4);
    ctx.fillRect(this.playerX + this.playerWidth - 12, this.playerY + 2, 7, 4);

    // Windshield & Roof
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(this.playerX + 5, this.playerY + 20, this.playerWidth - 10, 18);
    ctx.fillStyle = '#164e63';
    ctx.fillRect(this.playerX + 7, this.playerY + 22, this.playerWidth - 14, 14);

    // Speed HUD
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(`SPEED: ${Math.round(this.roadSpeed * 15)} MPH`, 28, 26);
  }

  setLane(laneIdx) {
    if (!this.isRunning || this.isPaused) return;
    this.currentLane = Math.max(0, Math.min(this.lanes.length - 1, laneIdx));
    this.targetX = this.lanes[this.currentLane] - this.playerWidth / 2;
    window.sound?.playClick();
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.setLane(this.currentLane - 1);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.setLane(this.currentLane + 1);
      }
    };

    // Tap/Click on lane to steer
    this.canvasClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const clickX = (e.clientX - rect.left) * scaleX;
      if (clickX < this.canvas.width / 3) {
        this.setLane(0);
      } else if (clickX > (this.canvas.width * 2) / 3) {
        this.setLane(2);
      } else {
        this.setLane(1);
      }
    };

    window.addEventListener('keydown', this.keyDown);
    this.canvas.addEventListener('pointerdown', this.canvasClick);
  }

  handleDirection(dir) {
    if (dir === 'LEFT') this.setLane(this.currentLane - 1);
    if (dir === 'RIGHT') this.setLane(this.currentLane + 1);
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.sound?.playGameOver();
    this.onGameOver(this.score, { distance: this.distance, speed: Math.round(this.roadSpeed * 15) });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.canvasClick);
    }
  }
}

window.RacerGame = RacerGame;
