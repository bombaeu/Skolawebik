const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'leaderboard.json');

// ── Init DB file if missing ──────────────────────────────
if (!fs.existsSync(DB)) fs.writeFileSync(DB, '[]', 'utf8');

function readLB() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}
function writeLB(data) {
  fs.writeFileSync(DB, JSON.stringify(data), 'utf8');
}

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/leaderboard ─────────────────────────────────
app.get('/api/leaderboard', (req, res) => {
  res.json(readLB());
});

// ── POST /api/leaderboard ────────────────────────────────
app.post('/api/leaderboard', (req, res) => {
  const { nick, score, wins, total, date } = req.body;

  // Basic validation
  if (
    typeof nick  !== 'string' || nick.trim().length < 1 || nick.trim().length > 20 ||
    typeof score !== 'number' || score < 0 || score > 9999 ||
    typeof wins  !== 'number' || typeof total !== 'number'
  ) {
    return res.status(400).json({ error: 'Neplatná data.' });
  }

  const entry = {
    nick:  nick.trim().slice(0, 20),
    score: Math.round(score),
    wins:  Math.min(Math.round(wins), total),
    total: Math.round(total),
    date:  typeof date === 'string' ? date.slice(0, 12) : new Date().toLocaleDateString('cs-CZ'),
    ts:    Date.now()
  };

  const lb = readLB();
  lb.push(entry);
  lb.sort((a, b) => b.score - a.score);
  lb.splice(100); // keep top 100
  writeLB(lb);

  res.json({ ok: true, rank: lb.findIndex(e => e.ts === entry.ts) + 1 });
});

// ── Fallback → index.html ────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WebQuiz běží na portu ${PORT}`);
});
