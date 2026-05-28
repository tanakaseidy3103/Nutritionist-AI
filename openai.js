const analyzeBtn = document.getElementById('analyze-btn');
const apiKeyInput = document.getElementById('api-key'); // mantido, mas não mais obrigatório
const descriptionDiv = document.getElementById('description');
const ingredientsDiv = document.getElementById('ingredients');
const recipesDiv = document.getElementById('recipes');
const recipeDetailDiv = document.getElementById('recipe-detail');
const viewHistoryBtn = document.getElementById('view-history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistory = document.getElementById('close-history');
const historyList = document.getElementById('history-list');
const langSelect = document.getElementById('lang-select');
const timeSelect = document.getElementById('time-select');
const dietSelect = document.getElementById('diet-select');

const PREFS_KEY = 'user_prefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (prefs.lang && langSelect) langSelect.value = prefs.lang;
    if (prefs.time && timeSelect) timeSelect.value = prefs.time;
    if (prefs.diet && dietSelect) dietSelect.value = prefs.diet;
  } catch {}
}

function savePrefs() {
  try {
    const prefs = {
      lang: (langSelect && langSelect.value) || 'ja',
      time: (timeSelect && timeSelect.value) || 'any',
      diet: (dietSelect && dietSelect.value) || 'none'
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  loadPrefs();
  langSelect && langSelect.addEventListener('change', savePrefs);
  timeSelect && timeSelect.addEventListener('change', savePrefs);
  dietSelect && dietSelect.addEventListener('change', savePrefs);
});

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
  window.showSpinner && window.showSpinner();
  descriptionDiv.textContent = '分析中...';
  recipesDiv.innerHTML = '';
  recipeDetailDiv.innerHTML = '';

  let imageData = '';
  const previewEl = document.getElementById('preview');
  if (previewEl && previewEl.style.display !== 'none' && previewEl.src) {
    imageData = previewEl.src;
  } else {
    imageData = window.captureImage();
  }

  const prefs = {
    lang: (langSelect && langSelect.value) || 'ja',
    time: (timeSelect && timeSelect.value) || 'any',
    diet: (dietSelect && dietSelect.value) || 'none'
  };

  let response;
  try {
    const userPrefs = (window.getUserPreferences ? await window.getUserPreferences() : { dislikes: [], allergies: [], calorieTarget: '' });
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, prefs, userPrefs })
    });
  } catch (e) {
    window.hideSpinner && window.hideSpinner();
    descriptionDiv.textContent = 'APIエラー: ネットワークに接続できません。';
    return;
  }

  window.hideSpinner && window.hideSpinner();

  if (!response.ok) {
    const msg = await response.text();
    descriptionDiv.textContent = 'APIエラー: ' + msg;
    return;
  }
  const parsed = await response.json();
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
  // focus first chip for accessibility
  try { const firstChip = ingredientsDiv.querySelector('.chip'); if (firstChip) firstChip.focus(); } catch {}
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
      const detail = await showRecipeDetail(name, i, true);
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
    btnLike.className = 'save-btn like-btn';
    btnLike.textContent = 'いいね';
    btnLike.onclick = () => {
      saveFeedback(name, 'like');
      window.showToast && window.showToast('いいね！');
    };
    const btnDislike = document.createElement('button');
    btnDislike.className = 'save-btn dislike-btn';
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
  const spokenLang = prefs.lang === 'pt' ? 'pt-BR' : (prefs.lang === 'en' ? 'en-US' : 'ja-JP');
  if (window.speakText) {
    const originalSpeak = window.speakText;
    window.speakText = function(text) {
      try {
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = spokenLang;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch {
        originalSpeak(text);
      }
    }
  }
  window.speakText && window.speakText(descriptionDiv.textContent + (prefs.lang==='ja' ? '。レシピ例は' : prefs.lang==='pt' ? '. Exemplos de receitas: ' : '. Recipe ideas: ') + lastRecipes.join(prefs.lang==='ja' ? '、' : ', '));
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

async function showRecipeDetail(recipeName, idx, silent) {
  recipeDetailDiv.textContent = 'レシピ詳細を取得中...';
  const prefs = {
    lang: (langSelect && langSelect.value) || 'ja',
    time: (timeSelect && timeSelect.value) || 'any',
    diet: (dietSelect && dietSelect.value) || 'none'
  };
  const userPrefs = (window.getUserPreferences ? await window.getUserPreferences() : { dislikes: [], allergies: [], calorieTarget: '' });
  let response;
  try {
    response = await fetch('/api/recipeDetail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipeName,
        availableIngredients: getActiveIngredientsList(),
        prefs,
        userPrefs
      })
    });
  } catch (e) {
    recipeDetailDiv.textContent = 'APIエラー: ネットワークに接続できません。';
    return '';
  }
  if (!response.ok) {
    recipeDetailDiv.textContent = 'APIエラー: ' + (await response.text());
    return '';
  }
  const data = await response.json();
  const content = data.content;
  if (!silent) {
    recipeDetailDiv.textContent = content;
    window.speakText && window.speakText(content);
  }
  return content;
}

window.showRecipeDetail = showRecipeDetail;
