// voice.js

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('このブラウザは音声読み上げに対応していません。');
    return;
  }
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  window.speechSynthesis.cancel(); // Stop previous
  window.speechSynthesis.speak(utter);
}

window.speakText = speakText;
