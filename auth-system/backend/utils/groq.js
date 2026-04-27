const axios = require('axios');

async function callGroq(prompt, maxTokens = 16384) {
  const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
  const model   = process.env.GROQ_MODEL    || 'llama-3.3-70b-versatile';
  const apiKey  = process.env.GROQ_API_KEY;

  const res = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  maxTokens,
      stream:      false,
    },
    {
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    }
  );

  return res.data.choices[0].message.content.trim();
}

module.exports = { callGroq };
