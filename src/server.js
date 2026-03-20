const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
app.use(express.static('static'));
app.use(express.json());

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin',
  },
  {
    id: 2,
    username: 'Yehor',
    password: 'DevOps',
  },
];
let users = defaultUsers.map((u) => ({ ...u }));

function resetUsers() {
  users = defaultUsers.map((u) => ({ ...u }));
}

app.post('/api/login', (req, res) => {
  const user = users.find((u) => u.username == req.body.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  } else if (user.password != req.body.password) {
    return res.status(401).json({ error: 'Invalid password' });
  } else {
    res.json({ id: user.id, username: user.username });
  }
});

app.post('/api/register', (req, res) => {
  const user = users.find((u) => u.username == req.body.username);
  if (!user) {
    const newUser = users.push({
      id: users.at(-1).id + 1,
      username: req.body.username,
      password: req.body.password,
    });
    res.json(newUser);
  } else {
    return res.status(409).json({ error: 'This user is already existed' });
  }
});

app.get('/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).send('User not found');
  }

  res.sendFile(path.join(__dirname,'..' ,'static', 'user.html'));
});

app.get('/api/user/:id', (req, res) => {
  const user = users.find((u) => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User is not found' });
  }
  res.json({
    id: user.id,
    username: user.username,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.post('/api/search', (req, res) => {
  const searchUser = users.find((u) => req.body.username == u.username);
  if (searchUser) {
    res.json(searchUser);
  } else {
    return res.status(404).json({ error: 'User is not found' });
  }
});

module.exports = { app, resetUsers };
