/**
 * Neon Simon Game
 */
class SimonGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.colors = ['#ff0055', '#00ffcc', '#ffff00', '#aa00ff'];
    this.sounds = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    this.reset();
  }

  reset() {
    this.sequence = [];
    this.playerStep = 0;
    this.score = 0;
    this.isRunning = false;
    this.isShowingSequence = false;
    this.setupDOM();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:400px; background:#050a15; border-radius:8px; border:2px solid var(--border-color);">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:20px; border-radius:50%; background:#111; width:300px; height:300px; position:relative;">
          <div id="simon-btn-0" class="simon-btn" data-id="0" style="background:${this.colors[0]}; border-top-left-radius:100%; opacity:0.3; cursor:pointer; transition:opacity 0.1s;"></div>
          <div id="simon-btn-1" class="simon-btn" data-id="1" style="background:${this.colors[1]}; border-top-right-radius:100%; opacity:0.3; cursor:pointer; transition:opacity 0.1s;"></div>
          <div id="simon-btn-2" class="simon-btn" data-id="2" style="background:${this.colors[2]}; border-bottom-left-radius:100%; opacity:0.3; cursor:pointer; transition:opacity 0.1s;"></div>
          <div id="simon-btn-3" class="simon-btn" data-id="3" style="background:${this.colors[3]}; border-bottom-right-radius:100%; opacity:0.3; cursor:pointer; transition:opacity 0.1s;"></div>
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:100px; height:100px; background:#050a15; border-radius:50%; display:flex; justify-content:center; align-items:center; color:#fff; font-family:'Press Start 2P'; font-size:24px;" id="simon-score">0</div>
        </div>
      </div>
    `;

    this.buttons = Array.from(this.container.querySelectorAll('.simon-btn'));
    this.scoreDisplay = document.getElementById('simon-score');
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.bindEvents();
    setTimeout(() => this.nextRound(), 1000);
  }

  nextRound() {
    this.playerStep = 0;
    this.sequence.push(Math.floor(Math.random() * 4));
    this.scoreDisplay.textContent = this.score;
    this.playSequence();
  }

  async playSequence() {
    this.isShowingSequence = true;
    for (let i = 0; i < this.sequence.length; i++) {
      await this.sleep(400);
      await this.flashButton(this.sequence[i], 400);
    }
    this.isShowingSequence = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async flashButton(id, duration = 300) {
    const btn = this.buttons[id];
    btn.style.opacity = '1';
    btn.style.boxShadow = `0 0 20px ${this.colors[id]}`;
    if (window.sound) window.sound.playBeep(this.sounds[id], 'sine', duration / 1000);
    
    await this.sleep(duration);
    
    btn.style.opacity = '0.3';
    btn.style.boxShadow = 'none';
  }

  handlePlayerClick(id) {
    if (!this.isRunning || this.isShowingSequence) return;
    
    this.flashButton(id, 200);

    if (id === this.sequence[this.playerStep]) {
      this.playerStep++;
      if (this.playerStep === this.sequence.length) {
        this.score++;
        this.onScoreUpdate(this.score);
        this.isShowingSequence = true;
        setTimeout(() => this.nextRound(), 1000);
      }
    } else {
      this.gameOver();
    }
  }

  bindEvents() {
    this.clickHandler = (e) => {
      const btn = e.target.closest('.simon-btn');
      if (btn) {
        this.handlePlayerClick(parseInt(btn.dataset.id));
      }
    };
    this.container.addEventListener('click', this.clickHandler);
  }

  unbindEvents() {
    if (this.clickHandler) {
      this.container.removeEventListener('click', this.clickHandler);
    }
  }

  pause() {
    return false; // Can't pause Simon easily due to async sequences
  }

  destroy() {
    this.isRunning = false;
    this.unbindEvents();
    this.container.innerHTML = '';
  }

  gameOver() {
    this.isRunning = false;
    if (window.sound) window.sound.playError();
    
    // Flash all red
    this.buttons.forEach(b => {
      b.style.background = '#ff0000';
      b.style.opacity = '1';
    });
    
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 1000);
  }
}

window.SimonGame = SimonGame;
