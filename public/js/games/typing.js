/**
 * Cyber Typer Game
 */
class TypingGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.wordsList = [
      "cyber", "neon", "matrix", "hacker", "system", "override", "protocol", "firewall", "breach", "data", "upload",
      "download", "server", "node", "packet", "encryption", "decrypt", "syntax", "array", "variable", "function",
      "execute", "compile", "terminal", "console", "network", "router", "gateway", "proxy", "bypass", "access",
      "denied", "granted", "secure", "mainframe", "uplink", "bandwidth", "byte", "pixel", "glitch", "algorithm"
    ];

    this.reset();
  }

  reset() {
    this.words = [];
    this.score = 0;
    this.level = 1;
    this.speed = 1;
    this.spawnRate = 2000;
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.currentInput = "";
    
    this.container.innerHTML = `
      <div id="typer-arena" style="position:relative; width:100%; height:400px; background:#050a15; overflow:hidden; border:2px solid var(--border-color); border-radius:8px;">
        <div id="typer-input-display" style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); font-size:24px; color:#00ffff; text-shadow: 0 0 10px #00ffff; height:30px; z-index:10;"></div>
      </div>
    `;
    this.arena = document.getElementById('typer-arena');
    this.inputDisplay = document.getElementById('typer-input-display');
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
    this.container.innerHTML = '';
  }

  gameOver() {
    this.isRunning = false;
    if (window.sound) window.sound.playExplosion();
    this.onGameOver(this.score);
  }

  spawnWord() {
    const text = this.wordsList[Math.floor(Math.random() * this.wordsList.length)];
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.top = '-30px';
    el.style.left = Math.random() * 80 + 10 + '%';
    el.style.transform = 'translateX(-50%)';
    el.style.color = '#ff00ff';
    el.style.textShadow = '0 0 5px #ff00ff';
    el.style.fontSize = '20px';
    el.style.fontFamily = '"JetBrains Mono", monospace';
    
    this.arena.appendChild(el);
    this.words.push({ text, el, y: -30 });
  }

  loop(time = 0) {
    if (!this.isRunning || this.isPaused) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.spawnTimer += deltaTime;
    if (this.spawnTimer > this.spawnRate) {
      this.spawnTimer = 0;
      this.spawnWord();
      
      // Increase difficulty
      this.speed += 0.05;
      this.spawnRate = Math.max(500, this.spawnRate - 50);
    }

    // Move words
    for (let i = this.words.length - 1; i >= 0; i--) {
      const w = this.words[i];
      w.y += this.speed * (deltaTime / 16);
      w.el.style.top = w.y + 'px';

      // Check collision with bottom
      if (w.y > 380) {
        this.gameOver();
        return;
      }
    }

    requestAnimationFrame((time) => this.loop(time));
  }

  handleKeyDown = (e) => {
    if (!this.isRunning || this.isPaused) return;
    
    // Ignore meta keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    if (e.key === 'Backspace') {
      this.currentInput = this.currentInput.slice(0, -1);
    } else if (e.key === 'Escape') {
      this.currentInput = '';
    } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      this.currentInput += e.key.toLowerCase();
    }
    
    this.inputDisplay.textContent = this.currentInput;

    // Check for match
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i].text === this.currentInput) {
        // Matched!
        const w = this.words[i];
        this.arena.removeChild(w.el);
        this.words.splice(i, 1);
        
        this.score += w.text.length * 10;
        this.onScoreUpdate(this.score);
        if (window.sound) window.sound.playBeep(600, 'sine', 0.1);
        
        this.currentInput = '';
        this.inputDisplay.textContent = '';
        break;
      }
    }
    
    // Highlight matching prefix
    this.words.forEach(w => {
      if (this.currentInput.length > 0 && w.text.startsWith(this.currentInput)) {
        w.el.innerHTML = `<span style="color:#00ffff">${this.currentInput}</span>${w.text.substring(this.currentInput.length)}`;
      } else {
        w.el.textContent = w.text;
      }
    });
  };

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  unbindEvents() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

window.TypingGame = TypingGame;
