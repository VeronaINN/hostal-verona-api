/**
 * Hostal Verona — Backend de sincronización (Node.js + Express + MySQL)
 * Variante para Hostinger (Unlimited Web Hosting u otro plan compartido),
 * donde normalmente solo hay bases de datos MySQL disponibles.
 *
 * Mismo contrato que el resto de backends (Apps Script / versión Postgres):
 *   GET  /?action=getAll   → { tipo1: [...], tipo2: {...}, ... }
 *   POST /   body: { "type": "rooms", "data": [...] }  → { ok: true }
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      tipo VARCHAR(191) PRIMARY KEY,
      json LONGTEXT NOT NULL,
      actualizado DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

app.use(cors());
// El cliente envía 'Content-Type: text/plain' a propósito (evita el
// preflight CORS), así que aceptamos cualquier content-type como texto
// y lo parseamos nosotros mismos como JSON.
app.use(express.text({ type: '*/*', limit: '20mb' }));

app.get('/', async (req, res) => {
  try {
    if (req.query.action === 'getAll') {
      const [rows] = await pool.query('SELECT tipo, json FROM kv_store');
      const out = {};
      rows.forEach(r => { out[r.tipo] = JSON.parse(r.json); });
      return res.json(out);
    }
    res.json({ ok: true, mensaje: 'Hostal Verona API activa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const type = body && body.type;
    const data = body ? body.data : undefined;
    if (!type) return res.status(400).json({ ok: false, error: 'Falta "type"' });
    const json = JSON.stringify(data);
    await pool.query(
      `INSERT INTO kv_store (tipo, json, actualizado) VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE json = VALUES(json), actualizado = NOW()`,
      [type, json]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Hostal Verona API (MySQL) escuchando en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
