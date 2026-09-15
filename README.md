# 🏙️ SnapFix-  AI-Powered Civic Issue Reporting Platform
A MERN-stack, AI application that allows citizens to report local civic issues (like potholes, waste, or broken infrastructure) with image uploads, live updates, and AI-based image classification.

## 🌐 Live Demo
🎥 **Demo:** [Watch on YouTube](https://youtu.be/UuZyAWHL5uk)


🚀 **Deployed App:** [Try it Live](https://snapfix-rouge.vercel.app/)

---
## 🧠 AI Image Classification
Images uploaded by users are sent to a gemini API.
The model predicts issue type (e.g., pothole, garbage, sewage leak).
The result is stored in MongoDB and shown in the report list.

---

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
---
## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, Javascript, Typescript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ORM) |
| Real-time | Socket.io |
| Cloud Storage | Cloudinary |
| AI Model | Gemini LLM API & Custom ML model (image classification using TensorFlow/PyTorch) |
| Deployment | Vercel  |

---

## Quick Start
## ⚙️ Installation & Setup
```
git clone https://github.com/Sriniketh-J7/SnapFix.git
cd Snapfix/frontend
npm install
npm run dev

cd Snapfix/backend
npm install
npm run dev
```dev
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
