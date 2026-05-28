export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost'
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  try {
    const { recipeName, availableIngredients, prefs, userPrefs } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ error: 'recipeName is required' });
    }
    const lang = (prefs && prefs.lang) || 'ja';
    const time = (prefs && prefs.time) || 'any';
    const diet = (prefs && prefs.diet) || 'none';

    const langLabel = lang === 'pt' ? 'ポルトガル語' : (lang === 'en' ? '英語' : '日本語');
    const constraints = `${time !== 'any' ? ` 所要時間は最大${time}分。` : ''}${diet !== 'none' ? ` 食事制限: ${diet}.` : ''}`;

    const dislikes = Array.isArray(userPrefs?.dislikes) ? userPrefs.dislikes.join(', ') : '';
    const allergies = Array.isArray(userPrefs?.allergies) ? userPrefs.allergies.join(', ') : '';
    const calorieTarget = userPrefs?.calorieTarget ? ` 目標カロリー: 約${userPrefs.calorieTarget} kcal.` : '';

    const requestId = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    res.setHeader('X-Request-Id', requestId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    async function callOpenAI() {
      return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'text' },
        messages: [
          {
            role: 'system',
            content: `あなたはレシピアシスタントです。指定言語(${langLabel})で、材料と手順を簡潔に。可能なら利用可能な食材のみで作れるバージョンを優先。避ける食材: ${dislikes || 'なし'}。アレルギー: ${allergies || 'なし'}。栄養情報(kcal, たんぱく質/脂質/炭水化物)を推定して最後に示すこと。${calorieTarget}${constraints}`
          },
          {
            role: 'user',
            content: `料理名: ${recipeName}\n利用可能な食材: ${Array.isArray(availableIngredients) ? availableIngredients.join(', ') : ''}`
          }
        ],
        max_tokens: 500
      }),
      signal: controller.signal
    });
    }

    let response = await callOpenAI();
    if (response.status >= 500 || response.status === 429) {
      await new Promise(r => setTimeout(r, 600));
      response = await callOpenAI();
    }
    clearTimeout(timeout);
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
