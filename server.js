const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TELEGRAM_TOKEN = '8784018769:AAFFL8Z0AX4hOrX60CIjPofQS_CPXuN2_wg';
const TELEGRAM_CHAT_ID = '2019789091';
const JWT_SECRET = 'archive-store-secret-key-2026';
const JWT_EXPIRES = '7d';

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_FILE = path.join(__dirname, 'backend', 'data', 'products.json');
const USERS_FILE = path.join(__dirname, 'backend', 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'backend', 'data', 'orders.json');
const UPLOADS_DIR = path.join(__dirname, 'backend', 'uploads');

// Создаём папки и файлы
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');

// Создаём дефолтного админа, если users.json пуст
const initUsers = () => {
  const users = readUsers();
  if (users.length === 0) {
    const hash = bcrypt.hashSync('archivestore2026', 10);
    users.push({
      id: 1,
      email: 'admin@archive.store',
      password: hash,
      fullname: 'Администратор',
      phone: '',
      telegram: '@admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log('[AUTH] Создан дефолтный администратор: admin@archive.store / archivestore2026');
  }
};

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e3)}${ext}`);
  },
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Утилиты для users.json
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// Middleware: проверка JWT
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Невалидный токен' });
  }
}

// Middleware: проверка роли admin
function requireAdmin(req, res, next) {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Нет прав администратора' });
  }
  next();
}

// ===== AUTH =====

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, fullname, phone, telegram } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const newUser = {
      id: Date.now(),
      email,
      password: hash,
      fullname: fullname || '',
      phone: phone || '',
      telegram: telegram || '',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    const token = generateToken(newUser);
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = generateToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json({ user: sanitizeUser(user) });
});

// ===== PRODUCTS =====

app.get('/api/products', (req, res) => {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Ошибка чтения товаров' });
  }
});

app.post('/api/products', requireAuth, requireAdmin, upload.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]), (req, res) => {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(data);

    const previewFile = req.files && req.files['preview'] && req.files['preview'][0];
    const previewPath = previewFile ? `/uploads/${previewFile.filename}` : '';

    const galleryFiles = req.files && req.files['gallery'];
    let images = [];
    if (galleryFiles && galleryFiles.length > 0) {
      images = galleryFiles.map(f => `/uploads/${f.filename}`);
    }

    const newProduct = {
      id: Date.now(),
      name: req.body.name || '',
      price: parseInt(req.body.price, 10) || 0,
      rating: 0,
      reviewsCount: 0,
      description: req.body.description || 'Нет описания',
      specs: {
        'Состав': req.body.composition || 'Неизвестно',
        'Страна': req.body.country || 'Неизвестно',
        'Артикул': req.body.article || 'Неизвестно',
      },
      preview: previewPath,
      images,
    };

    products.push(newProduct);
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения товара' });
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, upload.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
]), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(data);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const existing = products[index];

    const previewFile = req.files && req.files['preview'] && req.files['preview'][0];
    const previewPath = previewFile ? `/uploads/${previewFile.filename}` : existing.preview;

    const galleryFiles = req.files && req.files['gallery'];
    let images = existing.images || [];
    if (galleryFiles && galleryFiles.length > 0) {
      images = galleryFiles.map(f => `/uploads/${f.filename}`);
    }

    const updated = {
      ...existing,
      name: req.body.name || existing.name,
      price: parseInt(req.body.price, 10) || existing.price,
      description: req.body.description || existing.description,
      specs: {
        'Состав': req.body.composition || (existing.specs && existing.specs['Состав']) || '',
        'Страна': req.body.country || (existing.specs && existing.specs['Страна']) || '',
        'Артикул': req.body.article || (existing.specs && existing.specs['Артикул']) || '',
      },
      preview: previewPath,
      images,
    };

    products[index] = updated;
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');

    res.json(updated);
  } catch (err) {
    console.error('Ошибка обновления товара:', err);
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(data);
    const filtered = products.filter(p => p.id !== id);

    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления товара' });
  }
});

// DELETE /api/products/:id/images — удалить одну картинку из галереи
app.delete('/api/products/:id/images', requireAuth, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const imagePath = req.query.path;
    if (!imagePath) return res.status(400).json({ error: 'path обязателен' });

    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(data);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Товар не найден' });

    const product = products[index];
    product.images = (product.images || []).filter(img => img !== imagePath);
    if (product.preview === imagePath) product.preview = product.images[0] || '';

    // Удаляем файл с диска
    const filePath = path.join(__dirname, 'backend', imagePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    res.json(product);
  } catch (err) {
    console.error('Ошибка удаления картинки:', err);
    res.status(500).json({ error: 'Ошибка удаления картинки' });
  }
});

// ===== ORDERS =====

// GET /api/orders — получить заказы текущего пользователя
app.get('/api/orders', requireAuth, (req, res) => {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    const allOrders = JSON.parse(data);
    const userOrders = allOrders.filter(o => o.userId === req.user.id);
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка чтения заказов' });
  }
});

// POST /api/orders — принять заказ
app.post('/api/orders', (req, res) => {
  const { email, telegram, fullname, phone, items, total } = req.body;

  // Определяем userId из токена (если есть)
  let userId = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
      userId = payload.id;
    } catch {}
  }

  // Сохраняем заказ
  const order = {
    id: Date.now(),
    userId,
    email,
    telegram,
    fullname,
    phone,
    items: items || [],
    total: total || 0,
    date: new Date().toLocaleString('ru-RU'),
    createdAt: new Date().toISOString(),
  };

  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    orders.push(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Ошибка сохранения заказа:', err);
  }

  res.json({ success: true });

  // Фоновая отправка в Telegram
  const itemsList = (items || [])
    .map((item) => `  • ${item.name} — ${item.quantity} шт. × ${item.price.toLocaleString('ru-RU')} р. = ${(item.price * item.quantity).toLocaleString('ru-RU')} р.`)
    .join('\n');

  const text = [
    `🛒 *Новый заказ — ArchiveStore*`,
    ``,
    `📧 Email: ${email}`,
    `💬 Telegram: ${telegram}`,
    `👤 ФИО: ${fullname}`,
    `📞 Телефон: ${phone}`,
    ``,
    `📦 *Товары:*`,
    itemsList,
    ``,
    `💰 *Итого: ${(total || 0).toLocaleString('ru-RU')} р.*`,
  ].join('\n');

  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  }).catch((err) => {
    console.error('[TG] Ошибка отправки заказа в Telegram:', err.message);
  });
});

// ===== START =====

initUsers();

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
