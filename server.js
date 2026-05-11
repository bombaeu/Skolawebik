const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'leaderboard.json');

if (!fs.existsSync(DB)) fs.writeFileSync(DB, '[]', 'utf8');

function readLB() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}
function writeLB(data) {
  fs.writeFileSync(DB, JSON.stringify(data), 'utf8');
}

app.use(express.json());

// Serve index.html from root (same folder as server.js)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/leaderboard', (req, res) => {
  res.json(readLB());
});

app.post('/api/leaderboard', (req, res) => {
  const { nick, score, wins, total, date } = req.body;

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
  lb.splice(100);
  writeLB(lb);

  res.json({ ok: true, rank: lb.findIndex(e => e.ts === entry.ts) + 1 });
});

app.listen(PORT, () => console.log(`WebQuiz běží na portu ${PORT}`));
