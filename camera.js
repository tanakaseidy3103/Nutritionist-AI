// camera.js

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
// REMOVE select de câmeras se existir
const oldCameraSelect = document.getElementById('camera-select');
if (oldCameraSelect) oldCameraSelect.remove();

// Botão para alternar entre frontal/traseira
let switchBtn = document.getElementById('switch-btn');
if (!switchBtn) {
  switchBtn = document.createElement('button');
  switchBtn.id = 'switch-btn';
  switchBtn.textContent = '🔄 カメラ切り替え';
  switchBtn.style.marginRight = '8px';
  document.getElementById('camera-area').prepend(switchBtn);
}

let facingMode = 'user';
let currentStream = null;

async function startCameraWithFacingMode(newFacingMode) {
  facingMode = newFacingMode;
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  try {
    const constraints = { video: { facingMode } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;
  } catch (err) {
    alert('カメラにアクセスできません: ' + err.message);
  }
}

switchBtn.addEventListener('click', () => {
  const nextMode = facingMode === 'user' ? 'environment' : 'user';
  startCameraWithFacingMode(nextMode);
});

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

window.addEventListener('DOMContentLoaded', () => {
  startCameraWithFacingMode(facingMode);
});

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

const uploadInput = document.getElementById('upload-image');
if (uploadInput) {
  uploadInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      video.style.display = 'none';
      if (captureBtn) captureBtn.style.display = 'none';
      if (retakeBtn) retakeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });
}