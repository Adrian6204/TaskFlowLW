
# TaskFlow

TaskFlow is a modern, responsive web application for tracking and managing daily employee tasks. It features a Kanban-style board, task creation/editing, real-time time tracking, and an AI-powered suite of tools using the Google Gemini API to optimize your workflow.

## ✨ Key Features

### ⚡️ Core Productivity
- **Dual Views**: Visualize your workflow with a classic Kanban Board or a monthly Calendar View.
- **Time Tracking**: Built-in start/stop timers on every task. Track duration and view detailed session history logs.
- **Subtasks & Checklists**: Break complex tasks into actionable steps. Use AI to automatically generate checklist items based on the task description.
- **Smart Tagging**: Organize tasks with custom, color-coded tags. Includes an intelligent autocomplete system for quick tagging.
- **Task Dependencies**: Create "blocking" relationships between tasks to ensure work is completed in the correct order.
- **Real-time Database**: Powered by Supabase for instant updates and team collaboration.

### 🎨 User Experience
- **Modern UI/UX**: A polished, split-screen login page with responsive design and smooth transitions.
- **Dark Mode**: Fully supported dark theme that respects system preferences.
- **Drag & Drop**: Intuitively move tasks between columns to update status.
- **Advanced Filtering**: Quickly find tasks by searching titles/tags or filtering by assignee and priority.

## 🏁 Getting Started

### 1. Database Setup (Supabase)
This project requires a Supabase database.
1. Create a new project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the file `supabase_schema.sql` located in the root of this repository.
4. Copy the entire content and paste it into the Supabase SQL Editor.
5. Click **Run** to create the tables and security policies.

### 2. Environment Variables
Create a `.env` file locally or set up environment variables in Vercel:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Public API Key.
- `SUPABASE_ANON_KEY`: Your Supabase Public API Key.

### 3. Running Locally
```bash
npm install
npm run dev
```

## 📂 Project Structure

```
/
├── public/
├── src/
│   ├── auth/
│   ├── components/
│   ├── services/
│   │   └── supabaseService.ts    # Database logic
│   ├── App.tsx                   # Main application logic
│   └── types.ts                  # TypeScript definitions
├── supabase_schema.sql           # Database setup script
├── index.html
└── metadata.json
```
