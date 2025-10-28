export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  try {
    const { imageData } = req.body || {};
    if (!imageData) {
      return res.status(400).json({ error: 'imageData is required' });
    }
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
            content: 'あなたは画像内の食材を認識し、JSONで構造化出力を返す日本語アシスタントです。返答は必ず次のJSONのみ: {"description": string, "ingredients": string[], "recipes": string[3]}. 余計な文章は出力しないでください。'
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
      })
    });
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
