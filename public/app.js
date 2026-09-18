/**
 * Atlas Arcade Portal - Main Application Coordinator
 */
class ArcadeApp {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null;
    this.user = null;
    this.personalBests = {
      snake: 0,
      breakout: 0,
      flappy: 0,
      2048: 0,
      memory: 0,
      tictactoe: 0,
      invaders: 0,
      pong: 0,
      racer: 0,
      jump: 0,
      minesweeper: 0,
      whack: 0,
      tetris: 0,
      asteroids: 0,
      pacman: 0,
      typing: 0,
      frogger: 0,
      simon: 0,
      platformer: 0,
      copter: 0,
    };

    this.activeGame = null;
    this.activeGameId = null;
    this.currentScore = 0;
    this.activeLeaderboardGame = 'snake';

    this.gameConfig = {
      snake: {
        name: 'Neon Snake',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Arrow Keys or WASD (or On-Screen D-Pad) to steer the snake',
        dpad: true,
        class: window.SnakeGame,
      },
      breakout: {
        name: 'Brick Breaker',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Move Mouse/Touch or Arrow Keys to position the paddle',
        dpad: false,
        class: window.BreakoutGame,
      },
      flappy: {
        name: 'Flappy Wings',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Press Spacebar, Up Arrow, or Tap Screen to flap',
        dpad: false,
        class: window.FlappyGame,
      },
      2048: {
        name: '2048 Puzzle',
        type: 'canvas',
        badge: 'Puzzle',
        hint: '🎮 Controls: Arrow Keys, WASD, or Swipe to slide matching tiles',
        dpad: true,
        class: window.Game2048,
      },
      memory: {
        name: 'Cyber Memory',
        type: 'dom',
        badge: 'Puzzle',
        hint: '🎮 Controls: Click or tap cards to find matching cyber pairs',
        dpad: false,
        class: window.MemoryGame,
      },
      tictactoe: {
        name: 'Tic-Tac-Toe Master',
        type: 'dom',
        badge: 'Classic',
        hint: '🎮 Controls: Click or tap on open grid squares to place your mark',
        dpad: false,
        class: window.TicTacToeGame,
      },
      invaders: {
        name: 'Galaxy Invaders',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Left & Right to steer, Spacebar / Up Arrow to fire laser cannons',
        dpad: true,
        class: window.InvadersGame,
      },
      pong: {
        name: 'Neon Pong',
        type: 'canvas',
        badge: 'Classic',
        hint: '🎮 Controls: Move Mouse/Touch or Up & Down Arrows to steer paddle',
        dpad: true,
        class: window.PongGame,
      },
      racer: {
        name: 'Highway Racer',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Left & Right Arrows (or tap lanes) to weave through traffic',
        dpad: true,
        class: window.RacerGame,
      },
      jump: {
        name: 'Sky Jumper',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Left & Right Arrows (or tap sides) to steer and climb platforms',
        dpad: true,
        class: window.JumpGame,
      },
      minesweeper: {
        name: 'Cyber Minesweeper',
        type: 'dom',
        badge: 'Puzzle',
        hint: '🎮 Controls: Click to reveal cells, Right-Click or Toggle Flag to mark mines',
        dpad: false,
        class: window.MinesweeperGame,
      },
      whack: {
        name: 'Whack-A-Cyberbug',
        type: 'dom',
        badge: 'Classic',
        hint: '🎮 Controls: Click or tap cyber bugs as they emerge to build combo multipliers',
        dpad: false,
        class: window.WhackGame,
      },
      tetris: {
        name: 'Cyber Tetris',
        type: 'canvas',
        badge: 'Puzzle',
        hint: '🎮 Controls: Arrow keys to move/rotate, Space to drop',
        dpad: true,
        class: window.TetrisGame,
      },
      asteroids: {
        name: 'Asteroids',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Left/Right to rotate, Up to thrust, Space to shoot',
        dpad: true,
        class: window.AsteroidsGame,
      },
      pacman: {
        name: 'Neon Maze',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Arrow keys to move through the maze',
        dpad: true,
        class: window.PacmanGame,
      },
      typing: {
        name: 'Cyber Typer',
        type: 'dom',
        badge: 'Puzzle',
        hint: '🎮 Controls: Type the words before they hit the bottom',
        dpad: false,
        class: window.TypingGame,
      },
      frogger: {
        name: 'Cyber Frogger',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Arrow keys to move',
        dpad: true,
        class: window.FroggerGame,
      },
      simon: {
        name: 'Neon Simon',
        type: 'dom',
        badge: 'Puzzle',
        hint: '🎮 Controls: Click the colors in the correct sequence',
        dpad: false,
        class: window.SimonGame,
      },
      platformer: {
        name: 'Space Platformer',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Left/Right to move, Up to jump',
        dpad: true,
        class: window.PlatformerGame,
      },
      copter: {
        name: 'Neon Copter',
        type: 'canvas',
        badge: 'Arcade',
        hint: '🎮 Controls: Hold Space/Up or Tap to ascend',
        dpad: true,
        class: window.CopterGame,
      }
    };

