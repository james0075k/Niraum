# API — /api/v1

> Skeleton. Endpoints are implemented in the feature phase; this is the contract they follow.
> Conventions (envelope, pagination, error codes) are defined in
> [ARCHITECTURE.md §5.3](./ARCHITECTURE.md#53-api-conventions).

## Public

| Method | Path               | Notes                                            |
| ------ | ------------------ | ------------------------------------------------ |
| GET    | `/health`          | `{ data: { status, db, uptime } }` — implemented |
| GET    | `/settings/public` | public projection of SiteSettings                |
| GET    | `/services`        | ordered by `order`                               |
| GET    | `/projects`        | `?page&limit&sort&status&mineral&featured`       |
| GET    | `/projects/:slug`  | published only                                   |
| GET    | `/posts`           | `?page&limit&tag&q`                              |
| GET    | `/posts/:slug`     | published only                                   |
| GET    | `/jobs`            | open and not past deadline                       |
| GET    | `/jobs/:slug`      |                                                  |
| GET    | `/team`            | ordered by `order`                               |
| POST   | `/contact`         | rate-limited, honeypot                           |
| POST   | `/applications`    | `multipart/form-data` with `cv`                  |
| POST   | `/newsletter`      | double opt-in                                    |

## Auth

| Method | Path            | Notes                                       |
| ------ | --------------- | ------------------------------------------- |
| POST   | `/auth/login`   | sets `na_at` + `na_rt` cookies              |
| POST   | `/auth/refresh` | rotates cookies                             |
| POST   | `/auth/logout`  | clears cookies, bumps `refreshTokenVersion` |
| POST   | `/auth/forgot`  | always 202                                  |
| POST   | `/auth/reset`   | single-use token                            |
| GET    | `/auth/me`      | current user                                |

## Admin (role-guarded, prefix `/admin`)

| Resource                                        | Methods                                                      | Min role   |
| ----------------------------------------------- | ------------------------------------------------------------ | ---------- |
| `projects`, `posts`, `jobs`, `team`, `services` | `GET` list, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id`    | editor     |
| `media`                                         | `GET`, `POST` (multipart), `PATCH /:id` (alt), `DELETE /:id` | editor     |
| `users`                                         | full CRUD                                                    | superadmin |
| `settings`                                      | `GET`, `PUT`                                                 | admin      |
| `settings/geocode`                              | `POST { address }`                                           | admin      |
| `messages`                                      | `GET`, `PATCH /:id { status }`                               | admin      |
| `applications`                                  | `GET`, `PATCH /:id { status }`                               | admin      |
| `audit`                                         | `GET`                                                        | admin      |
