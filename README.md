# Secure Note Taker

A REST API for private notes and public posts, built with **Express 5**, **TypeScript**, **MongoDB (Mongoose)** and **JWT** authentication. Users can only read and change their own notes; admins can manage users and see all notes.

## Features

- Register / login with bcrypt-hashed passwords and HS256 JWTs
- Role-based access (`user`, `admin`)
- CRUD for private notes, scoped to the owner
- Posts, listed per user with pagination
- Find other users who share your interests (MongoDB aggregation)
- Request validation with Zod (body, params and query)
- Paginated list endpoints (`page`, `limit`)
- Security headers (Helmet), CORS, structured logging (Pino)
- Graceful shutdown on `SIGINT` / `SIGTERM`

## Tech stack

| Area       | Tools                                  |
| ---------- | -------------------------------------- |
| Runtime    | Node.js, Express 5, TypeScript (ESM)   |
| Database   | MongoDB 7, Mongoose                    |
| Auth       | jsonwebtoken, bcryptjs                 |
| Validation | Zod                                    |
| Logging    | Pino, pino-http, pino-pretty           |
| Tooling    | tsx, ESLint, Prettier, Docker Compose  |

## Getting started

### Prerequisites

- Node.js (a recent LTS release)
- Docker and Docker Compose (for MongoDB), or your own MongoDB instance

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable              | Required | Default             | Description                                    |
| --------------------- | -------- | ------------------- | ---------------------------------------------- |
| `PORT`                | no       | `3000`              | Port the API listens on                        |
| `NODE_ENV`            | no       | `development`       | `development` includes stack traces in errors  |
| `MONGODB_URI`         | **yes**  | —                   | MongoDB connection string                      |
| `MONGO_DB_NAME`       | no       | `secure-note-taker` | Database name                                  |
| `MONGO_PORT`          | no       | `27017`             | Host port for the Docker MongoDB container     |
| `MONGO_ROOT_USERNAME` | Docker   | —                   | Root user for the Docker MongoDB container     |
| `MONGO_ROOT_PASSWORD` | Docker   | —                   | Root password for the Docker MongoDB container |
| `JWT_SECRET`          | **yes**  | —                   | Signing secret, **at least 32 characters**     |
| `JWT_EXPIRES_IN`      | no       | `1h`                | Token lifetime (e.g. `15m`, `1h`, `7d`)        |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start MongoDB

```bash
docker compose up -d
```

MongoDB is bound to `127.0.0.1` only and its data is kept in the `mongo-data` volume.

### 4. Seed sample data (optional)

```bash
npm run seed        # 20 random users
npm run seed -- 50  # 50 random users
```

This creates an admin account (`admin@example.com`) plus random users, notes and posts. Every seeded account uses the password `Password123!`. Running it again skips emails that already exist.

### 5. Run the API

```bash
npm run dev     # watch mode with tsx
```

or for production:

```bash
npm run build
npm start
```

Check it is up:

```bash
curl http://localhost:3000/health
```

## Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start in watch mode                 |
| `npm run build`        | Compile TypeScript to `dist/`       |
| `npm start`            | Run the compiled server             |
| `npm run typecheck`    | Type-check without emitting         |
| `npm run seed [count]` | Seed the database with sample data  |
| `npm run lint`         | Lint with ESLint (`lint:fix` fixes) |
| `npm run format`       | Format with Prettier (`format:check` checks only) |

## API

Base URL: `http://localhost:3000`

Protected routes need an `Authorization: Bearer <token>` header. Get a token from `/api/auth/register` or `/api/auth/login`.

List endpoints accept `?page=` (default `1`) and `?limit=` (default `10`, max `100`).

### Health

| Method | Path      | Auth | Description                    |
| ------ | --------- | ---- | ------------------------------ |
| GET    | `/health` | —    | Status, server time and uptime |

### Auth

| Method | Path                 | Auth | Description                |
| ------ | -------------------- | ---- | -------------------------- |
| POST   | `/api/auth/register` | —    | Create an account, returns `{ user, token }` |
| POST   | `/api/auth/login`    | —    | Log in, returns `{ user, token }`            |

