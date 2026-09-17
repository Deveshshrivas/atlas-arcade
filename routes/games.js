const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const { protect } = require('../middleware/auth');

const VALID_GAMES = [
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
];

/**
 * @route   POST /api/games/:gameId/score
 * @desc    Submit a game score (Protected)
 * @access  Private
 */
router.post('/:gameId/score', protect, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score, metadata } = req.body;

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({ success: false, message: 'Invalid game identifier' });
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0) {
      return res.status(400).json({ success: false, message: 'Score must be a valid positive number' });
    }

    // Check user's previous best
    const previousBest = await Score.findOne({
      user: req.user._id,
      gameId,
    }).sort({ score: -1 });

    const isNewHighScore = !previousBest || numScore > previousBest.score;

    // Save score entry
    const newScore = await Score.create({
      user: req.user._id,
      username: req.user.username,
      gameId,
      score: numScore,
      metadata: metadata || {},
    });

    // Calculate player's global rank for this score
    const rank = await Score.aggregate([
      { $match: { gameId } },
      { $group: { _id: '$user', bestScore: { $max: '$score' } } },
      { $match: { bestScore: { $gt: numScore } } },
      { $count: 'higherPlayers' },
    ]);

    const globalRank = (rank.length > 0 ? rank[0].higherPlayers : 0) + 1;

    res.status(201).json({
      success: true,
      message: isNewHighScore ? '🎉 New high score recorded!' : 'Score recorded successfully',
      score: numScore,
      isNewHighScore,
      globalRank,
      personalBest: isNewHighScore ? numScore : previousBest.score,
    });
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({ success: false, message: 'Failed to record score in MongoDB Atlas' });
  }
});

/**
 * @route   GET /api/games/:gameId/leaderboard
 * @desc    Get top 10 unique player high scores for a specific game
 * @access  Public
 */
router.get('/:gameId/leaderboard', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({ success: false, message: 'Invalid game identifier' });
    }

    const leaderboard = await Score.aggregate([
      { $match: { gameId } },
      { $sort: { score: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$user',
          username: { $first: '$username' },
          score: { $max: '$score' },
          date: { $first: '$createdAt' },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: 1,
          score: 1,
          date: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      gameId,
      leaderboard,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard from MongoDB Atlas' });
  }
});

/**
 * @route   GET /api/games/my-scores
 * @desc    Get the current logged-in user's personal bests across all games
 * @access  Private
 */
router.get('/my-scores', protect, async (req, res) => {
  try {
    const myScores = await Score.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$gameId',
          bestScore: { $max: '$score' },
          lastPlayed: { $max: '$createdAt' },
          playsCount: { $sum: 1 },
        },
      },
    ]);

    const scoresMap = {};
    VALID_GAMES.forEach((g) => {
      scoresMap[g] = { bestScore: 0, playsCount: 0, lastPlayed: null };
    });

    myScores.forEach((item) => {
      scoresMap[item._id] = {
        bestScore: item.bestScore,
        playsCount: item.playsCount,
        lastPlayed: item.lastPlayed,
      };
    });

    res.status(200).json({
      success: true,
      scores: scoresMap,
    });
  } catch (error) {
    console.error('My scores error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve personal scores' });
  }
});

module.exports = router;
