// openai.js

const analyzeBtn = document.getElementById('analyze-btn');
const apiKeyInput = document.getElementById('api-key');
const descriptionDiv = document.getElementById('description');
const recipesDiv = document.getElementById('recipes');
const recipeDetailDiv = document.getElementById('recipe-detail');

let lastRecipes = [];

// Função para gerar imagem via OpenAI Image API
async function generateRecipeImage(apiKey, prompt) {
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt + ' 料理の写真, シンプル, 明るい背景',
        n: 1,
        size: '256x256'
      })
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.data[0]?.url || '';
  } catch {
    return '';
  }
}

analyzeBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert('APIキーを入力してください');
    return;
  }
  window.showSpinner && window.showSpinner();
  descriptionDiv.textContent = '分析中...';
  recipesDiv.innerHTML = '';
  recipeDetailDiv.innerHTML = '';

  const imageData = window.captureImage();

  // Prompt simples: só nomes
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
          content: 'あなたは食材認識とレシピ提案のアシスタントです。画像に写っている食材を日本語で説明し、その食材を使った3種類の簡単なレシピ名を日本語で提案してください。レシピ名だけをリストで返してください。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'この画像の食材を分析し、3つのレシピ名を提案してください。' },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens: 500
    })
  });

  window.hideSpinner && window.hideSpinner();

  if (!response.ok) {
    descriptionDiv.textContent = 'APIエラー: ' + response.statusText;
    return;
  }
  const data = await response.json();
  const content = data.choices[0].message.content;
  // content例: "この画像にはバナナが写っています。\n\n【レシピ例】\n1. バナナパンケーキ\n2. バナナスムージー\n3. バナナヨーグルト"
  const [desc, ...rest] = content.split(/\n+【レシピ例】\n?/);
  descriptionDiv.textContent = desc.trim();
  let recipes = [];
  if (rest.length > 0) {
    recipes = rest[0].split(/\n|\d+\. /).filter(x => x && x.trim()).map(x => x.trim());
  }
  lastRecipes = recipes;
  recipesDiv.innerHTML = '';
  for (let i = 0; i < recipes.length; i++) {
    const name = recipes[i];
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `<div><b>${name}</b></div>`;
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = '選択＆保存';
    saveBtn.onclick = async () => {
      window.showSpinner && window.showSpinner();
      const detail = await showRecipeDetail(apiKey, name, i, true);
      window.hideSpinner && window.hideSpinner();
      const recipeObj = {
        name: name,
        detail: detail,
        date: new Date().toLocaleString('ja-JP', { hour12: false })
      };
      saveRecipeToHistory(recipeObj);
      window.showToast && window.showToast('保存しました！');
    };
    card.appendChild(saveBtn);
    recipesDiv.appendChild(card);
  }
  // 説明を音声で再生
  window.speakText && window.speakText(descriptionDiv.textContent + '。レシピ例は' + recipes.join('、') + 'です。');
});

async function showRecipeDetail(apiKey, recipeName, idx, silent) {
  recipeDetailDiv.textContent = 'レシピ詳細を取得中...';
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
          content: 'あなたは日本語のレシピアシスタントです。指定された料理名のレシピを、材料と手順を含めて日本語で簡潔に説明してください。'
        },
        {
          role: 'user',
          content: `「${recipeName}」のレシピを教えてください。`
        }
      ],
      max_tokens: 500
    })
  });
  if (!response.ok) {
    recipeDetailDiv.textContent = 'APIエラー: ' + response.statusText;
    return '';
  }
  const data = await response.json();
  const content = data.choices[0].message.content;
  if (!silent) {
    recipeDetailDiv.textContent = content;
    window.speakText && window.speakText(content);
  }
  return content;
}

window.showRecipeDetail = showRecipeDetail;
