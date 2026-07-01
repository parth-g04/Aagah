const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/', authMiddleware, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
  }

  // System Prompt strictly forcing farming-only answers
  const systemPrompt = `
You are "Aagah Krishi Sahayak", a helpful and knowledgeable AI agricultural assistant.
Your goal is to assist farmers, agricultural officers, and decision-makers in the Anantapur region with farming-related information.

Strict Instruction:
- You must ONLY answer questions related to agriculture, farming, crops (such as Groundnut, Paddy, Cotton, Jowar), soil moisture, irrigation, rainfall, plant pests, crop diseases, fertilizer usage, Mandi prices, agricultural weather, and government schemes for farmers (like PM-KISAN, Rythu Bharosa, crop insurance).
- If the user asks about ANY unrelated topic—including coding, web development, movies, actors, general knowledge history, writing stories/poetry on non-farm subjects, general science (not agricultural), pop culture, or anything else unrelated to farming/agriculture—you must politely refuse to answer. State that you are strictly dedicated to farmer and agricultural support, and redirect them to ask farming-related questions.
- Keep your answers concise, practical, and helpful. Use simple formatting.
- If appropriate, mention that you support Telugu and Hindi queries.
`;

  // Construct messages array
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Append history if present
  if (Array.isArray(history)) {
    // Limit history to last 10 messages for performance and context limits
    const limitedHistory = history.slice(-10);
    limitedHistory.forEach(msg => {
      if (msg.role && msg.content) {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      }
    });
  }

  // Append current user message
  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Chat Groq Error]:', errText);
      return res.status(500).json({ error: 'Failed to communicate with AI service.' });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    return res.json({ reply });
  } catch (err) {
    console.error('[Chat Route Error]:', err);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
});

module.exports = router;
