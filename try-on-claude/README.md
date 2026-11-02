# Try-on (GenAI4Dev K1)

## Giới thiệu

Dự án “Try-on” là ứng dụng thử đồ (virtual try-on) theo hướng GenAI.

- Backlog tổng quan: xem `PB.md`
- Sprint 1 backlog: xem `sprints/sprint1.md`
- User stories chi tiết: xem `sprints/US-01.md` và `sprints/US-02.md`

## Tech stack

- Frontend: React + Vite + TailwindCSS (v4, plugin `@tailwindcss/vite`) + React Router
- Backend: Node.js + Express (REST, prefix `/api`)
- Database & Storage: Supabase (PostgreSQL + Storage)
- Auth: JWT do backend phát hành, mật khẩu hash bằng bcrypt

## Yêu cầu

- Node.js >= 20 (đã chạy thử trên Node 24) và npm
- Một Supabase project (xem bên dưới)

## Cài đặt

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Tạo Supabase project

1. Vào <https://supabase.com/dashboard>, tạo project mới.
2. Vào **Project Settings → API** và lấy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (chỉ dùng ở backend, tuyệt đối không đưa vào frontend hay commit)

### Cấu hình biến môi trường

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Điền giá trị vào `backend/.env`:

| Biến | Ý nghĩa |
|------|---------|
| `PORT` | Cổng backend (mặc định 4000) |
| `CLIENT_URL` | Origin của frontend, là origin duy nhất được CORS cho phép (vd `http://localhost:5173`) |
| `JWT_SECRET` | Chuỗi bí mật dài, ngẫu nhiên (vd `openssl rand -hex 48`) |
| `JWT_EXPIRES_IN` | Thời hạn token (vd `7d`) |
| `SUPABASE_URL` | Project URL của Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key của Supabase |

`frontend/.env` chỉ cần `VITE_API_URL` (vd `http://localhost:4000/api`). Chỉ biến có prefix `VITE_` được lộ ra trình duyệt, không đặt secret vào đây. Backend sẽ báo lỗi rõ ràng và không khởi động nếu thiếu biến bắt buộc.

## Chạy dự án

```bash
# Terminal 1 - backend (auto-reload)
cd backend && npm run dev

# Terminal 2 - frontend
cd frontend && npm run dev
```

- Frontend: <http://localhost:5173>
- Kiểm tra backend: `curl -i http://localhost:4000/api/health` (200 khi kết nối được Supabase, 503 khi không)
- Endpoint hiện có: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/user/profile`, `PUT /api/user/profile` (multipart, ảnh toàn thân vào bucket private `body-photos`); xem `design/PRD.md` mục 4

## Lint, format, build

```bash
cd backend  && npm run lint && npm run format
cd frontend && npm run lint && npm run format && npm run build
```

Hiện chưa có test runner.

## Cấu trúc repo

- `backend/`: Express API
  - `src/config` (env, supabase, jwt), `src/routes`, `src/controllers`, `src/services`, `src/validators`, `src/middlewares`, `src/utils`
  - `src/app.js` (tạo app), `src/server.js` (listen)
- `frontend/`: React app
  - `src/{components,pages,layouts,routes,services,hooks,context,lib,utils,assets}`
- `design/`: PRD, flows, database schema, screens
- `migrations/`: SQL migration và seed cho Supabase
- `sprints/`: user stories + sprint backlog
- `PB.md`: product backlog

## Hướng dẫn vibe code

- Bám theo các tasks liệt kê trong sprint backlog, hãy ra lệnh cho AI thực hiện từng task một. Nhớ @ các files liên quan tới tasks khi ra lệnh.
- Sử dụng các commands hợp lý trong quá trình vibe code.
- Prompt mẫu hoàn thành task 1:

```
Hãy triển khai Task 1 trong @sprints/sprint1.md: Thiết lập Project.
```

- Prompt mẫu hoàn thành task 2:

```
@PB.md, @US-01.md, @US-02.md, @sprints/sprint1.md: Hãy triển khai Task 2 trong @sprints/sprint1.md: Tạo Landing Page.
```
