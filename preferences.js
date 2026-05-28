// preferences.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const modal = document.getElementById('prefs-modal');
const openBtn = document.getElementById('open-prefs-btn');
const closeBtn = document.getElementById('close-prefs');
const saveBtn = document.getElementById('save-prefs-btn');
const dislikesEl = document.getElementById('prefs-dislikes');
const allergiesEl = document.getElementById('prefs-allergies');
const calorieEl = document.getElementById('prefs-calorie');

let currentUid = null;

function showModal(show) { if (modal) modal.style.display = show ? 'flex' : 'none'; }

async function loadUserPrefs(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.exists() ? snap.data() : {};
    const prefs = data.preferences || {};
    if (dislikesEl) dislikesEl.value = (prefs.dislikes || []).join(', ');
    if (allergiesEl) allergiesEl.value = (prefs.allergies || []).join(', ');
    if (calorieEl) calorieEl.value = prefs.calorieTarget || '';
  } catch {}
}

async function saveUserPrefs() {
  if (!currentUid) return;
  const dislikes = (dislikesEl?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const allergies = (allergiesEl?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const calorieTarget = (calorieEl?.value || '').trim();
  try {
    await setDoc(doc(db, 'users', currentUid), {
      preferences: { dislikes, allergies, calorieTarget },
      updatedAt: serverTimestamp()
    }, { merge: true });
    window.showToast && window.showToast('保存しました');
    showModal(false);
  } catch (e) {
    alert('保存に失敗しました: ' + (e?.message || e));
  }
}

onAuthStateChanged(auth, (user) => {
  currentUid = user?.uid || null;
  if (user) loadUserPrefs(user.uid);
});

openBtn && openBtn.addEventListener('click', () => showModal(true));
closeBtn && closeBtn.addEventListener('click', () => showModal(false));
saveBtn && saveBtn.addEventListener('click', saveUserPrefs);

// Expose getter for other modules
window.getUserPreferences = async function() {
  try {
    const user = auth.currentUser;
    if (!user) return { dislikes: [], allergies: [], calorieTarget: '' };
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    return data.preferences || { dislikes: [], allergies: [], calorieTarget: '' };
  } catch {
    return { dislikes: [], allergies: [], calorieTarget: '' };
  }
}


