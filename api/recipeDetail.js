export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  try {
    const { recipeName, availableIngredients } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ error: 'recipeName is required' });
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
            content: 'あなたは日本語のレシピアシスタントです。指定された料理名について、材料と手順を日本語で簡潔に説明します。入力で有効な食材のリストが渡された場合、その食材のみで作れるバージョンを優先して提案してください。'
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
