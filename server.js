const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'premium-secret', resave: false, saveUninitialized: true }));

const CLOUDFLARE_SECRET = '0x4AAAAAADNVZ1JQTqVroPOW1Fi6EXdLWYQ';
const API_URL = 'https://apilerimya.onrender.com';

// Mock Veritabanı
let logs = [];
let bannedUsers = [];

// Middlewares
const isAdmin = (req, res, next) => {
    if (req.session.admin) next();
    else res.redirect('/login');
};

app.get('/', (req, res) => res.render('index', { results: null }));

app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
    const { username, password, 'cf-turnstile-response': token } = req.body;
    
    // Cloudflare Doğrulama
    const verify = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        secret: CLOUDFLARE_SECRET,
        response: token
    });

    if (verify.data.success && username === 'admin' && password === 'admin123') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.send('Hatalı giriş veya robot doğrulaması başarısız!');
    }
});

app.post('/search', async (req, res) => {
    const { ad, soyad, il } = req.body;
    try {
        const response = await axios.get(`${API_URL}/sorgu?ad=${ad}&soyad=${soyad}&il=${il}`);
        const data = response.data;
        
        // Log kaydı
        logs.push({ ad, soyad, il, date: new Date().toLocaleString() });
        
        res.render('index', { results: data });
    } catch (error) {
        res.render('index', { results: [{ error: 'API hatası oluştu' }] });
    }
});

app.get('/admin', isAdmin, (req, res) => {
    res.render('admin', { logs, bannedUsers });
});

app.listen(process.env.PORT || 3000, () => console.log('Server hazır!'));
          
