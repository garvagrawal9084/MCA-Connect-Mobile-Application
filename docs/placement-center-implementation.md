# Placement Center Implementation Document

## Overview
The **Placement Center** provides SCIS students with a centralized, real-time portal for discovering on-campus recruitment drives, tracking internship opportunities, managing application statuses, bookmarking interesting positions, setting deadline reminders, and browsing interview experiences shared by seniors and peers.

All data is fetched directly from the backend API (`/api/placement-center/*`), adhering strictly to the architecture defined in `app/AGENTS.md`.

---

## Backend API Endpoints Integrated

| Section | Method & Path | Controller Handler | Purpose |
|---|---|---|---|
| **Dashboard Stats** | `GET /api/placement-center/dashboard` | `getStudentDashboard` | Fetches counts for Open Jobs, Internships, New This Week, Applications, Saved, and Reminders |
| **Jobs List** | `GET /api/placement-center/jobs` | `getJobs` | Filtered list supporting search query, `jobType` (job/internship), work mode, and `deadline=closing_soon` |
| **Job Details** | `GET /api/placement-center/jobs/:id` | `getJobById` | Detailed posting information, eligibility criteria verification, and user state |
| **Apply** | `POST /api/placement-center/jobs/:id/apply` | `applyToJob` | Registers student application with placement cell |
| **Save / Bookmark** | `POST /api/placement-center/jobs/:id/save`<br>`DELETE /api/placement-center/jobs/:id/save` | `saveJob`<br>`unsaveJob` | Toggles bookmark status with optimistic UI updates |
| **Reminders** | `POST /api/placement-center/jobs/:id/reminder`<br>`DELETE /api/placement-center/reminders/:id` | `createReminder`<br>`deleteReminder` | Schedules and cancels push notification reminders prior to deadline |
| **Applications** | `GET /api/placement-center/applications/me` | `getMyApplications` | Current student's active application submissions and statuses |
| **Experiences** | `GET /api/placement-center/experiences`<br>`POST /api/placement-center/experiences/:id/upvote` | `getExperiences`<br>`upvoteExperience` | Peer interview archives, round breakdowns, difficulty ratings, and helpfulness upvotes |

---

## File Architecture

```
features/placement/
├── types.ts                    # TypeScript definitions for PlacementJob, DashboardStats, Applications, etc.
├── api.ts                      # Standardized HTTP API client consuming /api/placement-center/*
├── store.ts                    # Zustand store managing server cache, filters, and optimistic actions
├── hooks.ts                    # Custom hooks (usePlacementDashboard, usePlacementJobs, useJobActions)
└── index.ts                    # Public feature exports

components/placement/
├── PlacementCenterHeader.tsx   # Top header with icon, title, subtitle & back navigation
├── PlacementMetricGrid.tsx     # 6 metric summary cards matching reference visual design
├── PlacementFilterTabs.tsx     # Category selector pills (Jobs, Internships, Saved, Applications, Experiences)
├── PlacementSearchBar.tsx      # Debounced search bar with live indicators & instant clear
├── PlacementJobCard.tsx        # Top-accented job card with initial avatar, verified badge, package & mode
├── PlacementClosingSoonCard.tsx # Compact urgent-deadline card with "Closing soon" tag and date
└── PlacementJobDetailModal.tsx # Interactive drill-down modal sheet for full details, apply & reminder

app/(app)/placement/
├── _layout.tsx                 # Placement stack navigator
├── index.tsx                   # Placement root screen
└── center.tsx                  # Dedicated full Placement Center dashboard
```

---

## UI Components & Design Replication

1. **Header & CTA**: Matches the university design with `#8B0000` crimson accents and "Browse All Jobs ->" quick action.
2. **Metric Summary Grid**:
   - `OPEN JOBS` (Crimson)
   - `INTERNSHIPS` (Orange/Crimson)
   - `NEW THIS WEEK` (Emerald Green)
   - `APPLICATIONS` (Indigo Purple)
   - `SAVED` (Amber)
   - `REMINDERS` (Purple)
3. **Category Tabs**:
   - **`[ 💼 Jobs ]`**: Direct, uninterrupted feed of all latest opportunities without tall headers blocking scroll.
   - **`[ ⏳ Closing Soon ]`**: Dedicated tab displaying urgent drives with deadline counts and quick apply.
   - **`[ 📚 Internships ]`**, **`[ 🔖 Saved ]`**, **`[ 📝 Applications ]`**, **`[ 👥 Experiences ]`**.
4. **Latest Jobs & Closing Soon Sections**: Responsive cards with verified badges, deterministic top border accents, and unobtrusive 1-row urgent alerts.
5. **Optimistic Updates**: Instant UI feedback on save/bookmark, deadline reminders, and apply actions accompanied by haptics via `expo-haptics`.
6. **New Job Notification Pipeline**:
   - **Student Alert Preference**: In-app toggle on Placement Center to subscribe/mute instant notifications when new jobs are posted.
   - **Notification Center Integration** (`/notifications`): Real-time feed highlighting `NEW_PLACEMENT_NOTICE` cards with CTC, deadlines, unread indicators, and 1-tap drill-down into the job details modal.
   - **Tab Bar Badge**: Real-time unread count indicator on the Notifications bottom tab icon.
   - **Admin/Staff Broadcast Action**: One-tap trigger in job detail modal calling `POST /api/placement/jobs/:id/send-notifications` to broadcast push notifications & emails to all eligible students.