Register body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "at-least-8-chars",
  "interests": ["reading", "travel"]
}
```

- `name`: 1–100 characters
- `password`: at least 8 characters, at most 72 bytes (bcrypt limit)
- `interests`: optional, up to 20 strings of up to 50 characters (stored lowercase)

### Users

| Method | Path                    | Auth | Description                                        |
| ------ | ----------------------- | ---- | -------------------------------------------------- |
| GET    | `/api/users/me`         | user | Your profile                                       |
| GET    | `/api/users/interests`  | user | Other users grouped by the interests you share     |
| GET    | `/api/users/:id/posts`  | user | A user's posts (paginated)                         |

### Notes

All note routes only see the caller's own notes.

| Method | Path             | Auth | Description              |
| ------ | ---------------- | ---- | ------------------------ |
| GET    | `/api/notes`     | user | List your notes (paginated) |
| GET    | `/api/notes/:id` | user | Get one note             |
| POST   | `/api/notes`     | user | Create a note            |
| PATCH  | `/api/notes/:id` | user | Update title and/or content |
| DELETE | `/api/notes/:id` | user | Delete a note (`204`)    |

Note body: `title` (1–200 characters) and `content` (1–50,000 characters). `PATCH` needs at least one of them.

### Posts

| Method | Path         | Auth | Description   |
| ------ | ------------ | ---- | ------------- |
| POST   | `/api/posts` | user | Create a post |

Post body has the same rules as a note.

### Admin

| Method | Path                       | Auth  | Description                         |
| ------ | -------------------------- | ----- | ----------------------------------- |
| GET    | `/api/admin/users`         | admin | List all users (paginated)          |
| POST   | `/api/admin/user`          | admin | Create a user (optional `role`)     |
| PATCH  | `/api/admin/user/:id`      | admin | Update a user's fields or role      |
| DELETE | `/api/admin/user/:id`      | admin | Delete a user (`204`)               |
| GET    | `/api/admin/notes`         | admin | List all notes (paginated)          |
| GET    | `/api/admin/user/:id/notes`| admin | List one user's notes (paginated)   |

Admins cannot change their own role or delete their own account.

### Example

```bash
# Log in as the seeded admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123!"}' | jq -r .token)

# Create a note
curl -X POST http://localhost:3000/api/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Shopping list","content":"Milk, eggs, bread"}'

# List notes
curl "http://localhost:3000/api/notes?page=1&limit=5" -H "Authorization: Bearer $TOKEN"
```

### Paginated responses

```json
{
  "notes": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Errors

Errors share one shape:

```json
{
  "statusCode": 404,
  "message": "Note not found",
  "details": "...optional, e.g. validation issues",
  "stack": "...only when NODE_ENV=development"
}
```

## Project structure

```
src/
├── app.ts            # Express app and middleware setup
├── server.ts         # Entry point: DB connection, listen, graceful shutdown
├── config/           # Environment and logger config
├── controllers/      # HTTP handlers
├── db/               # Connection setup and seed script
├── middlewares/      # Auth, admin check, validation, errors, logging
├── models/           # Mongoose schemas (User, Note, Post)
├── repositories/     # Database access
├── routes/           # Route definitions (/health, /api)
├── services/         # Business logic
├── utils/            # Pagination helpers, router grouping
└── validators/       # Zod schemas
```

Requests flow **route → validator → controller → service → repository → model**.

## Security notes

- Passwords are hashed with bcrypt (cost 12) and are never returned in responses.
- JWTs are verified with the HS256 algorithm pinned, and the role in the token is checked against the allowed roles.
- Users can only access their own notes; ownership is enforced in the database query.
- All input is validated and trimmed before it reaches the service layer; IDs must be valid ObjectIds.
- The app refuses to start without `MONGODB_URI` or with a `JWT_SECRET` shorter than 32 characters.
- Never commit your `.env` file.
