const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'premium_secret_key_99',
    resave: false,
    saveUninitialized: true
}));

// Senin verdiğin Cloudflare ve API bilgileri
const CF_SECRET = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_BASE = 'https://apilerimya.onrender.com';

// Geçici veri tutucular (Admin panel için)
let queryLogs = [];
let bannedUsers = [];

// Admin Kontrol Middleware
const checkAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/login');
};

// --- ROUTES ---

// Ana Sayfa (Sorgu Ekranı)
app.get('/', (req, res) => {
    res.render('index', { results: null, error: null });
});

// Giriş Sayfası
app.get('/login', (req, res) => res.render('login', { error: null }));

// Admin Login İşlemi
app.post('/login', async (req, res) => {
    const { username, password, 'cf-turnstile-response': token } = req.body;

    // Cloudflare Doğrulama
    try {
        const cfVerify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            secret: CF_SECRET,
            response: token
        });

        if (!cfVerify.data.success) {
            return res.render('login', { error: 'Robot doğrulaması başarısız!' });
        }

        if (username === 'admin' && password === 'admin123') {
            req.session.isAdmin = true;
            return res.redirect('/admin');
        } else {
            return res.render('login', { error: 'Hatalı kullanıcı adı veya şifre!' });
        }
    } catch (err) {
        res.render('login', { error: 'Sistem hatası!' });
    }
});

// ÖZEL SORGULAMA (Ad, Soyad, İl)
app.post('/search', async (req, res) => {
    const { ad, soyad, il } = req.body;
    
    try {
        // İstediğin API yapısına göre istek atılıyor
        const response = await axios.get(`${API_BASE}/sorgu`, {
            params: { ad, soyad, il }
        });
        
        // Loglara ekle (Admin görsün diye)
        queryLogs.push({
            user: "Misafir",
            query: `${ad} ${soyad} - ${il}`,
            time: new Date().toLocaleString()
        });

        res.render('index', { results: response.data, error: null });
    } catch (err) {
        res.render('index', { results: null, error: 'API bağlantı hatası veya veri bulunamadı.' });
    }
});

// Admin Paneli
app.get('/admin', checkAdmin, (req, res) => {
    res.render('admin', { logs: queryLogs, banned: bannedUsers });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Site ${PORT} portunda aktif.`));
         
