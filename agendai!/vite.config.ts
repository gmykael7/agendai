import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(__dirname, '.agendai_cloud_db.json');

const getDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch {}
  return {};
};

const saveDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao salvar no banco local do Vite:', e);
  }
};

const cloudApiPlugin = (): Plugin => ({
  name: 'agendai-cloud-api-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);

      // GET /api/sync?email=... ou ?slug=...
      if (url.pathname === '/api/sync' && req.method === 'GET') {
        const email = url.searchParams.get('email')?.toLowerCase().trim();
        const slug = url.searchParams.get('slug')?.toLowerCase().trim();
        const db = getDb();

        let found = null;
        if (email && db[`user:${email}`]) {
          found = db[`user:${email}`];
        } else if (slug && db[`slug:${slug}`]) {
          found = db[`slug:${slug}`];
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (found) {
          res.end(JSON.stringify(found));
        } else {
          res.end(JSON.stringify({ found: false }));
        }
        return;
      }

      // POST /api/sync
      if (url.pathname === '/api/sync' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const email = (data.org?.email || data.email || '').toLowerCase().trim();
            const slug = (data.org?.slug || data.slug || '').toLowerCase().trim();
            const db = getDb();

            const payloadWithTime = { ...data, updated_at: new Date().toISOString() };
            if (email) db[`user:${email}`] = payloadWithTime;
            if (slug) db[`slug:${slug}`] = payloadWithTime;

            saveDb(db);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, updated_at: payloadWithTime.updated_at }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      // POST /api/appointment
      if (url.pathname === '/api/appointment' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const appointment = JSON.parse(body);
            const orgSlug = (appointment.org_slug || appointment.org_id || '').toLowerCase().trim();
            const db = getDb();

            const existing = db[`slug:${orgSlug}`];
            if (existing) {
              const prevAppointments = existing.appointments || [];
              if (!prevAppointments.some((a: any) => a.id === appointment.id)) {
                existing.appointments = [appointment, ...prevAppointments];
                existing.updated_at = new Date().toISOString();
                db[`slug:${orgSlug}`] = existing;
                if (existing.org?.email) {
                  db[`user:${existing.org.email.toLowerCase()}`] = existing;
                }
                saveDb(db);
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.end();
        return;
      }

      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudApiPlugin()],
  server: {
    host: true, // Permite acesso de celulares na mesma rede Wi-Fi / IP local
  }
});
