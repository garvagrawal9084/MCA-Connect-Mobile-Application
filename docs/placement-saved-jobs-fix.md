# Placement Center Saved Jobs Fix Documentation

## Overview
This document details the resolution for the **Saved Jobs** functionality within the **SCIS Connect Placement Center** (`/placement/center`).

Previously:
1. Saved jobs were not displaying on the "Saved" tab (`activeTab === 'saved'`).
2. The "SAVED" metric card sometimes displayed a non-zero count, but switching to the tab displayed "No saved opportunities yet" and reset the count back to 0.

---

## Backend API Endpoints & Contracts

The SCIS backend provides active endpoints for bookmark management:

| Method & Route | Purpose | Payload / Parameters |
|---|---|---|
| `GET /api/placement/bookmarks` | Primary bookmark list query | Bearer Token Required |
| `GET /api/placement/jobs/saved` | Secondary / alternate saved jobs feed | Bearer Token Required |
| `POST /api/placement/jobs/:id/save` | Bookmark a recruitment drive | Optional `{ collectionId?: string }` |
| `DELETE /api/placement/jobs/:id/save` | Remove bookmark from drive | None |

---

## Root Causes Identified & Resolved

### 1. Response Envelope Unwrapping
- **Root Cause**: The API client unrolls JSON responses as `res.data`. Depending on backend route controllers, `res.data` can be an Array directly (`[ ... ]`), `{ bookmarks: [ ... ] }`, `{ saved: [ ... ] }`, `{ savedJobs: [ ... ] }`, or `{ jobs: [ ... ] }`.
- **Fix**: Created `extractBookmarksArray(raw)` in `features/placement/store.ts` to defensively unwrap every possible envelope shape.

### 2. UI Object Extraction Failure
- **Root Cause**: `center.tsx` previously did `bookmarks.map(b => typeof b.job === 'object' ? b.job : null)`. When the API returned direct `PlacementJob` items or string ID references (`{ job: "6a8..." }`), `b.job` evaluated to `undefined`/string, causing all items to evaluate to `null` and producing an empty list `[]`.
- **Fix**: Implemented `normalizeSavedJobItem(item, knownJobs)` to correctly recognize direct `PlacementJob` records, populated `{ job: PlacementJob }` objects, `{ jobId: PlacementJob }` objects, or resolve string ID references against known job lists.

### 3. Store Slice Desynchronization
- **Root Cause**: `toggleSaveJob(jobId)` only updated `jobs` in Zustand, failing to update `bookmarks`, `closingSoonJobs`, `selectedJob`, or persist state locally.
- **Fix**: Updated `toggleSaveJob` to synchronously update all store slices and write to SecureStore via `storageService`.

### 4. Reactive Modal Bookmark State
- **Root Cause**: `PlacementJobDetailModal` used static props passed on opening, so tapping the bookmark icon in the modal did not update the modal's icon state reactively.
- **Fix**: Subscribed to Zustand store state inside `PlacementJobDetailModal` for instant UI feedback.

---

## Verification
- `npx tsc --noEmit`: Passed with 0 errors.
- Verified on iOS and Android layout trees.
