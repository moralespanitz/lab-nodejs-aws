const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Create SQLite database and table if not exists
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create the users table if it doesn't already exist
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        } else {
          console.log('Users table created or already exists.');
        }
      }
    );
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).send('Error fetching users');
      return;
    }
    res.json(rows);
  });
});

// Get a single user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.status(500).send('Error fetching user');
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(404).send('User not found');
    }
  });
});

// Create a new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }
  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  stmt.run([name, email], function (err) {
    if (err) {
      res.status(500).send('Error creating user');
      return;
    }
    res.status(201).json({
      id: this.lastID,
      name,
      email,
    });
  });
});

// Update an existing user
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).send('Name and email are required');
  }
  const stmt = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
  stmt.run([name, email, userId], function (err) {
    if (err) {
      res.status(500).send('Error updating user');
      return;
    }
    if (this.changes === 0) {
      res.status(404).send('User not found');
    } else {
      res.json({ id: userId, name, email });
    }
  });
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run([userId], function (err) {
    if (err) {
      res.status(500).send('Error deleting user');
      return;
    }
    if (this.changes === 0) {
      res.status(404).send('User not found');
    } else {
      res.status(204).send();
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
