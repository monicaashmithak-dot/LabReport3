# Lab 3: REST API, Query Parameters, Validation and Debugging

**Student name:** KASARAPU MONICA ASHMITHA  
**Registration number:** 252U1R9061 
**Section:** CSE GEN AI 2A  
**Live deployment link:** Not deployed yet.

## Project Description

This lab builds a beginner-friendly REST API for managing books. It uses Express.js, SQLite, CommonJS modules, query parameters, request validation, and consistent JSON responses. The API can list, search, sort, paginate, filter, create, update, and delete books.

## Objectives

- Create a Node.js and Express REST API.
- Initialize and query a SQLite database automatically.
- Use parameterized SQL to prevent SQL injection.
- Validate route parameters, request bodies, and query parameters.
- Return appropriate HTTP status codes and JSON error messages.
- Test the API manually in Postman and automatically with Node's test runner.

## Technologies

- Node.js 18 or newer
- Express.js 5
- SQLite 3 through `sqlite3`
- JavaScript CommonJS
- Postman

## Folder Structure

```text
LabReport3/
├── server.js
├── database.js
├── routes/
│   └── books.js
├── tests/
│   └── api.test.js
├── postman/
│   └── Lab3-Books-API.postman_collection.json
├── screenshots/
│   └── README.md
├── data/
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Installation

Open the project in a terminal and run:

```powershell
npm install
npm run init-db
```

`npm install` downloads dependencies. `npm run init-db` creates the `books` table and inserts sample data if the table is empty.

## Environment Variables

Copy `.env.example` to `.env`. PowerShell:

```powershell
Copy-Item .env.example .env
```

Available settings:

```text
PORT=3000
DB_PATH=./data/books.db
```

- `PORT` selects the HTTP port.
- `DB_PATH` selects the SQLite database location relative to the project directory.

## Running the Server

```powershell
npm start
```

Open `http://localhost:3000`. Use `npm run dev` for Node.js watch mode on supported Node versions.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Return books with optional search, sorting, pagination, and price filters. |
| GET | `/books/:id` | Return one book by numeric ID. |
| POST | `/books` | Create a book from title, author, and numeric price. |
| PUT | `/books/:id` | Replace a book's title, author, and price. |
| DELETE | `/books/:id` | Delete a book by numeric ID. |

### Query Parameters

- `search_q`: partial title match example `/books?search_q=code`
- `order_by`: `id`, `title`, `author`, or `price`; default `id`
- `order`: `ASC` or `DESC`; default `ASC`
- `limit`: integer from 1 to 1000; default `100`
- `offset`: non-negative integer; default `0`
- `min_price`: non-negative number
- `max_price`: non-negative number

Examples:

```text
/books?search_q=code
/books?order_by=price&order=ASC
/books?order_by=title&order=DESC
/books?limit=2&offset=2
/books?min_price=300
/books?max_price=500
/books?min_price=300&max_price=700
```

## Request Body Examples

Create or update:

```json
{
  "title": "Introduction to Algorithms",
  "author": "Thomas Cormen",
  "price": 899.99
}
```
## Validation and Responses

- `200`: successful GET, PUT, or DELETE
- `201`: book created
- `400`: invalid input
- `404`: unknown book or route
- `500`: unexpected server/database failure

Success responses contain a message and data. Errors use a simple JSON message, for example:

```json
{
  "message": "Title is required"
}
```

Database details are logged on the server only and are not returned to API users.

## Postman Testing

1. Start the server with `npm start`.
2. In Postman, choose **Import**.
3. Import `postman/Lab3-Books-API.postman_collection.json`.
4. Select the collection and run requests individually or as a collection run.
5. Create and update requests can use ID `1`; delete a newly created ID first to avoid affecting other records.

## Automated Tests

```powershell
npm test
```

The tests start an isolated API process using a temporary test database and exercise the endpoint groups.

## Debugging Exercise

### 1. EADDRINUSE: Port Already in Use

**Cause:** Another process is already listening on the configured port, commonly port 3000.

**Solution:** Stop the process, or change `PORT` in `.env`, for example `PORT=3001`, and restart. On Windows, find the listener with `netstat -ano | findstr :3000`, then stop the matching process with Task Manager or `taskkill /PID <pid> /F`. Update the Postman URLs to match the new port.

