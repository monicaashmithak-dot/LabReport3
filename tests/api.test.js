const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const port = 3107;
const baseUrl = `http://127.0.0.1:${port}`;
const databasePath = path.join(__dirname, '..', 'data', 'api-test.db');
let server;

async function request(method, urlPath, body) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/books`);
      if (response.ok) return;
    } catch (error) {
      // Server may not have started yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start');
}

test.before(async () => {
  fs.rmSync(databasePath, { force: true });
  server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), DB_PATH: databasePath },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForServer();
});

test.after(() => {
  server.kill('SIGTERM');
  fs.rmSync(databasePath, { force: true });
});

test('GET /books supports list, search, sorting, pagination and price filters', async () => {
  const allBooks = await request('GET', '/books');
  assert.equal(allBooks.status, 200);
  assert.equal(allBooks.data.data.length, 4);

  const searches = await request('GET', '/books?search_q=code');
  assert.equal(searches.status, 200);
  assert.equal(searches.data.data[0].title, 'Clean Code');

  const descending = await request('GET', '/books?order_by=price&order=DESC');
  assert.equal(descending.status, 200);
  assert.equal(descending.data.data[0].price, 799);

  const paginated = await request('GET', '/books?limit=2&offset=1');
  assert.equal(paginated.status, 200);
  assert.equal(paginated.data.data.length, 2);

  const filtered = await request('GET', '/books?min_price=300&max_price=700');
  assert.equal(filtered.status, 200);
  assert.ok(filtered.data.data.every((book) => book.price >= 300 && book.price <= 700));

  const invalidSort = await request('GET', '/books?order_by=not_allowed');
  assert.equal(invalidSort.status, 400);
});

test('GET and validation paths return the correct status codes', async () => {
  const found = await request('GET', '/books/1');
  assert.equal(found.status, 200);

  const missing = await request('GET', '/books/9999');
  assert.equal(missing.status, 404);

  const invalidId = await request('GET', '/books/abc');
  assert.equal(invalidId.status, 400);
});

test('POST validates and creates a book', async () => {
  const missingTitle = await request('POST', '/books', { author: 'Test Author', price: 100 });
  assert.equal(missingTitle.status, 400);

  const missingAuthor = await request('POST', '/books', { title: 'Test Book', price: 100 });
  assert.equal(missingAuthor.status, 400);

  const invalidPrice = await request('POST', '/books', { title: 'Test Book', author: 'Test Author', price: 'expensive' });
  assert.equal(invalidPrice.status, 400);

  const created = await request('POST', '/books', { title: 'Test Book', author: 'Test Author', price: 125.5 });
  assert.equal(created.status, 201);
  assert.equal(created.data.data.title, 'Test Book');
});

test('PUT and DELETE update and remove books', async () => {
  const created = await request('POST', '/books', { title: 'Temporary Book', author: 'Temporary Author', price: 50 });
  const id = created.data.data.id;

  const updated = await request('PUT', `/books/${id}`, { title: 'Updated Book', author: 'Updated Author', price: 75 });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.title, 'Updated Book');

  const deleted = await request('DELETE', `/books/${id}`);
  assert.equal(deleted.status, 200);

  const missing = await request('DELETE', '/books/9999');
  assert.equal(missing.status, 404);
});
