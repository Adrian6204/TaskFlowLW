<div align="center">

<img src="public/logo.png" alt="TaskFlow Logo" width="80" />

# TaskFlow LW

**Elevating Your Workspace. Empowering Your Team.**

A modern, full-stack task management platform built for teams — featuring real-time collaboration, visual dashboards, and a premium PWA experience.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

### 🌐 [Live Demo → phlifewoodtaskflow.vercel.app](https://phlifewoodtaskflow.vercel.app)

</div>

---

## ✨ Features

### 📋 Task Management
- **Kanban Board** — status columns (To Do, In Progress, Done)
- **Subtasks** — break down tasks into actionable steps
- **Task Dependencies** — block tasks until prerequisites are complete
- **Recurring Tasks** — daily, weekly, and monthly auto-scheduling
- **Priority Levels** — Urgent, High, Medium, Low with color coding
- **Tags & Filtering** — surface relevant tasks instantly

### 📊 Visual Dashboards & Analytics
- **Task Status Breakdown** — stacked bar with live counts
- **Throughput Chart** — created vs. completed over the last 7 days
- **Lead Time Chart** — average days to complete by priority
- **Task Aging Chart** — identify stalled work before it becomes overdue
- **Priority Volume** — horizontal bar chart by priority level
- **Member Efficiency** — completion rate per team member

### 🗓️ Multiple Views
- **Kanban Board** — classic column-based task view
- **Calendar View** — monthly task overview with due dates
- **Gantt Chart** — timeline view for project planning

### 👥 Team & Workspace Management
- **Multi-workspace** — separate spaces per department or project
- **Role-based Access** — member, admin, and system admin roles
- **Team Hub** — cross-filter members by position with attendance status
- **Assign Tasks View** — admin overview of member workloads
- **Member Profiles** — position, workspaces, and activity at a glance

### 🔐 Authentication & Security
- **Supabase Auth** — secure email/password authentication
- **Row Level Security (RLS)** — data isolated per workspace
- **Force Password Change** — default password enforcement on first login
- **Executive Administrator** — full system-wide administrative control

### 🏠 Personal Productivity
- **Home Dashboard** — scratchpad and personal stats
- **Scratchpad** — persistent quick notes per user
- **Overdue Alerts** — modal warnings for past-due items

### 📱 PWA & Experience
- **Progressive Web App** — installable on mobile and desktop
- **Dark / Light Mode** — system-aware with manual toggle
- **Responsive Design** — optimized from 375px mobile to widescreen
- **Animated UI** — smooth transitions and micro-interactions
- **Real-time Presence** — see who's online in your workspace

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 5 |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Charts | Chart.js 4, react-chartjs-2 |
| Icons | Lucide React, Heroicons |
| Routing | React Router DOM 7 |
| PWA | vite-plugin-pwa |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/TaskFlowLW.git
cd TaskFlowLW

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
TaskFlowLW/
├── auth/                  # Auth context and session management
├── components/
│   ├── charts/            # Chart.js chart components
│   ├── hooks/             # Component-level custom hooks
│   ├── icons/             # SVG icon components
│   └── PWA/               # PWA badge component
├── constants/             # App-wide config (task status, etc.)
├── context/               # Theme, presence, PWA contexts
├── hooks/                 # Global custom hooks
├── lib/                   # Supabase client
├── migrations/            # SQL migration files
├── public/                # Static assets
├── services/              # Supabase API service layer
├── utils/                 # Utility functions
├── types.ts               # Global TypeScript types
└── constants.ts           # Shared constants
```

---

## 🗄️ Database

Built on **Supabase PostgreSQL** with the following tables:

| Table | Description |
|---|---|
| `profiles` | User profiles linked to Supabase Auth |
| `spaces` | Workspaces (departments/projects) |
| `space_members` | Workspace membership and roles |
| `tasks` | All tasks with priority, status, recurrence |
| `subtasks` | Child tasks under a parent task |
| `daily_tasks` | Personal daily to-do items per user |
| `scratchpads` | Per-user persistent note storage |

---

## 🔒 Security

- All tables protected with **Row Level Security (RLS)**
- Users can only access data within their enrolled workspaces
- Super admins managed via `is_admin` flag on profiles
- Passwords hashed by Supabase Auth (bcrypt)
- Sensitive config stored in `.env.local` — never committed

---
