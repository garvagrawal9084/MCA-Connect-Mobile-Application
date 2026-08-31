/**
 * SCIS Connect Mobile - Placement Job Watcher & Real-time Trigger Service
 * Monitors incoming placement job feeds, identifies newly published jobs,
 * and automatically dispatches system notification bar alerts.
 */

import { PlacementJob } from "./types";
import { notificationEngine } from "@/services/notifications";
import { logger } from "@/utils/logger";

class JobWatcher {
  private knownJobIds: Set<string> = new Set();
  private isInitialized: boolean = false;

  /**
   * Inspect a list of fetched jobs.
   * On initial cold boot, seeds known IDs without spamming notifications.
   * On subsequent updates/polls, triggers system status bar notifications for every new job.
   */
  async inspectAndNotifyNewJobs(jobs: PlacementJob[]): Promise<void> {
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) return;

    // Cold boot / First synchronization: Seed known job IDs silently
    if (!this.isInitialized) {
      jobs.forEach((job) => {
        const id = job._id;
        if (id) this.knownJobIds.add(id);
      });
      this.isInitialized = true;
      logger.info("JOB_WATCHER", `Initialized job watcher with ${this.knownJobIds.size} existing job IDs`);
      return;
    }

    // Subsequent updates: Detect freshly published jobs
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
      this.knownJobIds.add(id);

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
