const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'premium_ultra_v4',
    resave: false,
    saveUninitialized: true
}));

const SITE_KEY = '0x4AAAAAADNVZyxZQRYTpzET';
const SECRET_KEY = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_BASE = 'https://apilerimya.onrender.com';

let queryLogs = [];

// --- DİNAMİK TASARIM ŞABLONU ---
const layout = (content, title = "PREMIUM PANEL") => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        body { background: #000; color: #fff; font-family: 'Segoe UI', sans-serif; }
        .premium-card { background: #0a0a0a; border: 1px solid #1a1a1a; transition: 0.3s; }
        .premium-card:hover { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }
        .btn-red { background: linear-gradient(90deg, #7f1d1d, #450a0a); border: 1px solid #991b1b; }
        .btn-blue { background: linear-gradient(90deg, #1e3a8a, #1e1b4b); border: 1px solid #1e40af; }
        input { background: #000 !important; border: 1px solid #333 !important; color: #fff !important; outline: none; }
        input:focus { border-color: #ef4444 !important; }
    </style>
    <title>${title}</title>
</head>
<body class="min-h-screen bg-black text-white p-6 md:p-12">${content}</body>
</html>`;

// --- AUTH MIDDLEWARE ---
const isAuth = (req, res, next) => {
    if (req.session.isLoggedIn) return next();
    res.redirect('/login');
};

// --- ROUTES ---

// 1. GİRİŞ & KAYIT SAYFASI (Aynı sayfa)
app.get('/login', (req, res) => {
    res.send(layout(`
    <div class="max-w-md mx-auto mt-20">
        <div class="premium-card p-10 rounded-2xl border-t-4 border-t-red-600">
            <h2 class="text-3xl font-black mb-8 text-center italic tracking-widest text-red-600 uppercase">SISTEM GIRIŞI</h2>
            <form action="/login" method="POST" class="space-y-6">
                <div><label class="text-[10px] text-zinc-500 uppercase font-bold">Kullanıcı Adı</label>
                <input type="text" name="user" class="w-full p-4 rounded mt-1" placeholder="admin"></div>
                <div><label class="text-[10px] text-zinc-500 uppercase font-bold">Şifre</label>
                <input type="password" name="pass" class="w-full p-4 rounded mt-1" placeholder="admin123"></div>
                
                <div class="flex justify-center py-2">
                    <div class="cf-turnstile" data-sitekey="${SITE_KEY}"></div>
                </div>
                <button type="submit" class="w-full btn-red py-4 rounded font-black uppercase hover:scale-105 transition">Giriş / Kayıt Yap</button>
            </form>
            <p class="text-[9px] text-zinc-700 mt-6 text-center italic uppercase tracking-widest">Premium Database Security Verified</p>
        </div>
    </div>`));
});

app.post('/login', async (req, res) => {
    const { user, pass, 'cf-turnstile-response': token } = req.body;
    const verify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', { secret: SECRET_KEY, response: token });
    
    // İstediğin admin/admin123 kontrolü
    if (verify.data.success && user === 'admin' && pass === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/dashboard');
    } else {
        res.send("<h1>GİRİŞ BAŞARISIZ! Bilgiler yanlış veya robot doğrulaması geçilemedi.</h1><a href='/login'>Geri Dön</a>");
    }
});

// 2. DASHBOARD (Sorgu Seçme Ekranı)
app.get('/dashboard', isAuth, (req, res) => {
    const menus = [
        { name: "AD SOYAD İL", path: "adsoyad", desc: "İsimden detaylı adres/bilgi sorgu", icon: "👤" },
        { name: "TC SORGULAMA", path: "tc", desc: "TC Kimlik no ile tüm detaylar", icon: "🆔" },
        { name: "GSM SORGULAMA", path: "gsm", desc: "Telefon numarası ile veri çekme", icon: "📱" },
        { name: "AİLE SORGUSU", path: "aile", desc: "Aile ve sülale ağacı dökümü", icon: "👪" },
        { name: "ADRES SORGUSU", path: "adres", desc: "TC ile güncel adres bulma", icon: "🏠" },
        { name: "ADMİN LOGLARI", path: "admin", desc: "Tüm sorgu geçmişini gör", icon: "🛡️" }
    ];

    let menuHtml = menus.map(m => `
        <a href="${m.path === 'admin' ? '/admin' : '/sorgu/' + m.path}" class="premium-card p-8 rounded-xl flex flex-col items-center text-center hover:bg-zinc-900 group">
            <span class="text-4xl mb-4 group-hover:scale-110 transition">${m.icon}</span>
            <h3 class="font-black text-red-600 mb-2 uppercase">${m.name}</h3>
            <p class="text-zinc-500 text-[10px] uppercase">${m.desc}</p>
        </a>
    `).join('');

    res.send(layout(`
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-16 border-b border-zinc-900 pb-8">
                <h1 class="text-4xl font-black italic tracking-tighter">PREMIUM <span class="text-red-600">DASHBOARD</span></h1>
                <a href="/logout" class="text-xs text-zinc-500 hover:text-white uppercase font-bold">Oturumu Kapat</a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${menuHtml}
            </div>
        </div>
    `));
});

// 3. SORGULAMA SAYFASI (Formların olduğu yer)
app.get('/sorgu/:type', isAuth, (req, res) => {
    const type = req.params.type;
    let inputs = "";
    if (type === "adsoyad") {
        inputs = `
        <input type="text" name="ad" placeholder="AD" class="w-full p-4 rounded mb-4" required>
        <input type="text" name="soyad" placeholder="SOYAD" class="w-full p-4 rounded mb-4" required>
        <input type="text" name="il" placeholder="İL" class="w-full p-4 rounded mb-4" required>`;
    } else if (type === "gsm") {
        inputs = `<input type="text" name="gsm" placeholder="5xx xxx xxxx" class="w-full p-4 rounded mb-4" required>`;
    } else {
        inputs = `<input type="text" name="tc" placeholder="11 HANELİ TC" class="w-full p-4 rounded mb-4" required>`;
    }

    res.send(layout(`
        <div class="max-w-2xl mx-auto py-10">
            <a href="/dashboard" class="text-blue-500 text-xs font-bold underline">← PANELE DÖN</a>
            <div class="premium-card p-10 mt-6 rounded-2xl">
                <h2 class="text-2xl font-black text-red-600 mb-6 italic uppercase underline underline-offset-8 decoration-blue-600">${type} SORGULAMA</h2>
                <form action="/api-sorgu/${type}" method="POST">
                    ${inputs}
                    <button class="w-full btn-blue py-4 rounded font-black uppercase mt-4">Sorguyu Gönder</button>
                </form>
            </div>
        </div>
    `));
});

// 4. API ÇALIŞTIRMA VE SONUÇ (Hataları gideren bölüm)
app.post('/api-sorgu/:type', isAuth, async (req, res) => {
    const type = req.params.type;
    const bodyData = req.body;
    try {
        const response = await axios.get(`${API_BASE}/${type}`, { params: bodyData });
        let rawData = response.data;
        
        // SONUÇ ÇIKMAMA SORUNUNU ÇÖZEN MANTIK: 
        // Eğer data array değilse array'e çeviriyoruz ki döngü çalışsın
        let finalResults = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

        queryLogs.push({ user: "Admin", type: type.toUpperCase(), detail: JSON.stringify(bodyData), time: new Date().toLocaleString() });

        let resultsHtml = finalResults.map((item, i) => `
            <div class="premium-card p-6 mb-6 rounded-lg border-l-4 border-red-600">
                <div class="flex justify-between mb-4 border-b border-zinc-900 pb-2">
                    <span class="text-blue-500 font-black italic uppercase text-xs tracking-widest">Kayıt #${i+1}</span>
                    <span class="text-[9px] text-zinc-700 uppercase font-mono">Verified Result</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    ${Object.entries(item).map(([k, v]) => `
                        <div>
                            <p class="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">${k}</p>
                            <p class="text-sm font-bold text-zinc-100">${v || 'N/A'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        res.send(layout(`
            <div class="max-w-4xl mx-auto py-10">
                <div class="flex justify-between mb-8">
                    <h2 class="text-xl font-black italic text-red-600 uppercase tracking-widest">VERİ ANALİZİ TAMAMLANDI</h2>
                    <a href="/sorgu/${type}" class="bg-white text-black px-4 py-2 text-[10px] font-bold">YENİ SORGULAMA</a>
                </div>
                ${resultsHtml || '<p class="text-center py-20 text-red-500 font-bold uppercase">Sistemde eşleşen veri bulunamadı.</p>'}
            </div>`));
    } catch (e) {
        res.send(layout(`<div class="text-center p-20"><h1 class="text-red-600 font-bold mb-4">API BAĞLANTI HATASI</h1><a href="/dashboard">Geri Dön</a></div>`));
    }
});

// 5. ADMİN LOGLARI
app.get('/admin', isAuth, (req, res) => {
    const logs = queryLogs.reverse().map(l => `
        <div class="p-3 border-b border-zinc-900 flex justify-between text-[10px]">
            <span class="text-blue-500 font-mono italic">[${l.time}]</span>
            <span class="text-red-600 font-black">${l.type}</span>
            <span class="text-zinc-600 truncate max-w-xs">${l.detail}</span>
        </div>
    `).join('');
    res.send(layout(`
        <div class="max-w-5xl mx-auto">
            <div class="flex justify-between items-center mb-10 border-b border-red-600 pb-4">
                <h1 class="text-3xl font-black italic">ADMİN <span class="text-red-600">LOGS</span></h1>
                <a href="/dashboard" class="text-xs">Panele Dön</a>
            </div>
            <div class="premium-card p-4 rounded-xl max-h-[600px] overflow-y-auto">${logs || 'Henüz log yok.'}</div>
        </div>
    `));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });
app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cemile V4 - Ready on ${PORT}`));
          
