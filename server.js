/**
 * Hostal Verona — Backend de sincronización (Node.js + Express + PostgreSQL)
 * Listo para desplegar en Railway.
 *
 * Expone el MISMO contrato que ya usa el frontend (hostal-verona.html),
 * así que cambiar de Google Apps Script a este backend es tan simple
 * como pegar la URL nueva en "⚙ Configuración → URL del script":
 *
 *   GET  /?action=getAll   → { tipo1: [...], tipo2: {...}, ... }
 *   POST /   body: { "type": "rooms", "data": [...] }  → { ok: true }
 *
 * Cada "tipo" (rooms, estadias, reservas, usuarios, etc.) se guarda
 * como un bloque JSON en una fila de la tabla kv_store — no importa
 * qué colecciones nuevas agregue la app en el futuro, este servidor
 * las acepta automáticamente sin cambios de código.
 */
import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  No se encontró DATABASE_URL. Define esa variable de entorno (Railway la crea sola al añadir PostgreSQL).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      tipo TEXT PRIMARY KEY,
      json JSONB NOT NULL,
      actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

app.use(cors()); // permite que el frontend (otro dominio, ej. GitHub Pages) llame a esta API
// El cliente envía 'Content-Type: text/plain' a propósito (evita el preflight
// CORS), así que aceptamos cualquier content-type como texto y lo parseamos
// nosotros mismos como JSON.
app.use(express.text({ type: '*/*', limit: '20mb' }));

app.get('/', async (req, res) => {
  try {
    if (req.query.action === 'getAll') {
      const { rows } = await pool.query('SELECT tipo, json FROM kv_store');
      const out = {};
      rows.forEach(r => { out[r.tipo] = r.json; });
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
    await pool.query(
      `INSERT INTO kv_store (tipo, json, actualizado) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (tipo) DO UPDATE SET json = EXCLUDED.json, actualizado = now()`,
      [type, JSON.stringify(data)]
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
    app.listen(PORT, () => console.log(`Hostal Verona API escuchando en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
