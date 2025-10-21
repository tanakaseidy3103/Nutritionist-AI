// camera.js

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert('カメラにアクセスできません: ' + err.message);
  }
}

function captureImage() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg');
  preview.src = dataUrl;
  preview.style.display = 'block';
  video.style.display = 'none';
  captureBtn && (captureBtn.style.display = 'none');
  retakeBtn && (retakeBtn.style.display = 'inline-block');
  return dataUrl;
}

window.addEventListener('DOMContentLoaded', startCamera);

// Exportar função para uso externo
window.captureImage = captureImage;

// Suporte a botões de captura/refazer
if (captureBtn) {
  captureBtn.addEventListener('click', () => {
    captureImage();
  });
}
if (retakeBtn) {
  retakeBtn.addEventListener('click', () => {
    preview.style.display = 'none';
    video.style.display = 'block';
    retakeBtn.style.display = 'none';
    captureBtn.style.display = 'inline-block';
  });
}
