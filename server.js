const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

// --- AYARLAR ---
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'premium_ultra_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Senin verdiğin anahtarlar ve API
const SITE_KEY = '0x4AAAAAADNVZyxZQRYTpzET';
const SECRET_KEY = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_BASE = 'https://apilerimya.onrender.com';

let queryLogs = [];

// --- GÖRÜNÜM ŞABLONLARI (Tek dosyada birleştirmek için fonksiyon) ---
const layout = (content) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        body { background: #050505; color: #fff; font-family: 'sans-serif'; }
        .premium-glow { border: 1px solid; border-image: linear-gradient(to right, #ff0000, #0066ff) 1; box-shadow: 0 0 15px rgba(255,0,0,0.1); }
        .btn-premium { background: linear-gradient(90deg, #cc0000, #0044cc); transition: 0.3s; }
        .btn-premium:hover { opacity: 0.8; transform: scale(1.02); }
    </style>
</head>
<body class="min-h-screen">${content}</body>
</html>`;

// --- ROUTER ---

// 1. Ana Sorgu Sayfası
app.get('/', (req, res) => {
    const content = `
    <div class="max-w-5xl mx-auto py-16 px-4">
        <h1 class="text-5xl font-black text-center mb-12 italic tracking-tighter">
            <span class="text-red-600">PREMIUM</span> <span class="text-blue-600">DATABASE</span>
        </h1>
        <div class="premium-glow p-8 bg-zinc-950 rounded-lg">
            <form action="/search" method="POST" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" name="ad" placeholder="AD" class="bg-black border border-zinc-800 p-4 outline-none focus:border-red-600">
                <input type="text" name="soyad" placeholder="SOYAD" class="bg-black border border-zinc-800 p-4 outline-none focus:border-red-600">
                <input type="text" name="il" placeholder="İL" class="bg-black border border-zinc-800 p-4 outline-none focus:border-blue-600">
                <button type="submit" class="btn-premium font-bold uppercase tracking-widest">Sorgula</button>
            </form>
        </div>
        <div id="results" class="mt-10"></div>
    </div>`;
    res.send(layout(content));
});

// 2. Login Sayfası
app.get('/login', (req, res) => {
    const content = `
    <div class="flex items-center justify-center h-screen">
        <div class="w-full max-w-md p-8 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
            <h2 class="text-3xl font-bold mb-8 text-center text-blue-500 italic">ADMIN PANEL</h2>
            <form action="/login" method="POST" class="space-y-6">
                <input type="text" name="username" placeholder="Admin" class="w-full p-4 bg-black border border-zinc-800 rounded">
                <input type="password" name="password" placeholder="admin123" class="w-full p-4 bg-black border border-zinc-800 rounded">
                <div class="flex justify-center">
                    <div class="cf-turnstile" data-sitekey="${SITE_KEY}"></div>
                </div>
                <button type="submit" class="w-full py-4 btn-premium font-black rounded uppercase">Giriş Yap</button>
            </form>
        </div>
    </div>`;
    res.send(layout(content));
});

// 3. Login POST (Cloudflare Secret ile Doğrulama)
app.post('/login', async (req, res) => {
    const { username, password, 'cf-turnstile-response': token } = req.body;
    try {
        const verify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            secret: SECRET_KEY,
            response: token
        });
        if (verify.data.success && username === 'admin' && password === 'admin123') {
            req.session.isAdmin = true;
            return res.redirect('/admin');
        }
        res.send("Giriş Başarısız! Bilgileri veya robot doğrulamasını kontrol et.");
    } catch (e) { res.status(500).send("Doğrulama Hatası!"); }
});

// 4. Sorgu POST
app.post('/search', async (req, res) => {
    const { ad, soyad, il } = req.body;
    try {
        const response = await axios.get(`${API_BASE}/sorgu`, { params: { ad, soyad, il } });
        const results = response.data;
        queryLogs.push({ user: "Misafir", query: `${ad} ${soyad} - ${il}`, time: new Date().toLocaleString() });

        let resultHtml = results.map((item, i) => `
            <div class="bg-zinc-900 p-6 rounded-lg border-l-4 border-blue-600 mb-4">
                <span class="text-red-600 font-bold">KAYIT #${i + 1}</span>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    ${Object.entries(item).map(([k, v]) => `<div><p class="text-zinc-500 uppercase text-[10px]">${k}</p><p class="font-bold">${v}</p></div>`).join('')}
                </div>
            </div>
        `).join('');

        res.send(layout(`<div class="max-w-5xl mx-auto py-10 px-4"><a href="/" class="text-zinc-500 mb-4 block underline">← Geri Dön</a>${resultHtml}</div>`));
    } catch (e) { res.send(layout(`<div class="text-center py-20 text-red-500">API Hatası: Veri bulunamadı veya bağlantı koptu.</div>`)); }
});

// 5. Admin Panel (Sorgu Loglarını Görme)
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const logsHtml = queryLogs.reverse().map(l => `
        <div class="p-3 border-b border-zinc-800 text-xs">
            <span class="text-blue-500">[${l.time}]</span> Sorgu: <b class="text-red-500">${l.query}</b>
        </div>
    `).join('');
    
    res.send(layout(`
        <div class="p-10 max-w-4xl mx-auto">
            <h1 class="text-2xl font-bold mb-6 text-red-600 border-b border-red-600 pb-2 uppercase italic">Admin Panel - Sorgu Geçmişi</h1>
            <div class="bg-zinc-950 p-4 border border-zinc-800">${logsHtml || 'Henüz log yok.'}</div>
        </div>
    `));
});

// BAŞLAT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cemile Premium System ${PORT} üzerinde aktif!`));
              
