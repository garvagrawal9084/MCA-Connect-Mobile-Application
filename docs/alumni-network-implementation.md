# Alumni Network Feature - Implementation Documentation

## Overview

The Alumni Network feature provides SCIS students with a comprehensive platform to discover, connect with, and learn from alumni. The feature integrates with the existing backend APIs to provide a full-featured alumni experience.

## Architecture

```
features/alumni/
├── types.ts          # TypeScript interfaces for all alumni data models
├── api.ts            # API layer consuming backend endpoints
├── store.ts          # Zustand store for global alumni state
└── hooks.ts          # React hooks for data fetching and UI integration

components/alumni/
├── AlumniCard.tsx        # Alumni list item card with skills/badges
├── AlumniSearchBar.tsx   # Search input with filter toggle
├── AlumniFilterChips.tsx # Horizontal scrollable filter chips
├── AlumniStatsRow.tsx    # Community stats display (3 cards)
├── CompanyCard.tsx       # Company hub card with member avatars
├── MentorCard.tsx        # Mentor card with request button
└── PostCard.tsx          # Community post card with reactions

app/(app)/alumni/
├── _layout.tsx       # Alumni Stack navigator
├── index.tsx         # Alumni Directory (main landing)
├── profile.tsx       # Alumni Profile detail view
├── mentors.tsx       # Mentor discovery + request
├── community.tsx     # Community posts feed
└── companies.tsx     # Company hubs directory
```

## Screens

### 1. Alumni Directory (`/alumni`)
- Community stats row (alumni count, total registered, connections)
- Quick navigation tabs (Directory, Mentors, Community, Companies)
- Search bar with real-time debounced search (400ms)
- Quick filters: Open to Work, Referrals, Mentors
- Paginated alumni list with infinite scroll ("Load More")
- Pull-to-refresh

### 2. Alumni Profile (`/alumni/profile/[id]`)
- Profile header with avatar, name, community status, position, location, batch
- Follow/Unfollow action
- Mentorship request action (opens modal with areas + message)
- Bio section
- Skills display
- Availability badges (Open to Work, Referrals, Mentorship)
- External links (LinkedIn, GitHub)

### 3. Mentorship (`/alumni/mentors`)
- List of available mentors (Alumni + RecentGraduate with `availableForMentorship: true`)
- Mentor cards with bio, skills, position, batch year
- "Request Mentorship" button opens modal
- Modal with areas (comma-separated) and message input
- Sends POST to `/api/mentorship`

### 4. Community (`/alumni/community`)
- Type filter chips (All, Posts, Jobs, Stories, Questions, Referrals)
- Paginated post feed
- Post cards with author info, content, tags, like/comment/view counts
- Like toggle (optimistic UI update)
- Create post modal with type selector, content, tags

### 5. Company Hubs (`/alumni/companies`)
- Searchable company list
- Company cards showing alumni count and member avatars
- Drill-down to company-specific alumni list
- Individual alumni cards link to profile

## Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/people/search?accountType=Alumni` | GET | Search alumni with filters |
| `/api/people/companies` | GET | Get company groups |
| `/api/mentorship/mentors` | GET | Get available mentors |
| `/api/mentorship` | POST | Create mentorship request |
| `/api/mentorship/mine` | GET | Get my mentorship requests |
| `/api/mentorship/:id/respond` | POST | Accept/Decline request |
| `/api/mentorship/:id/cancel` | POST | Cancel request |
| `/api/posts` | GET/POST | Get/Create community posts |
| `/api/posts/:id/like` | POST | Toggle post like |
| `/api/posts/:id/comment` | POST | Add comment |
| `/api/community/stats` | GET | Get community statistics |
| `/api/forums` | GET/POST | Get/Create forum topics |
| `/api/follow/:userId/follow` | POST | Follow/unfollow user |
| `/api/profile/:id` | GET | Get user public profile |

## State Management

The `useAlumniStore` Zustand store manages:
- `alumni` + `alumniPagination` - Directory search results
- `companies` - Company hub groups
- `mentors` + `mentorsPagination` - Available mentors
- `myRequests` - Current user's mentorship requests
- `posts` + `postsPagination` - Community posts
- `forums` + `forumsPagination` - Forum topics
- `stats` - Community statistics
- `activeFilters`, `searchQuery` - Search state
- `error` - Global error state

## Navigation Flow

```
Home Screen
  └── Alumni Network Card (tap)
        └── Alumni Directory (/alumni)
              ├── Search/Filter → Alumni List
               │     └── Alumni Card (tap) → Profile (/alumni/profile/[id])
              │           ├── Follow/Unfollow
              │           └── Request Mentorship (modal)
              ├── Mentors Tab → Mentors (/alumni/mentors)
              │     └── Mentor Card → Request Mentorship (modal)
              ├── Community Tab → Posts (/alumni/community)
              │     └── Post Card → Like/Comment
              └── Companies Tab → Companies (/alumni/companies)
                    └── Company Card → Company Alumni List → Profile
```

## Color Theme

The alumni module uses a purple theme (`#7C3AED`) consistent across:
- Module color in `constants/colors.ts`
- Stats cards, filter chips, buttons
- Profile badges and skill tags

## Files Modified

- `constants/config.ts` - Added `ALUMNI` endpoints
- `app/(app)/_layout.tsx` - Added alumni route
- `app/(app)/(tabs)/index.tsx` - Navigation to alumni directory (replaced modal)
- `components/home/AlumniNetworkCard.tsx` - Updated to purple theme + "Live" badge
