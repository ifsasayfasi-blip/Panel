const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

// --- TEMEL YAPILANDIRMA ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'cemile_v3_ultra_secure_key_99',
    resave: false,
    saveUninitialized: true
}));

// Senin verdiğin Cloudflare ve API bilgileri
const SITE_KEY = '0x4AAAAAADNVZyxZQRYTpzET';
const SECRET_KEY = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_BASE = 'https://apilerimya.onrender.com';

let queryLogs = []; // Admin panel logları

// --- PREMIUM TASARIM MOTORU ---
const layout = (content) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;600&display=swap" rel="stylesheet">
    <style>
        body { background-color: #030303; color: #ffffff; font-family: 'Inter', sans-serif; }
        .premium-font { font-family: 'Orbitron', sans-serif; }
        .premium-card { 
            background: linear-gradient(145deg, #0a0a0a, #111);
            border: 1px solid rgba(255, 0, 0, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            transition: all 0.4s ease;
        }
        .premium-card:hover { 
            border-color: #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
            transform: translateY(-5px);
        }
        .btn-gradient {
            background: linear-gradient(90deg, #b91c1c 0%, #1d4ed8 100%);
            transition: 0.3s;
            text-transform: uppercase;
            font-weight: 900;
            letter-spacing: 1px;
        }
        .btn-gradient:hover { opacity: 0.8; filter: brightness(1.2); }
        input { background: #000 !important; border: 1px solid #222 !important; color: white !important; }
        input:focus { border-color: #b91c1c !important; outline: none; }
    </style>
</head>
<body class="min-h-screen pb-20">${content}</body>
</html>`;

// --- ENDPOINT TANIMLARI (Tüm API'yi Kapsayan) ---
const endpoints = [
    { name: "Ad Soyad İl Sorgu", path: "adsoyad", fields: ["ad", "soyad", "il"], color: "red" },
    { name: "TC Kimlik Sorgu", path: "tc", fields: ["tc"], color: "blue" },
    { name: "GSM No Sorgu", path: "gsm", fields: ["gsm"], color: "red" },
    { name: "Adres Sorgu", path: "adres", fields: ["tc"], color: "blue" },
    { name: "Aile Sorgusu", path: "aile", fields: ["tc"], color: "red" },
    { name: "Sülale Sorgusu", path: "sulale", fields: ["tc"], color: "blue" },
    { name: "TC'den GSM Bul", path: "tcgsm", fields: ["tc"], color: "red" },
    { name: "GSM'den TC Bul", path: "gsmtc", fields: ["gsm"], color: "blue" },
    { name: "Plaka Sorgu", path: "plaka", fields: ["plaka"], color: "red" },
    { name: "Tapu Sorgu", path: "tapu", fields: ["tc"], color: "blue" },
    { name: "İşyeri Sorgu", path: "isyeri", fields: ["tc"], color: "red" }
];

// --- YOLLAR (ROUTES) ---

// 1. Ana Panel
app.get('/', (req, res) => {
    let cards = endpoints.map(ep => `
        <div class="premium-card p-6 rounded-lg">
            <h3 class="premium-font text-xs font-black mb-4 text-${ep.color}-500 uppercase tracking-widest">${ep.name}</h3>
            <form action="/query/${ep.path}" method="POST" class="space-y-3">
                ${ep.fields.map(f => `<input type="text" name="${f}" placeholder="${f.toUpperCase()}" class="w-full p-2 text-xs rounded" required>`).join('')}
                <button type="submit" class="w-full btn-gradient py-2 rounded text-[10px]">Sorguyu Başlat</button>
            </form>
        </div>
    `).join('');

    const content = `
    <div class="max-w-7xl mx-auto px-6 pt-16">
        <div class="flex justify-between items-end mb-12">
            <div>
                <h1 class="premium-font text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600">PREMIUM HUB</h1>
                <p class="text-zinc-500 text-xs mt-2 tracking-[0.4em]">ADVANCED DATA MANAGEMENT SYSTEM</p>
            </div>
            <a href="/login" class="bg-zinc-900 border border-zinc-800 px-6 py-2 text-[10px] font-bold hover:bg-white hover:text-black transition uppercase">Admin Panel</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            ${cards}
        </div>
    </div>`;
    res.send(layout(content));
});

// 2. Sorgu İşlemi
app.post('/query/:path', async (req, res) => {
    const path = req.params.path;
    const data = req.body;
    try {
        const response = await axios.get(`${API_BASE}/${path}`, { params: data });
        const results = response.data;
        
        queryLogs.push({ user: "Misafir", type: path.toUpperCase(), detail: JSON.stringify(data), date: new Date().toLocaleString() });

        let resultsHtml = results && results.length > 0 ? results.map((item, i) => `
            <div class="premium-card p-6 mb-4 border-l-4 border-blue-600 animate-in fade-in duration-500">
                <div class="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <span class="premium-font text-red-600 font-black italic">KAYIT NO #0${i + 1}</span>
                    <span class="text-[10px] text-zinc-600 font-mono">STATUS: VERIFIED</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    ${Object.entries(item).map(([k, v]) => `
                        <div>
                            <p class="text-[9px] text-zinc-500 uppercase font-black tracking-tighter">${k}</p>
                            <p class="text-sm font-semibold text-zinc-200">${v || 'BULUNAMADI'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('') : `<div class="text-center py-20 premium-card"><h2 class="premium-font text-red-600">VERİ BULUNAMADI</h2><p class="text-zinc-500 text-xs mt-2">Aradığınız kriterlere uygun kayıt sistemde mevcut değil.</p></div>`;

        res.send(layout(`
            <div class="max-w-5xl mx-auto py-16 px-6">
                <div class="flex justify-between items-center mb-10">
                    <h2 class="premium-font text-2xl font-black italic text-blue-500 uppercase">Sorgu Sonuçları</h2>
                    <a href="/" class="btn-gradient px-8 py-2 rounded text-xs">YENİ SORGU</a>
                </div>
                ${resultsHtml}
            </div>`));
    } catch (e) {
        res.send(layout(`<div class="h-screen flex items-center justify-center text-center"><div><h1 class="text-5xl text-red-600 premium-font mb-4">API ERROR</h1><p class="text-zinc-500 mb-8 font-mono">Sunucu ile bağlantı kurulamadı.</p><a href="/" class="underline text-xs">ANA SAYFAYA DÖN</a></div></div>`));
    }
});

// 3. Login
app.get('/login', (req, res) => {
    res.send(layout(`
    <div class="h-screen flex items-center justify-center p-6">
        <div class="premium-card p-10 w-full max-w-md">
            <h2 class="premium-font text-3xl font-black text-center mb-8 text-red-600 italic">SYSTEM ACCESS</h2>
            <form action="/login" method="POST" class="space-y-6">
                <input type="text" name="user" placeholder="USERNAME" class="w-full p-4 rounded" required>
                <input type="password" name="pass" placeholder="PASSWORD" class="w-full p-4 rounded" required>
                <div class="flex justify-center py-2">
                    <div class="cf-turnstile" data-sitekey="${SITE_KEY}"></div>
                </div>
                <button type="submit" class="w-full btn-gradient py-4 rounded text-sm">AUTHENTICATE</button>
            </form>
        </div>
    </div>`));
});

app.post('/login', async (req, res) => {
    const { user, pass, 'cf-turnstile-response': token } = req.body;
    try {
        const verify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', { secret: SECRET_KEY, response: token });
        if (verify.data.success && user === 'admin' && pass === 'admin123') {
            req.session.isAdmin = true;
            return res.redirect('/admin');
        }
        res.send("<h1>Giriş Reddedildi.</h1><a href='/login'>Geri</a>");
    } catch (e) { res.status(500).send("Hata"); }
});

// 4. Admin Panel
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const logRows = queryLogs.reverse().map(l => `
        <tr class="border-b border-zinc-900 hover:bg-zinc-950 transition">
            <td class="p-4 text-blue-500 font-mono text-[10px]">${l.date}</td>
            <td class="p-4 text-red-600 font-black text-[10px] italic">${l.type}</td>
            <td class="p-4 text-zinc-400 text-[10px] truncate max-w-xs">${l.detail}</td>
        </tr>
    `).join('');

    res.send(layout(`
        <div class="max-w-6xl mx-auto py-20 px-6">
            <h1 class="premium-font text-3xl font-black mb-10 text-red-600 italic border-b border-red-900 pb-4">LOG MANAGEMENT</h1>
            <div class="premium-card overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-zinc-900 text-[10px] font-black text-zinc-500 uppercase">
                        <tr><th class="p-4">Tarih</th><th class="p-4">İşlem</th><th class="p-4">Detay</th></tr>
                    </thead>
                    <tbody>${logRows || '<tr><td colspan="3" class="p-10 text-center text-zinc-700">HENÜZ KAYIT YOK</td></tr>'}</tbody>
                </table>
            </div>
            <div class="mt-8 text-right"><a href="/" class="text-xs text-zinc-600 hover:text-white uppercase font-bold tracking-widest">Sistemden Çıkış</a></div>
        </div>`));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cemile Premium V3.1 - Port: ${PORT}`));
      
