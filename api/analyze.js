export default async function handler(req, res) {
  // Security headers
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
    const { imageData, prefs, userPrefs } = req.body || {};
    if (!imageData) {
      return res.status(400).json({ error: 'imageData is required' });
    }
    // Body limit básico (~3MB do dataURL)
    const approxSize = typeof imageData === 'string' ? imageData.length : 0;
    if (approxSize > 3 * 1024 * 1024) {
      return res.status(413).json({ error: 'Payload too large' });
    }
    const lang = (prefs && prefs.lang) || 'ja';
    const time = (prefs && prefs.time) || 'any';
    const diet = (prefs && prefs.diet) || 'none';

    const langLabel = lang === 'pt' ? 'ポルトガル語' : (lang === 'en' ? '英語' : '日本語');
    const constraints = `${time !== 'any' ? ` 所要時間は最大${time}分。` : ''}${diet !== 'none' ? ` 食事制限: ${diet}.` : ''}`;

    const dislikes = Array.isArray(userPrefs?.dislikes) ? userPrefs.dislikes.join(', ') : '';
    const allergies = Array.isArray(userPrefs?.allergies) ? userPrefs.allergies.join(', ') : '';

    // Request ID and timeout
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
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `あなたは画像内の食材を認識し、ユーザーの希望する言語で出力するアシスタントです。嫌いな食材: ${dislikes || 'なし'}。アレルギー: ${allergies || 'なし'}。必ず次のJSONのみで回答: {\"description\": string, \"ingredients\": string[], \"recipes\": string[3]}. 余計な文章は書かないでください。出力言語: ${langLabel}。${constraints}`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'この画像の食材を分析し、説明と食材リスト、3つのレシピ名を返してください。JSONのみで返答してください。' },
                { type: 'image_url', image_url: { url: imageData } }
              ]
            }
          ],
          max_tokens: 500
        }),
        signal: controller.signal
      });
    }

    // simple retry for transient errors
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
    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      parsed = { description: data.choices[0].message.content, ingredients: [], recipes: [] };
    }
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err?.message || String(err) });
  }
}
