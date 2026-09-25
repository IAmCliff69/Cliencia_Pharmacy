# Cliencia Pharmacy 💊

A full-stack pharmacy inventory management system built with FastAPI and React. Designed for real pharmacy operations — POS, stock management, expiry tracking, shift auditing, and role-based access — with a clean, responsive UI that supports light and dark mode.

**Live demo:** [clienciapharm.onrender.com](https://clienciapharm.onrender.com)

---

## Features

### Inventory & Stock
- Full CRUD for medicines, categories, and suppliers
- Low stock alerts and expiry tracking
- Real-time stock updates on every sale

### Point of Sale (POS)
- Shift-gated POS — sales can only be made during an open shift
- Cart-based checkout with receipt printing
- Sale voiding with automatic inventory restoration

### Shift Management
- Open and close shifts with a single action
- Closed shift summaries with total sales and revenue
- Staff shift activity visible to admins

### Reporting
- Sales reports filterable by date range
- PDF export for reports
- Audit log for all system actions

### User Management & Auth
- JWT-based authentication with role-based access (Admin / Staff)
- Admin approves new registrations before they can log in
- Promote, deactivate, and reactivate users
- Password reset via email token (30-minute TTL)
- Profile image upload (Cloudinary)

### UI/UX
- Light and dark mode (persisted to localStorage)
- Real-time data polling across all pages (10s interval)
- Toast notifications for all actions
- Responsive layout with auto-hiding scrollbars
- Print styles for receipts

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy |
| Database | MySQL (hosted on Railway) |
| Auth | JWT (Bearer tokens) |
| Migrations | Alembic |
| Media storage | Cloudinary |
| Deployment | Render |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Data fetching | TanStack Query v5 |
| HTTP client | Axios |
| Deployment | Render |

---

## Project Structure

```
Cliencia_Pharmacy/
├── backend/
│   ├── main.py                  # All API routes
│   ├── crud.py                  # Database operations
│   ├── schemas.py               # Pydantic models
│   ├── models.py                # SQLAlchemy models
│   ├── database.py              # DB connection
│   ├── dependencies.py          # Auth dependencies
│   └── app/
│       └── auth/
│           ├── routes.py        # Auth endpoints
│           ├── schemas.py
│           ├── models.py
│           ├── service.py
│           └── utils.py
└── frontend/
    └── src/
        ├── api/                 # Axios API layer
        ├── types/               # TypeScript interfaces
        ├── context/             # Auth, Theme, Toast contexts
        ├── components/          # Layout (Topbar, Sidebar, Shiftbar)
        └── pages/               # All 13 pages
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL database

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=mysql+pymysql://user:password@host/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Run migrations and start:

```bash
alembic upgrade head
python -m uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

Set your backend URL in the Axios base config (`src/api/axios.ts`).

---

## Roles & Permissions

| Action | Staff | Admin |
|---|---|---|
| View inventory | ✅ | ✅ |
| Make sales (POS) | ✅ | ✅ |
| Open / close shift | ✅ | ✅ |
| Add / edit medicines | ❌ | ✅ |
| Manage suppliers & categories | ❌ | ✅ |
| Approve / reject users | ❌ | ✅ |
| Void sales | ❌ | ✅ |
| View audit logs | ❌ | ✅ |
| Export reports | ❌ | ✅ |

---

## Deployment

Both services are deployed on **Render** (free tier) with:
- Backend auto-sleep prevention via UptimeRobot (pings every 5 minutes)
- Frontend configured with rewrite rules so React Router handles all routes
- Database hosted on **Railway** (MySQL)
- Media storage on **Cloudinary**

---

## Roadmap

- [ ] Multi-tenancy — multiple independent pharmacies on the same platform with fully isolated data
- [ ] Email notifications for low stock and expiring medicines
- [ ] Mobile app (React Native)

---

## Currency

All monetary values are in **GH₵ (Ghanaian cedis)**.

---

## License

MIT
