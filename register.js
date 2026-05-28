// register.js
import { auth, db, GoogleAuthProvider } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');
const registerMsg = document.getElementById('registerMsg');

function setMsg(msg) { if (registerMsg) registerMsg.textContent = msg; }

async function ensureUserDoc(user, extra = {}) {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: user.displayName || extra.name || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: 'user',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
}

if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    setMsg('');
    const name = (nameEl?.value || '').trim();
    const email = (emailEl?.value || '').trim();
    const password = passEl?.value || '';
    if (!email || !password) { setMsg('メールとパスワードを入力してください'); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        try { await updateProfile(cred.user, { displayName: name }); } catch {}
      }
      try { await ensureUserDoc(cred.user, { name }); } catch (e) { console.warn('Firestore user save failed:', e); }
      window.location.href = 'index.html';
    } catch (e) {
      setMsg(e?.message || String(e));
    }
  });
}

// Processa retorno de redirect, se houver
try {
  const rr = await getRedirectResult(auth);
  if (rr && rr.user) {
    try { await ensureUserDoc(rr.user); } catch (e) { console.warn('Firestore user save failed:', e); }
    window.location.href = 'index.html';
  }
} catch {}

if (googleRegisterBtn) {
  googleRegisterBtn.addEventListener('click', async () => {
    setMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      try { await ensureUserDoc(result.user); } catch (e) { console.warn('Firestore user save failed:', e); }
      window.location.href = 'index.html';
    } catch (e) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (er) {
        setMsg(er?.message || String(er));
      }
    }
  });
}


