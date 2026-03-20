const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;

// 1. Point to the 'static' folder. 
// Since this file is in 'src', we go UP one level ('..') to find 'static'
app.use(express.static(path.join(__dirname, '..', 'static')));
app.use(express.json());

const defaultUsers = [{ id: 1, username: 'admin', password: 'admin' }];
let users = defaultUsers.map((u) => ({ ...u }));

function resetUsers() {
  users = defaultUsers.map((u) => ({ ...u }));
}

// --- API Routes ---

app.post('/api/login', (req, res) => {
  const user = users.find((u) => u.username === req.body.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  } else if (user.password !== req.body.password) {
    return res.status(401).json({ error: 'Invalid password' });
  } else {
    res.json({ id: user.id, username: user.username });
  }
});

app.post('/api/register', (req, res) => {
  const user = users.find((u) => u.username === req.body.username);
  if (!user) {
    const newId = users.length > 0 ? users[users.length - 1].id + 1 : 1;
    const newUser = {
      id: newId,
      username: req.body.username,
      password: req.body.password,
    };
    users.push(newUser);
    res.json(newUser);
  } else {
    return res.status(409).json({ error: 'This user already exists' });
  }
});

// --- Page Routes ---

app.get('/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).send('User not found');
  }
  // Updated path: Go up from 'src' to root, then into 'static'
  res.sendFile(path.join(__dirname, '..', 'static', 'user.html'));
});

app.get('/api/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    username: user.username,
  });
});

if (require.main === module) {
  // Use 0.0.0.0 for better Docker compatibility
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, resetUsers };