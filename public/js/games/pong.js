/**
 * Neon Pong Game
 */
class PongGame {
  constructor(canvas, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.canvas.width = 460;
    this.canvas.height = 360;

    this.reset();
  }

  reset() {
    this.score = 0;
    this.playerScore = 0;
    this.aiScore = 0;
    this.winningScore = 5;
    this.rallyCount = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.animationId = null;

    // Paddles
    this.paddleWidth = 10;
    this.paddleHeight = 65;
    this.playerY = (this.canvas.height - this.paddleHeight) / 2;
    this.aiY = (this.canvas.height - this.paddleHeight) / 2;
    this.paddleSpeed = 6;
    this.aiSpeed = 4.2;

    this.upPressed = false;
    this.downPressed = false;

    // Ball
    this.ballRadius = 6;
    this.resetBall(1);
  }

  resetBall(direction = 1) {
    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;
    this.ballSpeed = 4.5;
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8; // -22.5 to +22.5 deg
    this.ballDX = direction * this.ballSpeed * Math.cos(angle);
    this.ballDY = this.ballSpeed * Math.sin(angle);
    this.rallyCount = 0;
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
    // Move Player Paddle
    if (this.upPressed && this.playerY > 10) {
      this.playerY -= this.paddleSpeed;
    }
    if (this.downPressed && this.playerY < this.canvas.height - this.paddleHeight - 10) {
      this.playerY += this.paddleSpeed;
    }

    // AI Paddle Tracking
    const aiTarget = this.ballY - this.paddleHeight / 2;
    if (this.aiY < aiTarget - 6) {
      this.aiY += Math.min(this.aiSpeed, aiTarget - this.aiY);
    } else if (this.aiY > aiTarget + 6) {
      this.aiY -= Math.min(this.aiSpeed, this.aiY - aiTarget);
    }
    this.aiY = Math.max(10, Math.min(this.canvas.height - this.paddleHeight - 10, this.aiY));

    // Move Ball
    this.ballX += this.ballDX;
    this.ballY += this.ballDY;

    // Wall Bounces (Top & Bottom)
    if (this.ballY - this.ballRadius < 0 || this.ballY + this.ballRadius > this.canvas.height) {
      this.ballDY = -this.ballDY;
      window.sound?.playHit();
    }

    // Player Paddle Collision (Left)
    const playerX = 20;
    if (
      this.ballX - this.ballRadius <= playerX + this.paddleWidth &&
      this.ballX + this.ballRadius >= playerX &&
      this.ballY >= this.playerY &&
      this.ballY <= this.playerY + this.paddleHeight
    ) {
      this.ballDX = Math.abs(this.ballDX) * 1.05; // Speed up
      // Angle reflection based on hit point
      const deltaY = this.ballY - (this.playerY + this.paddleHeight / 2);
      this.ballDY = deltaY * 0.18;

      this.rallyCount++;
      const rallyPoints = 10 * this.rallyCount;
      this.score += rallyPoints;
      window.sound?.playJump();
      this.onScoreUpdate(this.score);
    }

    // AI Paddle Collision (Right)
    const aiX = this.canvas.width - 20 - this.paddleWidth;
    if (
      this.ballX + this.ballRadius >= aiX &&
      this.ballX - this.ballRadius <= aiX + this.paddleWidth &&
      this.ballY >= this.aiY &&
      this.ballY <= this.aiY + this.paddleHeight
    ) {
      this.ballDX = -Math.abs(this.ballDX) * 1.05;
      const deltaY = this.ballY - (this.aiY + this.paddleHeight / 2);
      this.ballDY = deltaY * 0.18;
      window.sound?.playHit();
    }

    // Point Scored by Player
    if (this.ballX > this.canvas.width) {
      this.playerScore++;
      this.score += 150;
      window.sound?.playScore();
      this.onScoreUpdate(this.score);

      if (this.playerScore >= this.winningScore) {
        this.endGame(true);
        return;
      }
      this.resetBall(-1);
    }

    // Point Scored by AI
    if (this.ballX < 0) {
      this.aiScore++;
      window.sound?.playHit();

      if (this.aiScore >= this.winningScore) {
        this.endGame(false);
        return;
      }
      this.resetBall(1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Center Dashed Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 2, 0);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores in Center Court
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.textAlign = 'right';
    ctx.fillText(this.playerScore, this.canvas.width / 2 - 25, 55);

    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.textAlign = 'left';
    ctx.fillText(this.aiScore, this.canvas.width / 2 + 25, 55);

    // Player Paddle (Left - Cyan)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(20, this.playerY, this.paddleWidth, this.paddleHeight, 4);
    ctx.fill();

    // AI Paddle (Right - Rose)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(this.canvas.width - 20 - this.paddleWidth, this.aiY, this.paddleWidth, this.paddleHeight, 4);
    ctx.fill();

    // Ball (Emerald)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Rally display
    if (this.rallyCount > 1) {
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(`RALLY: ${this.rallyCount}x`, this.canvas.width / 2, this.canvas.height - 15);
    }
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.upPressed = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.downPressed = true;
    };
    this.keyUp = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.upPressed = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.downPressed = false;
    };

    this.mouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      this.playerY = Math.max(10, Math.min(this.canvas.height - this.paddleHeight - 10, relativeY - this.paddleHeight / 2));
    };

    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    this.canvas.addEventListener('mousemove', this.mouseMove);
    this.canvas.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      const rect = this.canvas.getBoundingClientRect();
      const relativeY = e.touches[0].clientY - rect.top;
      this.playerY = Math.max(10, Math.min(this.canvas.height - this.paddleHeight - 10, relativeY - this.paddleHeight / 2));
    }, { passive: true });
  }

  handleDirection(dir) {
    if (dir === 'UP') this.playerY = Math.max(10, this.playerY - 25);
    if (dir === 'DOWN') this.playerY = Math.min(this.canvas.height - this.paddleHeight - 10, this.playerY + 25);
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame(playerWon) {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    if (playerWon) {
      this.score += 500;
      this.onScoreUpdate(this.score);
      window.sound?.playWin();
    } else {
      window.sound?.playGameOver();
    }
    this.onGameOver(this.score, { won: playerWon, playerPts: this.playerScore, aiPts: this.aiScore });
  }

  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
  }
}

window.PongGame = PongGame;
