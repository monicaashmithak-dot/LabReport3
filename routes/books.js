const express = require('express');
const { all, get, run } = require('../database.js');

const router = express.Router();
const allowedSortColumns = new Set(['id', 'title', 'author', 'price']);

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function validateRequiredBook(book) {
  if (typeof book.title !== 'string' || book.title.trim() === '') {
    return 'Title is required';
  }
  if (typeof book.author !== 'string' || book.author.trim() === '') {
    return 'Author is required';
  }
  if (typeof book.price !== 'number' || !Number.isFinite(book.price)) {
    return 'Price must be numeric';
  }
  if (book.price < 0) {
    return 'Price must be a non-negative number';
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const {
      search_q,
      order_by = 'id',
      order = 'ASC',
      limit = '100',
      offset = '0',
      min_price,
      max_price
    } = req.query;

    if (!allowedSortColumns.has(String(order_by))) {
      return res.status(400).json({ message: 'order_by must be one of: id, title, author, price' });
    }

    const normalizedOrder = String(order).toUpperCase();
    if (normalizedOrder !== 'ASC' && normalizedOrder !== 'DESC') {
      return res.status(400).json({ message: 'order must be ASC or DESC' });
    }
    if (!isPositiveInteger(limit) || Number(limit) > 1000) {
      return res.status(400).json({ message: 'limit must be an integer between 1 and 1000' });
    }
    if (!/^\d+$/.test(String(offset))) {
      return res.status(400).json({ message: 'offset must be a non-negative integer' });
    }

    let minimum;
    let maximum;
    if (min_price !== undefined) {
      minimum = Number(min_price);
      if (!Number.isFinite(minimum) || minimum < 0) {
        return res.status(400).json({ message: 'min_price must be a non-negative number' });
      }
    }
    if (max_price !== undefined) {
      maximum = Number(max_price);
      if (!Number.isFinite(maximum) || maximum < 0) {
        return res.status(400).json({ message: 'max_price must be a non-negative number' });
      }
    }
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      return res.status(400).json({ message: 'min_price cannot be greater than max_price' });
    }

    const conditions = [];
    const values = [];
    if (search_q !== undefined) {
      conditions.push('title LIKE ?');
      values.push(`%${String(search_q)}%`);
    }
    if (minimum !== undefined) {
      conditions.push('price >= ?');
      values.push(minimum);
    }
    if (maximum !== undefined) {
      conditions.push('price <= ?');
      values.push(maximum);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, title, author, price FROM books ${whereClause} ORDER BY ${String(order_by)} ${normalizedOrder} LIMIT ? OFFSET ?`;
    values.push(Number(limit), Number(offset));
    const books = await all(sql, values);

    return res.json({ message: 'Books retrieved successfully', data: books });
  } catch (error) {
    console.error('GET /books failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await get('SELECT id, title, author, price FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ message: 'Book retrieved successfully', data: book });
  } catch (error) {
    console.error('GET /books/:id failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const validationError = validateRequiredBook(req.body || {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, author, price } = req.body;
    const result = await run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [title.trim(), author.trim(), price]
    );
    const book = await get('SELECT id, title, author, price FROM books WHERE id = ?', [result.id]);
    return res.status(201).json({ message: 'Book created successfully', data: book });
  } catch (error) {
    console.error('POST /books failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const validationError = validateRequiredBook(req.body || {});
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    const existingBook = await get('SELECT id FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price } = req.body;
    await run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [title.trim(), author.trim(), price, id]
    );
    const book = await get('SELECT id, title, author, price FROM books WHERE id = ?', [id]);
    return res.json({ message: 'Book updated successfully', data: book });
  } catch (error) {
    console.error('PUT /books/:id failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const existingBook = await get('SELECT id, title, author, price FROM books WHERE id = ?', [id]);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    await run('DELETE FROM books WHERE id = ?', [id]);
    return res.json({ message: 'Book deleted successfully', data: existingBook });
  } catch (error) {
    console.error('DELETE /books/:id failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
