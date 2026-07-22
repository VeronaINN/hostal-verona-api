/**
 * Hostal Verona — Backend de sincronización (Node.js + Express + Supabase)
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Faltan SUPABASE_URL o SUPABASE_API_KEY en las variables de entorno.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.text({ type: '*/*', limit: '20mb' }));

app.get('/', async (req, res) => {
  try {
    if (req.query.action === 'getAll') {
      const { data, error } = await supabase.from('kv_store').select('tipo, valor');
      if (error) throw error;
      const out = {};
      (data || []).forEach((r) => { out[r.tipo] = r.valor; });
      return res.json(out);
    }
    res.json({ ok: true, mensaje: 'Hostal Verona API activa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
});

app.post('/', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const type = body && body.type;
    const data = body ? body.data : undefined;
    if (!type) return res.status(400).json({ ok: false, error: 'Falta "type"' });
    const { error } = await supabase
      .from('kv_store')
      .upsert({ tipo: type, valor: data, actualizado: new Date().toISOString() }, { onConflict: 'tipo' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
});

app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.listen(PORT, () => console.log(`Hostal Verona API (Supabase) escuchando en puerto ${PORT}`));
