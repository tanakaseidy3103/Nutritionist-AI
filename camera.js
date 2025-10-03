// camera.js

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

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
  return canvas.toDataURL('image/jpeg');
}

window.addEventListener('DOMContentLoaded', startCamera);

// Exportar função para uso externo
window.captureImage = captureImage;
