require('dotenv').config();
const express = require('express');
const { initializeDatabase } = require('./database.js');
const booksRouter = require('./routes/books.js');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/books', booksRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Lab 3 REST API is running', data: { books: '/books' } });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }
  console.error('Unhandled server error:', error);
  return res.status(500).json({ message: 'Internal server error' });
});

const startServer = async () => {
  await initializeDatabase();
  return app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server failed to start:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
