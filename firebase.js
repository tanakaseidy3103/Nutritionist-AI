// firebase.js (ES Module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getAnalytics, isSupported as analyticsSupported } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js';

// Para produção, esses valores são públicos no cliente por design do Firebase.
// Em backends use variáveis de ambiente. Aqui seguimos com o config fornecido.
const firebaseConfig = {
  apiKey: 'AIzaSyAVqgzCPEfBqqWkW8vnp4SbwBQ84spZ4fc',
  authDomain: 'web-recipe-app.firebaseapp.com',
  projectId: 'web-recipe-app',
  storageBucket: 'web-recipe-app.firebasestorage.app',
  messagingSenderId: '28673939969',
  appId: '1:28673939969:web:580df4e0c15ae114293e00',
  measurementId: 'G-NMWJ0JE7J3'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics = null;
try {
  analyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
} catch {}

export { app, auth, db, analytics, GoogleAuthProvider };


