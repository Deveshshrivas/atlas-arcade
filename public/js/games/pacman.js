/**
 * Neon Maze (Pacman clone) Game
 */
class PacmanGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.tileSize = 20;
    this.cols = 21;
    this.rows = 21;
    this.canvas.width = this.cols * this.tileSize;
    this.canvas.height = this.rows * this.tileSize;

    // 0 = empty, 1 = wall, 2 = pellet
    this.mapTemplate = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
      [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
      [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1,1],
      [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
      [1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
      [1,2,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,2,1],
      [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
      [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
      [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    this.reset();
  }

  reset() {
    this.map = this.mapTemplate.map(row => [...row]);
    this.score = 0;
    this.pelletsCount = this.map.flat().filter(c => c === 2).length;

    this.player = {
      x: 10,
      y: 15,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 }
    };

    this.ghosts = [
      { x: 9, y: 9, dir: { x: 1, y: 0 }, color: '#ff0000' },
      { x: 10, y: 9, dir: { x: -1, y: 0 }, color: '#ffb8ff' },
      { x: 11, y: 9, dir: { x: 0, y: 1 }, color: '#00ffff' },
      { x: 10, y: 8, dir: { x: 0, y: -1 }, color: '#ffb852' }
    ];

    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.moveTimer = 0;
    this.moveInterval = 150; // ms per tile
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

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.moveTimer += deltaTime;
    if (this.moveTimer > this.moveInterval) {
      this.moveTimer = 0;
      this.update();
    }

    this.draw();
    requestAnimationFrame((time) => this.loop(time));
  }

  update() {
    // Try to change direction
    if (this.canMove(this.player.x + this.player.nextDir.x, this.player.y + this.player.nextDir.y)) {
      this.player.dir = { ...this.player.nextDir };
    }

    // Move player
    if (this.canMove(this.player.x + this.player.dir.x, this.player.y + this.player.dir.y)) {
      this.player.x += this.player.dir.x;
      this.player.y += this.player.dir.y;
    }

    // Wrap around
    if (this.player.x < 0) this.player.x = this.cols - 1;
    if (this.player.x >= this.cols) this.player.x = 0;

    // Eat pellet
    if (this.map[this.player.y] && this.map[this.player.y][this.player.x] === 2) {
      this.map[this.player.y][this.player.x] = 0;
      this.score += 10;
      this.pelletsCount--;
      this.onScoreUpdate(this.score);
      if (window.sound) window.sound.playBeep(800, 'sine', 0.05);

      if (this.pelletsCount <= 0) {
        // Level clear
        this.reset();
        this.start();
        return;
      }
    }

    // Move ghosts
    this.ghosts.forEach(ghost => {
      const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      
      const validDirs = dirs.filter(d => 
        (d.x !== -ghost.dir.x || d.y !== -ghost.dir.y) && 
        this.canMove(ghost.x + d.x, ghost.y + d.y)
      );

      if (validDirs.length > 0) {
        // AI: try to move towards player 50% of the time, else random
        if (Math.random() < 0.5) {
           let bestDir = validDirs[0];
           let minDist = Infinity;
           validDirs.forEach(d => {
             let nx = ghost.x + d.x;
             let ny = ghost.y + d.y;
             let dist = Math.abs(nx - this.player.x) + Math.abs(ny - this.player.y);
             if (dist < minDist) {
               minDist = dist;
               bestDir = d;
             }
           });
           ghost.dir = bestDir;
        } else {
           ghost.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
      } else {
         // Dead end, turn around
         ghost.dir = { x: -ghost.dir.x, y: -ghost.dir.y };
      }

      ghost.x += ghost.dir.x;
      ghost.y += ghost.dir.y;

      if (ghost.x < 0) ghost.x = this.cols - 1;
      if (ghost.x >= this.cols) ghost.x = 0;

      // Collision
      if (ghost.x === this.player.x && ghost.y === this.player.y) {
        this.gameOver();
      }
    });
  }

  canMove(x, y) {
    if (x < 0 || x >= this.cols) return true; // allow wrap
    if (y < 0 || y >= this.rows) return false;
    return this.map[y][x] !== 1;
  }

  draw() {
    this.ctx.fillStyle = '#050a15';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.map[y][x] === 1) {
          this.ctx.fillStyle = '#0044ff';
          this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          this.ctx.strokeStyle = '#00ffff';
          this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        } else if (this.map[y][x] === 2) {
          this.ctx.fillStyle = '#ffff00';
          this.ctx.beginPath();
          this.ctx.arc(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // Draw player
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;
    
    // Rotate mouth based on dir
    let rotation = 0;
    if (this.player.dir.x === -1) rotation = Math.PI;
    else if (this.player.dir.y === -1) rotation = -Math.PI / 2;
    else if (this.player.dir.y === 1) rotation = Math.PI / 2;

    this.ctx.arc(
      this.player.x * this.tileSize + this.tileSize / 2,
      this.player.y * this.tileSize + this.tileSize / 2,
      this.tileSize / 2 - 2,
      startAngle + rotation,
      endAngle + rotation
    );
    this.ctx.lineTo(this.player.x * this.tileSize + this.tileSize / 2, this.player.y * this.tileSize + this.tileSize / 2);
    this.ctx.fill();

    // Draw ghosts
    this.ghosts.forEach(ghost => {
      this.ctx.fillStyle = ghost.color;
      this.ctx.beginPath();
      let gx = ghost.x * this.tileSize;
      let gy = ghost.y * this.tileSize;
      let r = this.tileSize / 2 - 2;
      this.ctx.arc(gx + this.tileSize / 2, gy + this.tileSize / 2, r, Math.PI, 0);
      this.ctx.lineTo(gx + this.tileSize - 2, gy + this.tileSize - 2);
      this.ctx.lineTo(gx + this.tileSize / 2, gy + this.tileSize / 2 + 2);
      this.ctx.lineTo(gx + 2, gy + this.tileSize - 2);
      this.ctx.fill();
    });
  }

  handleDirection(dir) {
    if (!this.isRunning || this.isPaused) return;
    if (dir === 'LEFT') this.player.nextDir = { x: -1, y: 0 };
    else if (dir === 'RIGHT') this.player.nextDir = { x: 1, y: 0 };
    else if (dir === 'UP') this.player.nextDir = { x: 0, y: -1 };
    else if (dir === 'DOWN') this.player.nextDir = { x: 0, y: 1 };
  }

  handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.handleDirection('LEFT');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.handleDirection('RIGHT');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.handleDirection('DOWN');
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.handleDirection('UP');
        break;
    }
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

window.PacmanGame = PacmanGame;
