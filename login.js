// login.js
import { auth, db, GoogleAuthProvider } from './firebase.js';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const emailLoginBtn = document.getElementById('emailLoginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const loginMsg = document.getElementById('loginMsg');

function setMsg(msg) { if (loginMsg) loginMsg.textContent = msg; }

if (emailLoginBtn) {
  emailLoginBtn.addEventListener('click', async () => {
    setMsg('');
    const email = (emailEl?.value || '').trim();
    const password = passEl?.value || '';
    if (!email || !password) { setMsg('メールとパスワードを入力してください'); return; }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'index.html';
    } catch (e) {
      setMsg(e?.message || String(e));
    }
  });
}

// Se viemos de um redirect anterior, processa o resultado
try {
  const rr = await getRedirectResult(auth);
  if (rr && rr.user) {
    const u = rr.user;
    try {
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid,
        name: u.displayName || '',
        email: u.email || '',
        photoURL: u.photoURL || '',
        role: 'user',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { console.warn('Firestore user save failed:', e); }
    window.location.href = 'index.html';
  }
} catch {}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    setMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      try {
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          photoURL: u.photoURL || '',
          role: 'user',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore user save failed:', e);
      }
      window.location.href = 'index.html';
    } catch (e) {
      // Fallback para mobile: redirecionamento (popup pode ser bloqueado)
      try {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } catch (er) {
        setMsg(er?.message || String(er));
      }
    }
  });
}

// Redireciona automaticamente se já estiver logado (robusto para mobile/redirect)
onAuthStateChanged(auth, (user) => {
  if (user) {
    try { window.location.href = 'index.html'; } catch {}
  }
});


