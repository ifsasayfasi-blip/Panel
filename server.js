const express = require('express');
const axios = require('axios');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// --- SİSTEM AYARLARI ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'cemile_ultra_secret_v5_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 saatlik oturum
}));

// --- VERİTABANI SİMÜLASYONU (RAM ÜZERİNDE) ---
// Not: Railway resetlendiğinde bu veriler sıfırlanır, kalıcı olması için MongoDB gerekebilir.
let users = [{ user: "admin", pass: "admin123" }]; 
let queryLogs = [];

const API_BASE = 'https://apilerimya.onrender.com';

// --- PROFESYONEL TASARIM MOTORU ---
const layout = (content, title = "PREMIUM V5") => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;500&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root { --red: #ff0000; --blue: #0066ff; --black: #050505; }
        body { background: var(--black); color: #e0e0e0; font-family: 'Rajdhani', sans-serif; overflow-x: hidden; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(10px); border: 1px solid #1a1a1a; }
        .neon-border-red { border: 1px solid var(--red); box-shadow: 0 0 10px rgba(255, 0, 0, 0.2); }
        .neon-border-blue { border: 1px solid var(--blue); box-shadow: 0 0 10px rgba(0, 102, 255, 0.2); }
        .btn-premium { 
            background: linear-gradient(135deg, #440000 0%, #000044 100%); 
            border: 1px solid #333; transition: 0.3s; color: white; font-weight: bold;
        }
        .btn-premium:hover { border-color: var(--red); transform: scale(1.02); filter: brightness(1.2); }
        input { background: #000 !important; border: 1px solid #222 !important; color: #fff !important; font-family: 'Fira Code', monospace; }
        input:focus { border-color: var(--blue) !important; box-shadow: 0 0 5px var(--blue); outline: none; }
        .result-card { border-left: 4px solid var(--red); background: #080808; margin-bottom: 1rem; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #222; }
    </style>
    <title>${title}</title>
</head>
<body class="min-h-screen">${content}</body>
</html>`;

// --- MIDDLEWARE: OTURUM KONTROLÜ ---
const authRequired = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// --- ROUTES ---

// 1. GİRİŞ SAYFASI
app.get('/login', (req, res) => {
    res.send(layout(`
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="glass p-8 rounded-2xl w-full max-w-md neon-border-red">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-black italic tracking-tighter text-red-600">SISTEM GİRİŞİ</h1>
                <p class="text-[10px] text-zinc-500 uppercase mt-1">Authorized Personnel Only</p>
            </div>
            <form action="/login" method="POST" class="space-y-4">
                <input type="text" name="user" placeholder="Kullanıcı Adı" class="w-full p-3 rounded" required>
                <input type="password" name="pass" placeholder="Şifre" class="w-full p-3 rounded" required>
                <button type="submit" class="w-full btn-premium py-3 rounded uppercase tracking-widest text-sm">Giriş Yap</button>
            </form>
            <div class="mt-6 text-center">
                <p class="text-xs text-zinc-500">Hesabın yok mu? <a href="/register" class="text-blue-500 hover:underline">Kayıt Ol</a></p>
            </div>
        </div>
    </div>`));
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    const found = users.find(u => u.user === user && u.pass === pass);
    if (found) {
        req.session.user = user;
        return res.redirect('/dashboard');
    }
    res.send("<script>alert('Hatalı Bilgi!'); window.location='/login';</script>");
});

// 2. KAYIT SAYFASI
app.get('/register', (req, res) => {
    res.send(layout(`
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="glass p-8 rounded-2xl w-full max-w-md neon-border-blue">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-black italic tracking-tighter text-blue-600">YENİ KAYIT</h1>
                <p class="text-[10px] text-zinc-500 uppercase mt-1">Create Your Identity</p>
            </div>
            <form action="/register" method="POST" class="space-y-4">
                <input type="text" name="user" placeholder="Yeni Kullanıcı Adı" class="w-full p-3 rounded" required>
                <input type="password" name="pass" placeholder="Yeni Şifre" class="w-full p-3 rounded" required>
                <button type="submit" class="w-full btn-premium py-3 rounded uppercase tracking-widest text-sm" style="background: linear-gradient(135deg, #001144, #000)">Kayıt Ol</button>
            </form>
            <div class="mt-6 text-center">
                <a href="/login" class="text-xs text-zinc-500 hover:underline">Zaten hesabım var</a>
            </div>
        </div>
    </div>`));
});

app.post('/register', (req, res) => {
    const { user, pass } = req.body;
    if (users.find(u => u.user === user)) return res.send("Bu kullanıcı zaten var!");
    users.push({ user, pass });
    res.send("<script>alert('Başarıyla kayıt olundu!'); window.location='/login';</script>");
});

// 3. DASHBOARD (Tüm Endpointler Burada)
app.get('/dashboard', authRequired, (req, res) => {
    const apiEndpoints = [
        { name: "Ad Soyad İl", path: "adsoyad", icon: "🔍", desc: "Detaylı Kişi Sorgu" },
        { name: "TC Sorgu", path: "tc", icon: "🆔", desc: "TC'den Kimlik Bilgisi" },
        { name: "GSM Sorgu", path: "gsm", icon: "📞", desc: "Numaradan Bilgi" },
        { name: "Aile Sorgu", path: "aile", icon: "👨‍👩‍👧", desc: "Aile Ağacı Dökümü" },
        { name: "Sülale Sorgu", path: "sulale", icon: "🧬", desc: "Tam Soy Ağacı" },
        { name: "Adres Sorgu", path: "adres", icon: "📍", desc: "Güncel İkametgah" },
        { name: "TC'den GSM", path: "tcgsm", icon: "📲", desc: "TC ile Numara Bul" },
        { name: "GSM'den TC", path: "gsmtc", icon: "📟", desc: "Numaradan TC Bul" },
        { name: "Plaka Sorgu", path: "plaka", icon: "🚗", desc: "Araç Plaka Bilgi" },
        { name: "Vesikalık", path: "vesika", icon: "🖼️", desc: "Fotoğraf Sorgu" }
    ];

    const cards = apiEndpoints.map(ep => `
        <a href="/sorgu-sayfasi/${ep.path}" class="glass p-6 rounded-xl hover:bg-zinc-900 transition border-b-2 border-transparent hover:border-red-600 group">
            <div class="text-3xl mb-3">${ep.icon}</div>
            <h3 class="text-lg font-bold text-white group-hover:text-red-500 transition uppercase italic">${ep.name}</h3>
            <p class="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">${ep.desc}</p>
        </a>
    `).join('');

    res.send(layout(`
    <div class="max-w-7xl mx-auto p-8">
        <header class="flex justify-between items-center mb-16 border-b border-zinc-900 pb-6">
            <div>
                <h2 class="text-5xl font-black italic tracking-tighter text-white">CEMİLE <span class="text-red-600">PRO V5</span></h2>
                <p class="text-[10px] text-zinc-600 uppercase tracking-[0.5em]">Global Intelligence Database System</p>
            </div>
            <div class="flex items-center gap-6">
                <span class="text-xs text-zinc-400 font-mono">User: @${req.session.user}</span>
                <a href="/admin" class="text-xs text-blue-500 hover:underline">LOGS</a>
                <a href="/logout" class="bg-red-900/20 text-red-500 px-4 py-1 rounded text-xs border border-red-900/50">ÇIKIŞ</a>
            </div>
        </header>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${cards}
        </div>
    </div>`));
});

// 4. ÖZEL SORGU SAYFASI (Dinamik Inputlar)
app.get('/sorgu-sayfasi/:path', authRequired, (req, res) => {
    const path = req.params.path;
    let inputs = "";

    // MANTIKSAL INPUT ÜRETİCİ
    if (path === "adsoyad") {
        inputs = `
            <div class="space-y-4">
                <input type="text" name="ad" placeholder="AD" class="w-full p-4 rounded" required>
                <input type="text" name="soyad" placeholder="SOYAD" class="w-full p-4 rounded" required>
                <input type="text" name="il" placeholder="İL" class="w-full p-4 rounded" required>
            </div>`;
    } else if (path === "gsm" || path === "gsmtc") {
        inputs = `<input type="text" name="gsm" placeholder="GSM NO (5XXXXXXXXX)" class="w-full p-4 rounded" required>`;
    } else if (path === "plaka") {
        inputs = `<input type="text" name="plaka" placeholder="34ABC123" class="w-full p-4 rounded" required>`;
    } else {
        inputs = `<input type="text" name="tc" placeholder="11 HANELİ TC NO" class="w-full p-4 rounded" required>`;
    }

    res.send(layout(`
    <div class="max-w-2xl mx-auto py-20 px-4">
        <a href="/dashboard" class="text-zinc-600 hover:text-white text-xs mb-8 block uppercase tracking-widest">← PANELE GERİ DÖN</a>
        <div class="glass p-10 rounded-2xl neon-border-red">
            <h2 class="text-3xl font-black italic text-red-600 mb-8 uppercase tracking-tighter">${path.replace("-", " ")} ANALİZİ</h2>
            <form action="/execute-query/${path}" method="POST" class="space-y-6">
                ${inputs}
                <button type="submit" class="w-full btn-premium py-4 rounded font-black tracking-widest uppercase">VERİYİ GETİR</button>
            </form>
        </div>
    </div>`));
});

// 5. SORGULAMA VE SONUÇ MOTORU
app.post('/execute-query/:path', authRequired, async (req, res) => {
    const path = req.params.path;
    const params = req.body;

    try {
        const response = await axios.get(`${API_BASE}/${path}`, { params });
        const data = response.data;
        
        // SONUÇLARI DİZİYE ZORLA (EĞER TEK OBJE GELİRSE)
        let results = Array.isArray(data) ? data : (data ? [data] : []);

        queryLogs.push({ user: req.session.user, action: path, params: JSON.stringify(params), date: new Date().toLocaleString() });

        let resultCards = results.map((item, index) => `
            <div class="result-card p-6 glass rounded-r-lg animate-pulse-once">
                <div class="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <span class="text-red-600 font-bold text-xs uppercase">Kayıt #${index + 1}</span>
                    <span class="text-[8px] text-zinc-600 font-mono">ENCRYPTED DATA SOURCE</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${Object.entries(item).map(([k, v]) => `
                        <div class="bg-black/40 p-2 rounded border border-zinc-900">
                            <label class="text-[8px] text-zinc-600 uppercase block font-bold">${k}</label>
                            <span class="text-sm text-zinc-200 font-medium">${v || '---'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        res.send(layout(`
        <div class="max-w-6xl mx-auto py-12 px-4">
            <div class="flex justify-between items-center mb-10">
                <h2 class="text-2xl font-black italic text-white uppercase underline decoration-red-600">Sorgu Çıktıları</h2>
                <a href="/sorgu-sayfasi/${path}" class="btn-premium px-6 py-2 rounded text-xs">YENİDEN ARA</a>
            </div>
            ${resultCards || '<div class="text-center py-20 glass"><p class="text-red-500 font-bold uppercase tracking-widest">Hiçbir sonuç bulunamadı.</p></div>'}
        </div>`));

    } catch (error) {
        res.send(layout(`
        <div class="text-center py-40">
            <h1 class="text-6xl font-black text-red-600 mb-4">404 API</h1>
            <p class="text-zinc-500 mb-8 font-mono italic">API şu an cevap vermiyor veya endpoint bulunamadı.</p>
            <a href="/dashboard" class="underline text-blue-500">ANA SAYFAYA DÖN</a>
        </div>`));
    }
});

// 6. ADMİN LOGLARI
app.get('/admin', authRequired, (req, res) => {
    const rows = queryLogs.reverse().map(l => `
        <tr class="border-b border-zinc-900 text-[11px] hover:bg-zinc-950 transition">
            <td class="p-3 text-zinc-500">${l.date}</td>
            <td class="p-3 text-red-600 font-bold uppercase italic">${l.user}</td>
            <td class="p-3 text-blue-500 font-bold uppercase">${l.action}</td>
            <td class="p-3 text-zinc-400 font-mono truncate max-w-xs">${l.params}</td>
        </tr>
    `).join('');

    res.send(layout(`
    <div class="max-w-6xl mx-auto py-16 px-4">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-black italic text-white">SİSTEM <span class="text-red-600">LOGLARI</span></h1>
            <a href="/dashboard" class="text-xs text-zinc-500 border border-zinc-800 px-4 py-2 rounded">GERİ</a>
        </div>
        <div class="glass overflow-hidden rounded-xl">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase font-black">
                    <tr><th class="p-3 italic">Zaman</th><th class="p-3">User</th><th class="p-3">Eylem</th><th class="p-3">Parametreler</th></tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="4" class="text-center p-10 text-zinc-700">LOG BULUNAMADI</td></tr>'}</tbody>
            </table>
        </div>
    </div>`));
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });
app.get('/', (req, res) => res.redirect('/login'));

// --- SUNUCU BAŞLATMA ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    =========================================
    CEMILE PREMIUM V5 AKTİF
    PORT: ${PORT}
    DURUM: FULL+FULL MANTIKLI SİSTEM
    =========================================
    `);
});
      
