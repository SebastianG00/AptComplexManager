// test-server.js

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// A single, simple route for testing
app.get('/api/test', (req, res) => {
  // This log will prove the server received the request
  console.log('SUCCESS: The /api/test route was hit!');
  res.json([{ id: 1, message: 'Hello from the test server!' }]);
});

app.listen(3001, () => {
  console.log('--- TEST SERVER RUNNING ON PORT 3001 ---');
});