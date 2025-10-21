const analyzeBtn = document.getElementById('analyze-btn');
const apiKeyInput = document.getElementById('api-key');
const descriptionDiv = document.getElementById('description');
const ingredientsDiv = document.getElementById('ingredients');
const recipesDiv = document.getElementById('recipes');
const recipeDetailDiv = document.getElementById('recipe-detail');
const viewHistoryBtn = document.getElementById('view-history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistory = document.getElementById('close-history');
const historyList = document.getElementById('history-list');

let lastRecipes = [];
let lastIngredients = [];
const FEEDBACK_KEY = 'recipe_feedback';
const HISTORY_KEY = 'saved_recipes';

function saveRecipeToHistory(recipe) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.unshift(recipe);
  if (history.length > 30) history = history.slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function removeRecipeFromHistory(idx) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.splice(idx, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function saveFeedback(recipeName, type) {
  let feedback = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
  if (!feedback[recipeName]) feedback[recipeName] = { like: 0, dislike: 0 };
  if (type === 'like') feedback[recipeName].like++;
  if (type === 'dislike') feedback[recipeName].dislike++;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
}

function showRecipeHistory() {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  if (history.length === 0) {
    historyList.innerHTML = '保存されたレシピはありません。';
    return;
  }
  let html = '';
  history.forEach((r, idx) => {
    html += `<div class="recipe-card">
      <div><b>${r.name}</b> <span style="font-size:0.9em;color:#888;">(${r.date})</span></div>
      <div style="font-size:0.98em;">${(r.detail||'').replace(/\n/g,'<br>')}</div>
      <button class="save-btn" style="background:#e67600;margin-top:8px;" onclick="window.removeRecipeFromHistoryUI(${idx})">削除</button>
    </div>`;
  });
  historyList.innerHTML = html;
}

window.removeRecipeFromHistoryUI = function(idx) {
  removeRecipeFromHistory(idx);
  showRecipeHistory();
}

viewHistoryBtn.addEventListener('click', () => {
  historyModal.style.display = 'flex';
  showRecipeHistory();
});
closeHistory.addEventListener('click', () => {
  historyModal.style.display = 'none';
});
window.onclick = function(event) {
  if (event.target === historyModal) historyModal.style.display = 'none';
};

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

  // Usa imagem capturada se já existir preview; se não, captura agora
  let imageData = '';
  const previewEl = document.getElementById('preview');
  if (previewEl && previewEl.style.display !== 'none' && previewEl.src) {
    imageData = previewEl.src;
  } else {
    imageData = window.captureImage();
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

  window.hideSpinner && window.hideSpinner();

  if (!response.ok) {
    descriptionDiv.textContent = 'APIエラー: ' + response.statusText;
    return;
  }
  const data = await response.json();
  let parsed;
  try {
    parsed = JSON.parse(data.choices[0].message.content);
  } catch {
    // Fallback para conteúdo não-JSON
    parsed = { description: data.choices[0].message.content, ingredients: [], recipes: [] };
  }
  descriptionDiv.textContent = parsed.description || '';
  lastIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  lastRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];
  // Render chips de ingredientes
  ingredientsDiv.innerHTML = '';
  lastIngredients.forEach((name, idx) => {
    const el = document.createElement('span');
    el.className = 'chip active';
    el.textContent = name;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', 'true');
    el.tabIndex = 0;
    el.onclick = () => toggleIngredient(idx, el);
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleIngredient(idx, el); } };
    ingredientsDiv.appendChild(el);
  });
  recipesDiv.innerHTML = '';
  for (let i = 0; i < lastRecipes.length; i++) {
    const name = lastRecipes[i];
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `<div><b>${i+1}. ${name}</b></div>`;
    const btnSave = document.createElement('button');
    btnSave.className = 'save-btn';
    btnSave.textContent = '保存';
    btnSave.onclick = async () => {
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
    const btnLike = document.createElement('button');
    btnLike.className = 'save-btn';
    btnLike.style.background = '#1a7f3c';
    btnLike.style.marginLeft = '8px';
    btnLike.textContent = 'いいね';
    btnLike.onclick = () => {
      saveFeedback(name, 'like');
      window.showToast && window.showToast('いいね！');
    };
    const btnDislike = document.createElement('button');
    btnDislike.className = 'save-btn';
    btnDislike.style.background = '#ff8c1a';
    btnDislike.style.marginLeft = '8px';
    btnDislike.textContent = 'よくないね';
    btnDislike.onclick = () => {
      saveFeedback(name, 'dislike');
      window.showToast && window.showToast('フィードバックを記録しました');
    };
    card.appendChild(btnSave);
    card.appendChild(btnLike);
    card.appendChild(btnDislike);
    recipesDiv.appendChild(card);
  }
  window.speakText && window.speakText(descriptionDiv.textContent + '。レシピ例は' + lastRecipes.join('、') + 'です。');
});

function getActiveIngredientsList() {
  return lastIngredients.filter((_, idx) => {
    const chip = ingredientsDiv.children[idx];
    return chip && chip.classList.contains('active');
  });
}

function toggleIngredient(idx, el) {
  if (!el) return;
  const active = el.classList.toggle('active');
  el.setAttribute('aria-pressed', active ? 'true' : 'false');
}

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
          content: 'あなたは日本語のレシピアシスタントです。指定された料理名について、材料と手順を日本語で簡潔に説明します。入力で有効な食材のリストが渡された場合、その食材のみで作れるバージョンを優先して提案してください。'
        },
        {
          role: 'user',
          content: `料理名: ${recipeName}\n利用可能な食材: ${getActiveIngredientsList().join(', ')}`
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
