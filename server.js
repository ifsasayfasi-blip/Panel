const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'cemile_ultra_premium_secret', resave: false, saveUninitialized: true }));

// --- VERDİĞİN KEYLER VE API ---
const SITE_KEY = '0x4AAAAAADNVZyxZQRYTpzET';
const SECRET_KEY = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_BASE = 'https://apilerimya.onrender.com';

let queryLogs = [];

// --- TASARIM ŞABLONU (Siyah-Kırmızı-Mavi Premium) ---
const layout = (content) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }
        .premium-card { border: 1px solid; border-image: linear-gradient(45deg, #ff0000, #0044ff) 1; background: #050505; transition: 0.3s; }
        .premium-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(255,0,0,0.1); }
        .input-dark { background: #000; border: 1px solid #222; color: #fff; font-size: 0.8rem; }
        .input-dark:focus { border-color: #ff0000; outline: none; }
        .btn-glow { background: linear-gradient(90deg, #990000, #003399); font-weight: 800; font-size: 0.7rem; letter-spacing: 1px; }
    </style>
</head>
<body class="p-6">${content}</body>
</html>`;

// --- ANA PANEL (TÜM ENDPOİNTLER İÇİN BUTONLAR) ---
app.get('/', (req, res) => {
    const endpoints = [
        { name: 'Ad Soyad İl', path: 'adsoyad', fields: ['ad', 'soyad', 'il'] },
        { name: 'TC Sorgu', path: 'tc', fields: ['tc'] },
        { name: 'GSM Sorgu', path: 'gsm', fields: ['gsm'] },
        { name: 'Aile Sorgu', path: 'aile', fields: ['tc'] },
        { name: 'Sülale Sorgu', path: 'sulale', fields: ['tc'] },
        { name: 'Adres Sorgu', path: 'adres', fields: ['tc'] },
        { name: 'TC'den GSM', path: 'tcgsm', fields: ['tc'] },
        { name: 'GSM'den TC', path: 'gsmtc', fields: ['gsm'] },
        { name: 'Plaka Sorgu', path: 'plaka', fields: ['plaka'] },
        { name: 'Tapu Sorgu', path: 'tapu', fields: ['tc'] }
    ];

    let cardsHtml = endpoints.map(ep => `
        <div class="premium-card p-5 flex flex-col justify-between">
            <div>
                <h3 class="text-red-600 font-black italic mb-4 uppercase text-xs tracking-tighter underline decoration-blue-600">${ep.name}</h3>
                <form action="/query/${ep.path}" method="POST" class="space-y-2">
                    ${ep.fields.map(f => `<input type="text" name="${f}" placeholder="${f.toUpperCase()}" class="w-full input-dark p-2 rounded" required>`).join('')}
                    <button class="w-full btn-glow py-2 rounded mt-2 hover:opacity-80 uppercase transition">Sorguyu Başlat</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(layout(`
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-12 border-b border-zinc-900 pb-4">
                <h1 class="text-3xl font-black italic"><span class="text-red-600 font-serif">CEMİLE</span> <span class="text-blue-600">PREMIUM V3</span></h1>
                <div class="space-x-4">
                    <a href="/admin" class="text-[10px] text-zinc-500 hover:text-white uppercase">Admin Panel</a>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${cardsHtml}
            </div>
        </div>
    `));
});

// --- DİNAMİK SORGULAMA MOTORU ---
app.post('/query/:endpoint', async (req, res) => {
    const endpoint = req.params.endpoint;
    const data = req.body;
    
    try {
        const response = await axios.get(`${API_BASE}/${endpoint}`, { params: data });
        const results = response.data;
        
        queryLogs.push({ user: "Misafir", action: endpoint.toUpperCase(), params: JSON.stringify(data), time: new Date().toLocaleString() });

        let resultsHtml = results.length > 0 ? results.map((item, i) => `
            <div class="premium-card p-6 mb-4 border-l-4 border-blue-600">
                <div class="flex justify-between mb-4">
                    <span class="bg-red-600 text-[10px] px-2 py-1 font-bold">KAYIT NO: ${i+1}</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${Object.entries(item).map(([k, v]) => `
                        <div>
                            <p class="text-[9px] text-zinc-500 uppercase font-bold">${k}</p>
                            <p class="text-sm font-semibold">${v || '-'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('') : '<p class="text-red-500 font-bold text-center">HİÇBİR VERİ BULUNAMADI.</p>';

        res.send(layout(`
            <div class="max-w-5xl mx-auto py-10">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-xl font-bold text-blue-500 italic uppercase">Sorgu Sonucu: ${endpoint}</h2>
                    <a href="/" class="bg-white text-black px-4 py-2 text-[10px] font-bold">GERİ DÖN</a>
                </div>
                ${resultsHtml}
            </div>
        `));
    } catch (e) {
        res.send(layout(`<div class="text-center py-20"><p class="text-red-600 font-bold">API HATASI! Uç nokta (${endpoint}) yanıt vermiyor.</p><a href="/" class="underline text-xs">Dön</a></div>`));
    }
});

// --- ADMIN VE LOGIN ---
app.get('/login', (req, res) => {
    res.send(layout(`
    <div class="h-screen flex items-center justify-center">
        <div class="premium-card p-10 w-full max-w-sm">
            <h2 class="text-2xl font-black text-center mb-8 text-red-600">YÖNETİCİ GİRİŞİ</h2>
            <form action="/login" method="POST" class="space-y-4">
                <input type="text" name="user" placeholder="admin" class="w-full input-dark p-3 rounded">
                <input type="password" name="pass" placeholder="admin123" class="w-full input-dark p-3 rounded">
                <div class="flex justify-center"><div class="cf-turnstile" data-sitekey="${SITE_KEY}"></div></div>
                <button class="w-full btn-glow py-3 rounded text-white uppercase">Sistemi Aç</button>
            </form>
        </div>
    </div>`));
});

app.post('/login', async (req, res) => {
    const { user, pass, 'cf-turnstile-response': token } = req.body;
    const verify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', { secret: SECRET_KEY, response: token });
    if (verify.data.success && user === 'admin' && pass === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else { res.send("Hatalı Giriş!"); }
});

app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    const logs = queryLogs.reverse().map(l => `<div class="p-2 border-b border-zinc-900 text-[10px]"><span class="text-red-600 font-bold">[${l.time}]</span> ${l.action} -> ${l.params}</div>`).join('');
    res.send(layout(`
        <div class="max-w-5xl mx-auto">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold italic text-blue-500">SİSTEM LOGLARI</h1>
                <a href="/" class="text-xs">Ana Sayfa</a>
            </div>
            <div class="bg-zinc-950 border border-zinc-900 p-4 h-[500px] overflow-y-auto font-mono">${logs || 'Henüz kayıt yok.'}</div>
        </div>
    `));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cemile Premium V3 Aktif: ${PORT}`));
         
