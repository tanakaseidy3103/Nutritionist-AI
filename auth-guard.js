// auth-guard.js
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

const appRoot = document.getElementById('app-root');

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (appRoot) appRoot.style.display = 'block';
  } else {
    try { window.location.href = 'login.html'; } catch {}
  }
});