    this.initDOM();
    this.bindEvents();
    this.checkHealth();
    this.restoreSession();
  }

  initDOM() {
    // Views
    this.arcadeHub = document.getElementById('arcade-hub');
    this.gameArena = document.getElementById('game-arena');

    // Arena elements
    this.arenaTitle = document.getElementById('arena-game-title');
    this.arenaBadge = document.getElementById('arena-game-badge');
    this.currentScoreEl = document.getElementById('arena-current-score');
    this.bestScoreEl = document.getElementById('arena-best-score');
    this.controlsHint = document.getElementById('controls-hint');
    this.gameCanvas = document.getElementById('game-canvas');
    this.gameDomContainer = document.getElementById('game-dom-container');
    this.mobileDpad = document.getElementById('mobile-dpad');
    this.pauseBtn = document.getElementById('arena-pause-btn');

    // Modals
    this.gameoverModal = document.getElementById('gameover-modal');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.authModal = document.getElementById('auth-modal');

    // Nav elements
    this.authNavGuest = document.getElementById('auth-nav-guest');
    this.authNavUser = document.getElementById('auth-nav-user');
    this.navUserName = document.getElementById('nav-user-name');
    this.navUserInitials = document.getElementById('nav-user-initials');
    this.playerStatusBadge = document.getElementById('player-status-badge');
    this.globalSoundBtn = document.getElementById('global-sound-btn');

    // Toast
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toast-message');
  }

  showToast(msg, duration = 3000) {
    this.toastMessage.textContent = msg;
    this.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, duration);
  }

  // --- HEALTH & DATABASE STATUS ---
  async checkHealth() {
    const dbBadge = document.getElementById('db-status-badge');
    const dbText = document.getElementById('db-status-text');
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.database && data.database.connected) {
        dbBadge.className = 'db-badge connected';
        dbText.textContent = 'Atlas Live';
      } else {
        dbBadge.className = 'db-badge disconnected';
        dbText.textContent = 'Atlas Offline';
      }
    } catch (e) {
      dbBadge.className = 'db-badge disconnected';
      dbText.textContent = 'Offline';
    }
  }

  // --- AUTH & SESSION ---
  async restoreSession() {
    if (!this.token) {
      this.renderAuthState();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        this.renderAuthState();
        this.fetchPersonalBests();
      } else {
        this.logout();
      }
    } catch (e) {
      this.renderAuthState();
    }
  }

  renderAuthState() {
    if (this.user) {
      this.authNavGuest.classList.add('hidden');
      this.authNavUser.classList.remove('hidden');
      this.navUserName.textContent = this.user.username;
      this.navUserInitials.textContent = this.user.username.slice(0, 2).toUpperCase();
      this.playerStatusBadge.textContent = this.user.username;
    } else {
      this.authNavGuest.classList.remove('hidden');
      this.authNavUser.classList.add('hidden');
      this.playerStatusBadge.textContent = 'Guest';
    }
  }

  async fetchPersonalBests() {
    if (!this.token) return;
    try {
      const res = await fetch('/api/games/my-scores', {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        Object.keys(data.scores).forEach((gId) => {
          const score = data.scores[gId].bestScore || 0;
          this.personalBests[gId] = score;
          const el = document.getElementById(`best-${gId}`);
          if (el) el.textContent = score;
        });
      }
    } catch (e) {
      console.error('Failed to fetch personal bests:', e);
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    this.personalBests = { snake: 0, breakout: 0, flappy: 0, 2048: 0, memory: 0, tictactoe: 0 };
    Object.keys(this.personalBests).forEach((gId) => {
      const el = document.getElementById(`best-${gId}`);
      if (el) el.textContent = 0;
    });
    this.renderAuthState();
    this.showToast('Signed out successfully');
  }

  // --- NAVIGATION ---
  showHub() {
    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }
    this.activeGameId = null;
    this.gameArena.classList.add('hidden');
    this.arcadeHub.classList.remove('hidden');
    document.getElementById('nav-hub-btn').classList.add('active');
    document.body.classList.remove('game-active-lock');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- GAME LIFECYCLE ---
  launchGame(gameId) {
    const config = this.gameConfig[gameId];
    if (!config) return;

    if (this.activeGame) {
      this.activeGame.destroy();
      this.activeGame = null;
    }

    this.activeGameId = gameId;
    this.currentScore = 0;

    // Switch views
    this.arcadeHub.classList.add('hidden');
    this.gameArena.classList.remove('hidden');
    document.getElementById('nav-hub-btn').classList.remove('active');

    // Setup Header HUD
    this.arenaTitle.textContent = config.name;
    this.arenaBadge.textContent = config.badge;
    this.currentScoreEl.textContent = '0';
    this.bestScoreEl.textContent = this.personalBests[gameId] || 0;
    this.controlsHint.innerHTML = config.hint;
    this.pauseBtn.textContent = '⏸️ Pause';

    // D-Pad for touch/mobile
    if (config.dpad) {
      this.mobileDpad.classList.remove('hidden');
    } else {
      this.mobileDpad.classList.add('hidden');
    }

    // Mount canvas or DOM
    if (config.type === 'canvas') {
      this.gameCanvas.classList.remove('hidden');
      this.gameDomContainer.classList.add('hidden');
      this.activeGame = new config.class(
        this.gameCanvas,
        (score) => this.updateScore(score),
        (score, meta) => this.onGameOver(score, meta)
      );
    } else {
      this.gameCanvas.classList.add('hidden');
      this.gameDomContainer.classList.remove('hidden');
      this.activeGame = new config.class(
        this.gameDomContainer,
        (score) => this.updateScore(score),
        (score, meta) => this.onGameOver(score, meta)
      );
    }

    this.activeGame.start();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.classList.add('game-active-lock');
  }

  updateScore(score) {
    this.currentScore = score;
    this.currentScoreEl.textContent = score;
    const currentBest = this.personalBests[this.activeGameId] || 0;
    if (score > currentBest) {
      this.bestScoreEl.textContent = score;
    }
  }

  async onGameOver(score, metadata = {}) {
    const gameId = this.activeGameId;
    const config = this.gameConfig[gameId];

    // Populate Game Over Modal
    document.getElementById('gameover-game-name').textContent = config.name;
    document.getElementById('modal-final-score').textContent = score;

    const currentBest = this.personalBests[gameId] || 0;
    const isNewBest = score > currentBest;

    const newBestEl = document.getElementById('modal-new-best');
    const rankBadgeEl = document.getElementById('modal-rank-badge');
    const atlasStatusText = document.getElementById('modal-atlas-text');

    if (isNewBest) {
      this.personalBests[gameId] = score;
      const hubCardScore = document.getElementById(`best-${gameId}`);
      if (hubCardScore) hubCardScore.textContent = score;
      newBestEl.classList.remove('hidden');
    } else {
      newBestEl.classList.add('hidden');
    }
    rankBadgeEl.classList.add('hidden');

    this.gameoverModal.classList.remove('hidden');

    // Submit score to MongoDB Atlas if authenticated
    if (this.token && this.user) {
      atlasStatusText.textContent = 'Saving score to MongoDB Atlas...';
      try {
        const res = await fetch(`/api/games/${gameId}/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ score, metadata }),
        });

        const data = await res.json();
        if (data.success) {
          atlasStatusText.innerHTML = `🟢 Saved to MongoDB Atlas for <strong>${this.user.username}</strong>`;
          if (data.globalRank) {
            document.getElementById('modal-rank-num').textContent = `#${data.globalRank}`;
            rankBadgeEl.classList.remove('hidden');
          }
        } else {
          atlasStatusText.textContent = `⚠️ Atlas notice: ${data.message}`;
        }
      } catch (err) {
        atlasStatusText.textContent = '⚠️ Could not reach server to save score';
      }
    } else {
      atlasStatusText.innerHTML = `💡 <a href="#" id="gameover-auth-link" style="color:var(--accent-primary);">Sign in</a> to save your score to the global Atlas leaderboard!`;
      const link = document.getElementById('gameover-auth-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.openAuthModal();
        });
      }
    }
  }

  // --- LEADERBOARDS ---
  async openLeaderboards(gameId = 'snake') {
    this.activeLeaderboardGame = gameId;
    this.leaderboardModal.classList.remove('hidden');

    // Update active tab
    const tabs = this.leaderboardModal.querySelectorAll('.lb-tab');
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.game === gameId);
    });

    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Fetching Atlas leaderboard...</td></tr>';

    try {
      const res = await fetch(`/api/games/${gameId}/leaderboard`);
      const data = await res.json();

      if (data.success && data.leaderboard.length > 0) {
        tbody.innerHTML = data.leaderboard
          .map((entry, idx) => {
            let rankClass = '';
            let medal = `#${idx + 1}`;
            if (idx === 0) {
              rankClass = 'rank-gold';
              medal = '🥇 #1';
            } else if (idx === 1) {
              rankClass = 'rank-silver';
              medal = '🥈 #2';
            } else if (idx === 2) {
              rankClass = 'rank-bronze';
              medal = '🥉 #3';
            }

            const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : '-';
            return `
            <tr>
              <td class="${rankClass}">${medal}</td>
              <td><strong>${entry.username}</strong></td>
              <td class="score-col">${entry.score.toLocaleString()}</td>
              <td style="color:var(--text-muted); font-size:12px;">${dateStr}</td>
            </tr>
          `;
          })
          .join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:20px; color:var(--text-muted);">No high scores recorded yet. Be the first!</td></tr>';
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--danger);">Error loading leaderboard from Atlas</td></tr>';
    }
  }

  // --- AUTH MODAL ---
  openAuthModal() {
    this.authModal.classList.remove('hidden');
    document.getElementById('modal-auth-alert').classList.add('hidden');
  }

  closeAuthModal() {
    this.authModal.classList.add('hidden');
  }

  // --- EVENT BINDING ---
  bindEvents() {
    // Nav Brand & Hub
    document.getElementById('brand-home').addEventListener('click', () => this.showHub());
    document.getElementById('nav-hub-btn').addEventListener('click', () => this.showHub());
    document.getElementById('arena-back-btn').addEventListener('click', () => this.showHub());

    // Nav Leaderboards
    document.getElementById('nav-leaderboard-btn').addEventListener('click', () => this.openLeaderboards());
    document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
      this.leaderboardModal.classList.add('hidden');
    });

    // Leaderboard Tabs
    this.leaderboardModal.querySelectorAll('.lb-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.openLeaderboards(tab.dataset.game);
      });
    });

    // Sound toggle
    this.globalSoundBtn.addEventListener('click', () => {
      const isMuted = window.sound.toggleMute();
      this.globalSoundBtn.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Sound muted' : 'Sound enabled');
    });

    // Arena Controls
    this.pauseBtn.addEventListener('click', () => {
      if (this.activeGame && this.activeGame.pause) {
        const isPaused = this.activeGame.pause();
        this.pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
      }
    });

    document.getElementById('arena-restart-btn').addEventListener('click', () => {
      if (this.activeGameId) {
        this.launchGame(this.activeGameId);
      }
    });

    // Mobile D-Pad
    document.querySelectorAll('.dpad-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const dir = btn.dataset.dir;
        if (this.activeGame) {
          if (this.activeGame.handleDirection) {
            this.activeGame.handleDirection(dir);
          } else if (this.activeGame.move) {
            this.activeGame.move(dir);
          }
        }
      });
    });

    // Prevent default window scrolling when using arrow keys or spacebar during a game
    window.addEventListener('keydown', (e) => {
      if (this.activeGame && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
        // Allow typing in inputs if a modal is open
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
        }
      }
    }, { passive: false });

    // Category Filter Buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.category;

        document.querySelectorAll('.game-card').forEach((card) => {
          if (cat === 'all' || card.dataset.category === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // Game Over Modal actions
    document.getElementById('modal-play-again-btn').addEventListener('click', () => {
      this.gameoverModal.classList.add('hidden');
      if (this.activeGameId) this.launchGame(this.activeGameId);
    });

    document.getElementById('modal-view-leaderboard-btn').addEventListener('click', () => {
      this.gameoverModal.classList.add('hidden');
      this.openLeaderboards(this.activeGameId || 'snake');
    });

    document.getElementById('modal-exit-btn').addEventListener('click', () => {
      this.gameoverModal.classList.add('hidden');
      this.showHub();
    });

    // Auth trigger & close
    document.getElementById('open-auth-btn').addEventListener('click', () => this.openAuthModal());
    document.getElementById('close-auth-btn').addEventListener('click', () => this.closeAuthModal());
    document.getElementById('nav-logout-btn').addEventListener('click', () => this.logout());

    // Auth Tabs
    const tabLogin = document.getElementById('modal-tab-login');
    const tabReg = document.getElementById('modal-tab-register');
    const formLogin = document.getElementById('modal-login-form');
    const formReg = document.getElementById('modal-register-form');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
    });

    tabReg.addEventListener('click', () => {
      tabReg.classList.add('active');
      tabLogin.classList.remove('active');
      formReg.classList.remove('hidden');
      formLogin.classList.add('hidden');
    });

    // Login submit
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('m-login-email').value;
      const password = document.getElementById('m-login-password').value;
      const alertEl = document.getElementById('modal-auth-alert');
      const submitBtn = document.getElementById('m-login-btn');

      this.setBtnLoading(submitBtn, true, 'Sign In');
      alertEl.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('auth_token', data.token);

        this.renderAuthState();
        this.fetchPersonalBests();
        this.closeAuthModal();
        this.showToast(`Welcome back, ${data.user.username}!`);
      } catch (err) {
        alertEl.textContent = err.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
      } finally {
        this.setBtnLoading(submitBtn, false, 'Sign In');
      }
    });

    // Register submit
    formReg.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('m-reg-username').value;
      const email = document.getElementById('m-reg-email').value;
      const password = document.getElementById('m-reg-password').value;
      const alertEl = document.getElementById('modal-auth-alert');
      const submitBtn = document.getElementById('m-reg-btn');

      this.setBtnLoading(submitBtn, true, 'Create Account');
      alertEl.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('auth_token', data.token);

        this.renderAuthState();
        this.fetchPersonalBests();
        this.closeAuthModal();
        this.showToast(`Account created! Welcome, ${data.user.username}!`);
      } catch (err) {
        alertEl.textContent = err.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
      } finally {
        this.setBtnLoading(submitBtn, false, 'Create Account');
      }
    });
  }

  setBtnLoading(btn, isLoading, label) {
    const textSpan = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    if (isLoading) {
      textSpan.textContent = 'Please wait...';
      spinner.classList.remove('hidden');
      btn.disabled = true;
    } else {
      textSpan.textContent = label;
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  }
}

// Instantiate global arcade application
window.arcade = new ArcadeApp();
