/**
 * Cyber Memory Match Game
 */
class MemoryGame {
  constructor(container, onScoreUpdate, onGameOver) {
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    this.emojis = ['👾', '🤖', '🚀', '⚡', '💎', '🕹️', '🔮', '🛡️'];
    this.reset();
  }

  reset() {
    this.moves = 0;
    this.matches = 0;
    this.score = 0;
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.flippedCards = [];
    this.isLocked = false;
    this.isRunning = false;
    this.isPaused = false;
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused && this.isRunning) {
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateHUD();
      }
    }, 1000);

    this.onScoreUpdate(this.score);
    this.render();
  }

  render() {
    // Shuffle 8 pairs (16 cards total)
    const deck = [...this.emojis, ...this.emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji, matched: false, flipped: false }));

    this.deck = deck;
    this.container.innerHTML = `
      <div class="memory-game-wrap">
        <div class="memory-hud">
          <span>Moves: <strong id="mem-moves">0</strong></span>
          <span>Time: <strong id="mem-time">0s</strong></span>
        </div>
        <div class="memory-grid">
          ${deck
            .map(
              (card) => `
            <div class="memory-card" data-id="${card.id}">
              <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${card.emoji}</div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const cardEls = this.container.querySelectorAll('.memory-card');
    cardEls.forEach((el) => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id, 10);
        this.flipCard(id, el);
      });
    });
  }

  flipCard(id, el) {
    if (!this.isRunning || this.isPaused || this.isLocked) return;

    const card = this.deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    window.sound?.playClick();
    card.flipped = true;
    el.classList.add('flipped');
    this.flippedCards.push({ card, el });

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.updateHUD();
      this.checkMatch();
    }
  }

  checkMatch() {
    this.isLocked = true;
    const [c1, c2] = this.flippedCards;

    if (c1.card.emoji === c2.card.emoji) {
      // Match found!
      setTimeout(() => {
        window.sound?.playScore();
        c1.card.matched = true;
        c2.card.matched = true;
        c1.el.classList.add('matched');
        c2.el.classList.add('matched');
        this.matches++;

        this.score += 150;
        this.onScoreUpdate(this.score);

        this.flippedCards = [];
        this.isLocked = false;

        if (this.matches === this.emojis.length) {
          this.endGame();
        }
      }, 400);
    } else {
      // Mismatch
      setTimeout(() => {
        window.sound?.playHit();
        c1.card.flipped = false;
        c2.card.flipped = false;
        c1.el.classList.remove('flipped');
        c2.el.classList.remove('flipped');
        this.flippedCards = [];
        this.isLocked = false;
      }, 900);
    }
  }

  updateHUD() {
    const movesEl = this.container.querySelector('#mem-moves');
    const timeEl = this.container.querySelector('#mem-time');
    if (movesEl) movesEl.textContent = this.moves;
    if (timeEl) timeEl.textContent = `${this.elapsedSeconds}s`;
  }

  pause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  endGame() {
    this.isRunning = false;
    clearInterval(this.timerInterval);

    // Calculate final score with time and move efficiency bonuses
    const timeBonus = Math.max(0, 500 - this.elapsedSeconds * 8);
    const moveBonus = Math.max(0, 500 - (this.moves - 8) * 35);
    const finalScore = this.score + timeBonus + moveBonus;

    window.sound?.playWin();
    this.onScoreUpdate(finalScore);
    this.onGameOver(finalScore, {
      moves: this.moves,
      timeSeconds: this.elapsedSeconds,
    });
  }

  destroy() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.container.innerHTML = '';
  }
}

window.MemoryGame = MemoryGame;
