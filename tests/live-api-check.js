const baseUrl = 'http://localhost:3000';

async function check(method, path, expectedStatus, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    data = text;
  }
  const passed = response.status === expectedStatus;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${method} ${path} -> ${response.status}${passed ? '' : ` (expected ${expectedStatus})`}`);
  if (!passed) console.log(JSON.stringify(data));
  return { response, data };
}

(async () => {
  await check('GET', '/', 200);
  await check('GET', '/books', 200);
  await check('GET', '/books/', 200);
  await check('GET', '/books?search_q=code', 200);
  await check('GET', '/books?order_by=price&order=ASC', 200);
  await check('GET', '/books?order_by=price&order=DESC', 200);
  await check('GET', '/books?limit=2&offset=1', 200);
  await check('GET', '/books?min_price=500', 200);
  await check('GET', '/books?max_price=500', 200);
  await check('GET', '/books?min_price=300&max_price=700', 200);
  await check('GET', '/books/not-a-number', 400);
  await check('GET', '/books/999999', 404);
  await check('POST', '/books', 400, { author: 'Test Author', price: 100 });
  await check('POST', '/books', 400, { title: 'Test Book', price: 100 });
  await check('POST', '/books', 400, { title: 'Test Book', author: 'Test Author', price: 'expensive' });

  const created = await check('POST', '/books', 201, {
    title: 'Live Test Book', author: 'API Tester', price: 123.45
  });
  const id = created.data.data && created.data.data.id;
  if (!id) {
    console.error('FAIL: Create response did not include a book ID');
    process.exitCode = 1;
    return;
  }

  await check('GET', `/books/${id}`, 200);
  await check('PUT', `/books/${id}`, 200, {
    title: 'Updated Live Test Book', author: 'API Tester', price: 150
  });
  await check('DELETE', `/books/${id}`, 200);
  await check('DELETE', `/books/${id}`, 404);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
