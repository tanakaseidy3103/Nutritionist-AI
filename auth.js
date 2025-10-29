// auth.js (ES Module)
import { auth, db, GoogleAuthProvider } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const loginBtn = document.getElementById('loginButton');
const logoutBtn = document.getElementById('logoutButton');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');

function showLoggedOutUI() {
  if (loginBtn) loginBtn.style.display = 'inline-block';
  if (logoutBtn) logoutBtn.style.display = 'none';
  if (userInfo) userInfo.style.display = 'none';
}

function showLoggedInUI(user) {
  if (loginBtn) loginBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  if (userInfo) userInfo.style.display = 'inline-flex';
  if (userName) userName.textContent = user.displayName || user.email || user.uid;
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInUI(user);
  } else {
    showLoggedOutUI();
  }
});

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      // Salvar/atualizar usuário no Firestore
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid,
        name: u.displayName || '',
        email: u.email || '',
        photoURL: u.photoURL || '',
        role: 'user',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
      window.showToast && window.showToast('ログインしました');
    } catch (e) {
      alert('ログインに失敗しました: ' + (e?.message || e));
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.showToast && window.showToast('ログアウトしました');
    } catch (e) {
      alert('ログアウトに失敗しました: ' + (e?.message || e));
    }
  });
}