### 2. Wrong Import Path

**Cause:** JavaScript cannot find the module named by an incorrect relative path.

**Solution:** Match the folder structure exactly, for example `require('../database.js')` from `routes/books.js`.

### 3. SQLite 'No Such Table' Due to a Table-Name Typo

**Cause:** SQL and initialization use different table names, for example querying `book` instead of `books`.

**Solution:** Use `books` consistently in every query. Run `npm run init-db` to create the correct table.

### 4. Missing Await in Async Database Operations

**Cause:** A promise is not awaited, so the route continues before the database operation finishes.

**Solution:** Use `await all(...)`, `await get(...)`, and `await run(...)`; the routes must await these promise-based helpers before responding.

## Problems Faced and Solutions

- A database file may not exist at first: initialization creates the data folder and SQLite file.
- Query values require safe handling: route values are SQL parameters bound with `?`, and sorting is restricted by an allowlist.
- Invalid JSON must return 400: Express parsing errors are handled by dedicated middleware.
- Database callbacks are converted to promises by helpers in `database.js`.

## Viva Explanation

- **GET `/books`** reads query parameters, builds safe SQL conditions, and awaits a result list.
- **GET `/books/:id`** validates a numeric ID and returns 404 when SQLite returns no row.
- **POST `/books`** validates a JSON body, inserts parameterized values, reads the inserted row, and returns 201.
- **PUT `/books/:id`** validates the ID and body, checks existence, updates the row, and returns it.
- **DELETE `/books/:id`** checks existence before deletion and returns the removed row.

## Verified Lab 03 Operations

The following operations were executed against the running API at `http://localhost:3000`.

### 1. Database Initialization (`02-database-initialized.png`)

Command: `npm run init-db`

Actual terminal output:

```text
Database initialized at /workspaces/LabReport3/data/books.db
```

SQLite created the `books` table and inserted four sample books. Screenshot status: not captured; the PNG file is not present yet.

### 2. Missing Title Validation (`12-missing-title.png`)

Request body: `{"author":"Monica","price":450}`

Verified result: `400 Bad Request`

```json
{
  "message": "Title is required"
}
```

No book was inserted. Screenshot status: not captured; the PNG file is not present yet.

### 3. Missing Author Validation (`13-missing-author.png`)

Request body: `{"title":"Learning Python","price":450}`

Verified result: `400 Bad Request`

```json
{
  "message": "Author is required"
}
```

No book was inserted. Screenshot status: not captured; the PNG file is not present yet.

### 4. Invalid Price Validation (`14-invalid-price.png`)

Request body: `{"title":"Learning Python","author":"Monica","price":"invalid"}`

Verified result: `400 Bad Request`

```json
{
  "message": "Price must be numeric"
}
```

No book was inserted. Screenshot status: not captured; the PNG file is not present yet.

### 5. Create and Update Book (`16-update-book.png`)

The temporary book was created using `POST /books` and returned actual ID `6` with `201 Created`:

```json
{
  "message": "Book created successfully",
  "data": {
    "id": 6,
    "title": "Learning Python",
    "author": "Monica",
    "price": 450
  }
}
```

`PUT /books/6` returned `200 OK`:

```json
{
  "message": "Book updated successfully",
  "data": {
    "id": 6,
    "title": "Advanced Python",
    "author": "Monica",
    "price": 550
  }
}
```

`GET /books/6` verified the updated values and returned `200 OK`. Screenshot status: not captured; the PNG file is not present yet.

### 6. Delete Book (`17-delete-book.png`)

`DELETE /books/6` returned `200 OK`:

```json
{
  "message": "Book deleted successfully",
  "data": {
    "id": 6,
    "title": "Advanced Python",
    "author": "Monica",
    "price": 550
  }
}
```

`GET /books/6` then returned `404 Not Found`:

```json
{
  "message": "Book not found"
}
```

Screenshot status: not captured; the PNG file is not present yet. The temporary test book was removed and the four seeded books remain.

## Screenshots

Manual screenshot instructions are in `screenshots/README.md`. No screenshots are claimed to exist until the corresponding PNG files are present in the `screenshots` folder.