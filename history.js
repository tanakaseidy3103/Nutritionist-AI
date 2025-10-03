// history.js

const HISTORY_KEY = 'saved_recipes';

function saveRecipeToHistory(recipe) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.unshift(recipe); // Adiciona no início
  if (history.length > 30) history = history.slice(0, 30); // Limita a 30 receitas
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function clearRecipeHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

function showRecipeHistory(filter = '') {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const listDiv = document.getElementById('history-list');
  const counter = document.getElementById('history-counter');
  filter = (filter || '').trim();
  let filtered = history;
  if (filter) {
    filtered = history.filter(r => r.name.includes(filter) || (r.detail && r.detail.includes(filter)));
  }
  counter.textContent = `📜 ${filtered.length}件のレシピ`;
  if (filtered.length === 0) {
    listDiv.innerHTML = '保存されたレシピはありません。';
    return;
  }
  let html = '';
  filtered.forEach(r => {
    html += `<div class="recipe-card">
      ${r.image ? `<img src="${r.image}" alt="${r.name}">` : ''}
      <div><b>${r.name}</b> <span style="font-size:0.9em;color:#888;">(${r.date})</span></div>
      <div class="mini-desc">${r.miniDesc || ''}</div>
      <div style="font-size:0.98em;">${(r.detail||'').replace(/\n/g,'<br>')}</div>
    </div>`;
  });
  listDiv.innerHTML = html;
}

window.saveRecipeToHistory = saveRecipeToHistory;
window.showRecipeHistory = showRecipeHistory;
window.clearRecipeHistory = clearRecipeHistory;
