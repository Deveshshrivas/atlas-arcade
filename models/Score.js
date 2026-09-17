const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    gameId: {
      type: String,
      required: true,
      enum: [
        'snake',
        'breakout',
        'flappy',
        '2048',
        'memory',
        'tictactoe',
        'invaders',
        'pong',
        'racer',
        'jump',
        'minesweeper',
        'whack',
        'tetris',
        'asteroids',
        'pacman',
        'typing',
        'frogger',
        'simon',
        'platformer',
        'copter',
      ],
    },
    score: {
      type: Number,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for high-score leaderboard querying
scoreSchema.index({ gameId: 1, score: -1, createdAt: 1 });
scoreSchema.index({ user: 1, gameId: 1 });

module.exports = mongoose.model('Score', scoreSchema);
