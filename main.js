// main.js

document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast');
  const spinner = document.getElementById('spinner');
  const viewHistoryBtn = document.getElementById('view-history-btn');
  const historyModal = document.getElementById('history-modal');
  const closeHistory = document.getElementById('close-history');
  const historyFilter = document.getElementById('history-filter');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Toast
  window.showToast = function (msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    toast.style.display = 'block';
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 1800);
  };

  // Spinner
  window.showSpinner = function () {
    spinner.style.display = 'flex';
  };
  window.hideSpinner = function () {
    spinner.style.display = 'none';
  };

  // Modal de histórico
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

  // Filtro de histórico
  historyFilter.addEventListener('input', () => {
    showRecipeHistory(historyFilter.value);
  });

  // Limpar histórico
  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('本当に履歴をクリアしますか？')) {
      clearRecipeHistory();
      showRecipeHistory();
      showToast('履歴をクリアしました！');
    }
  });
});
