# SCIS Connect Mobile — Remove Startup Notification on App Boot

## 1. Problem Statement
When launching or booting the mobile application (**SCIS Connect Mobile**), students and testers experienced an unwanted notification alert popping up in the system status bar and floating in-app banner with the header `"SCIS CONNECT ALERT"` / `"NEW PLACEMENT DRIVE"`.

## 2. Root Cause Analysis
1. In `app/_layout.tsx`, upon app initialization (`RootLayout`), `jobWatcher.syncAndCheckJobs()` was invoked immediately after initializing the notification engine.
2. In `features/placement/jobWatcher.ts`, `inspectAndNotifyNewJobs()` checked if incoming jobs existed in the persistent `knownJobIds` set. If the set had historical IDs (e.g. 13 jobs saved previously) and the backend returned 20 jobs (including 7 jobs posted earlier), `jobWatcher` treated all 7 unindexed jobs as "newly published" on boot.
3. As a result, it triggered `notificationEngine.trigger("JOB_POSTED", ...)`, which scheduled system notifications and displayed the animated floating in-app banner upon booting the app.
4. Additionally, whenever `usePlacementCenterStore.getState().fetchJobs()` was triggered during screen mounts, it called `inspectAndNotifyNewJobs(jobs)` without silent protection.

## 3. Implementation Details

### A. Silent Baseline Initialization (`features/placement/jobWatcher.ts`)
- Added optional `{ silent?: boolean }` options parameter to `inspectAndNotifyNewJobs(jobs, options)` and `syncAndCheckJobs(options)`.
- On cold boot (when `!this.isInitialized`), `jobWatcher` now restores previously stored IDs and **silently merges** all currently fetched server jobs into `knownJobIds`.
- The merged baseline is persisted directly to `SecureStore` (`scis_known_job_ids`), and the method returns immediately without dispatching any system notifications or in-app banners.
- Added explicit support for `options?.silent`: when `silent: true`, any unseen job IDs are added to `knownJobIds` and saved to storage silently.

### B. Startup & Foreground Synchronization (`app/_layout.tsx`)
- Updated the initial bootstrap sync in `_layout.tsx` to pass `{ silent: true }`:
  ```ts
  notificationEngine.init().then(() => {
    // Trigger initial silent baseline sync for latest published jobs
    jobWatcher.syncAndCheckJobs({ silent: true }).catch((err) => {
      logger.debug("LAYOUT", "Initial job sync skipped", err);
    });
  });
  ```
- Updated the `AppState` foreground resume listener to synchronize with `{ silent: true }`.
- Preserved active notification detection (`{ silent: false }`) exclusively for the 60-second periodic background polling interval when the app is actively running.

### C. Placement Store Job Fetch (`features/placement/store.ts`)
- Updated `fetchJobs()` in `usePlacementCenterStore` to invoke `jobWatcher.inspectAndNotifyNewJobs(jobs, { silent: true })` so student browsing, search, and tab transitions never trigger spurious alert banners.

## 4. Verification
- Ran full TypeScript compilation: `npx tsc --noEmit` -> 0 errors.
- Verified that cold boot, app restart, and manual tab navigation establish the baseline silently without any notifications appearing.
