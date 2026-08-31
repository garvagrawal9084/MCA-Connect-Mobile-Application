/**
 * SCIS Connect Mobile - Placement Job Watcher & Real-time Trigger Service
 * Monitors incoming placement job feeds, identifies newly published jobs,
 * and automatically dispatches system notification bar alerts.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { PlacementJob } from "./types";
import { placementCenterApi } from "./api";
import { notificationEngine } from "@/services/notifications";
import { logger } from "@/utils/logger";

const STORAGE_KEY_KNOWN_JOBS = "scis_known_job_ids";

async function getStoredJobIds(): Promise<string[] | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = window.localStorage.getItem(STORAGE_KEY_KNOWN_JOBS);
        return item ? JSON.parse(item) : null;
      }
      return null;
    }
    const isAvail = await SecureStore.isAvailableAsync();
    if (isAvail) {
      const item = await SecureStore.getItemAsync(STORAGE_KEY_KNOWN_JOBS);
      return item ? JSON.parse(item) : null;
    }
    return null;
  } catch (err) {
    logger.debug("JOB_WATCHER", "Failed to read stored job IDs", err);
    return null;
  }
}

async function saveStoredJobIds(ids: string[]): Promise<void> {
  try {
    // Keep most recent 500 IDs to avoid unbounded growth
    const trimmed = ids.slice(-500);
    const json = JSON.stringify(trimmed);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_KNOWN_JOBS, json);
      }
      return;
    }
    const isAvail = await SecureStore.isAvailableAsync();
    if (isAvail) {
      await SecureStore.setItemAsync(STORAGE_KEY_KNOWN_JOBS, json);
    }
  } catch (err) {
    logger.debug("JOB_WATCHER", "Failed to save stored job IDs", err);
  }
}

class JobWatcher {
  private knownJobIds: Set<string> = new Set();
  private isInitialized: boolean = false;

  /**
   * Inspect a list of fetched jobs.
   * On initial cold boot:
   *  - Restores known job IDs from persistent SecureStore.
   *  - If store has historical IDs, any newer job will trigger instant notifications!
   *  - If fresh installation, establishes baseline and saves to storage.
   * On subsequent updates/polls: triggers system status bar notifications for every newly published job.
   */
  async inspectAndNotifyNewJobs(jobs: PlacementJob[]): Promise<void> {
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return;

    // Load persisted known IDs on cold boot
    if (!this.isInitialized) {
      const storedIds = await getStoredJobIds();
      if (storedIds && Array.isArray(storedIds) && storedIds.length > 0) {
        this.knownJobIds = new Set(storedIds);
        this.isInitialized = true;
        logger.info("JOB_WATCHER", `Restored ${this.knownJobIds.size} known job IDs from persistent storage`);
      } else {
        // Fresh installation: baseline existing jobs without spamming
        jobs.forEach((job) => {
          const id = job._id;
          if (id) this.knownJobIds.add(id);
        });
        this.isInitialized = true;
        await saveStoredJobIds(Array.from(this.knownJobIds));
        logger.info("JOB_WATCHER", `Initialized fresh baseline with ${this.knownJobIds.size} job IDs`);
        return;
      }
    }

    // Detect freshly published jobs (jobs whose _id is not in knownJobIds)
    const newJobs = jobs.filter((job) => {
      const id = job._id;
      if (!id) return false;
      const isPublished =
        !job.status ||
        job.status === "published" ||
        job.derivedStatus === "open" ||
        job.derivedStatus === "published";
      return isPublished && !this.knownJobIds.has(id);
    });

    if (newJobs.length === 0) {
      return;
    }

    logger.info("JOB_WATCHER", `Detected ${newJobs.length} new job posting(s)! Dispatching notifications...`);

    for (const job of newJobs) {
      const id = job._id;
      if (id) this.knownJobIds.add(id);

      const companyName =
        job.companyName ||
        (typeof job.company === "object" ? job.company?.name : job.company) ||
        "Campus Placement";

      const rawJob = job as unknown as Record<string, unknown>;
      const salaryPackage =
        job.package ||
        (typeof rawJob.ctc === "number" ? (rawJob.ctc as number) : undefined);

      await notificationEngine.trigger("JOB_POSTED", {
        jobId: id,
        jobTitle: job.title || "Software Opportunity",
        companyName,
        package: salaryPackage as number | undefined,
        stipend: job.stipend,
        jobType: job.jobType,
        location: job.location,
        deadline: job.applicationDeadline,
        link: job.officialLink || job.applyUrl || job.careersPage,
      });
    }

    // Persist updated known IDs
    await saveStoredJobIds(Array.from(this.knownJobIds));
  }

  /**
   * Proactively polls the latest jobs from backend and inspects for newly published opportunities
   */
  async syncAndCheckJobs(): Promise<number> {
    try {
      const res = await placementCenterApi.getJobs({ limit: 20 });
      const rawJobs = res.data?.jobs || [];
      const jobs = rawJobs.filter((j) => j.hiddenFromUsers !== true);
      if (jobs.length > 0) {
        await this.inspectAndNotifyNewJobs(jobs);
      }
      return jobs.length;
    } catch (err) {
      logger.debug("JOB_WATCHER", "Silent sync jobs check skipped", err);
      return 0;
    }
  }

  /**
   * Helper utility to simulate a newly posted job for testing notification bar appearance & deep-linking
   */
  async simulateNewJobTrigger(custom?: Partial<PlacementJob>): Promise<string | null> {
    const mockId = custom?._id || `sim-job-${Date.now()}`;
    const company = custom?.companyName || "Google India";
    const title = custom?.title || "Full Stack Software Engineer";

    logger.info("JOB_WATCHER", `Simulating new job notification trigger: ${company} (${title})`);

    return notificationEngine.trigger(
      "JOB_POSTED",
      {
        jobId: mockId,
        jobTitle: title,
        companyName: company,
        package: custom?.package || 2400000,
        location: custom?.location || "Hyderabad / Bengaluru",
        jobType: custom?.jobType || "Full-Time",
        deadline: custom?.applicationDeadline || "30 Sep 2026",
        link: custom?.officialLink || "https://careers.google.com",
      },
      { force: true }
    );
  }

  /**
   * Reset watcher state (useful on logout)
   */
  reset(): void {
    this.knownJobIds.clear();
    this.isInitialized = false;
  }
}

export const jobWatcher = new JobWatcher();
export default jobWatcher;
