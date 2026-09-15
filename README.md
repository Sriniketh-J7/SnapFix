# SnapFix — AI-Powered Civic Issue Reporting Platform

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env    # fill in your values
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env    # fill in your values
npm install
npm run dev
```

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| PORT | Server port (default 5000) |
| MONGODB_URL | MongoDB connection string |
| JWT_SECRET | JWT signing secret (min 32 chars) |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| FRONTEND_URL | Frontend URL for CORS |

### frontend/.env
| Variable | Description |
|---|---|
| VITE_BACKEND_URL | Backend URL (e.g. http://localhost:5000) |
| VITE_GEMINI_API_KEY | Google Gemini API key (from aistudio.google.com) |

## Portals
- `/login` — Citizen
- `/tech/login` — Technician
- `/dept/login` — Department Head

## Create a Department (one-time via API)
```
POST /api/department/signup
{ "deptName": "Water", "deptHeadName": "your_name", "password": "your_password" }
```
Departments: Water, Electrical, Civil, Sanitation, Animal Control

## Features
- AI image classification (Google Gemini)
- Geo-nearest + workload-balanced technician assignment
- Priority engine: baseScore + upvotes + age (Critical/High/Medium/Low)
- Upvoting — community priority influence
- 14-hour escalation cron
- Priority queue (binary heap) for task sorting
- TSP nearest-neighbour route optimization
- City-wide issue map with radius filter and heatmap
- Real-time Socket.io notifications for all three user types
- Cloudinary image upload (report + resolution photos)
