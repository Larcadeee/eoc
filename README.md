cat << 'EOF' > README.md
# CDRRMD EOC Disaster Management System

A disaster management web application built for the City Disaster Risk Reduction and Management Department (CDRRMD) Emergency Operations Center (EOC).

## Tech Stack
- **Frontend:** React 18, Vite, React Router 6, Tailwind CSS
- **Backend & Database:** Supabase (Auth, PostgreSQL, Row Level Security)
- **State Management:** React Context API (`AuthContext`)

## Role-Based Access Control (RBAC)
- **ADMIN:** User authorization, account approval, role assignment.
- **SUPERVISOR:** Situation Report review queue, validation, publishing, KPI aggregation.
- **ENCODER:** Calamity incident intake, field casualty/displacement data entry, draft generation.
- **VIEWER:** Real-time situation monitor showing only published reports and active alerts.

## Getting Started

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd cdrrmd-eoc
npm install# eoc
