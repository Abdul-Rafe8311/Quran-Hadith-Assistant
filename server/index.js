require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { runRAG } = require('./ragPipeline');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { error: 'Too many requests. Please wait a moment.' },
});

app.use('/api/ask', limiter);

app.post('/api/ask', async (req, res) => {
  try {
    const { question, language, responseSize } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required.' });
    }
    const size = ['small', 'medium', 'large'].includes(responseSize) ? responseSize : 'medium';
    console.log(`[${new Date().toISOString()}] Question (${size}): ${question.substring(0, 80)}`);
    const result = await runRAG(question.trim(), language, size);
    res.json(result);
  } catch (err) {
    console.error('RAG error:', err);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }
    res.status(500).json({ error: 'Failed to process your question. Please try again.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Islamic Q&A server running on port ${PORT}`);

  // Keep-alive ping every 14 minutes to prevent Render free tier from sleeping
  if (process.env.RENDER_EXTERNAL_URL) {
    const url = `${process.env.RENDER_EXTERNAL_URL}/health`;
    setInterval(() => {
      fetch(url).catch(() => {});
      console.log('[keep-alive] pinged', url);
    }, 14 * 60 * 1000);
  }
});
