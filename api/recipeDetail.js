export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  try {
    const { recipeName, availableIngredients, prefs } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ error: 'recipeName is required' });
    }
    const lang = (prefs && prefs.lang) || 'ja';
    const time = (prefs && prefs.time) || 'any';
    const diet = (prefs && prefs.diet) || 'none';

    const langLabel = lang === 'pt' ? 'ポルトガル語' : (lang === 'en' ? '英語' : '日本語');
    const constraints = `${time !== 'any' ? ` 所要時間は最大${time}分。` : ''}${diet !== 'none' ? ` 食事制限: ${diet}.` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはレシピアシスタントです。指定言語(${langLabel})で、材料と手順を簡潔に。可能なら利用可能な食材のみで作れるバージョンを優先。${constraints}`
          },
          {
            role: 'user',
            content: `料理名: ${recipeName}\n利用可能な食材: ${Array.isArray(availableIngredients) ? availableIngredients.join(', ') : ''}`
          }
        ],
        max_tokens: 500
      })
    });
    if (!response.ok) {
      const txt = await response.text();
      return res.status(response.status).json({ error: 'OpenAI error', detail: txt });
    }
    const data = await response.json();
    const content = data.choices[0].message.content;
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err?.message || String(err) });
  }
}
