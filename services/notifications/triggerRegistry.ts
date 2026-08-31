/**
 * SCIS Connect Mobile - Notification Trigger Registry
 * Central, extensible registry of all domain event triggers in the application.
 *
 * To add a new notification trigger in the future:
 * 1. Add the trigger definition in this registry.
 * 2. Call `notificationEngine.trigger("TRIGGER_NAME", payload)` anywhere in the app!
 */

import { TriggerDefinition, TriggerPayloadMap } from "./types";
import { NOTIFICATION_CHANNELS } from "./channels";

export const triggerRegistry: Record<string, TriggerDefinition<any>> = {
  JOB_POSTED: {
    channelId: NOTIFICATION_CHANNELS.PLACEMENT_JOBS.id,
    defaultPriority: "high",
    preferenceKey: "jobAlertsEnabled",
    formatter: (payload) => {
      let pkgText = "";
      if (payload.package) {
        const pkgNum = Number(payload.package);
        pkgText = isNaN(pkgNum) ? String(payload.package) : `₹${(pkgNum / 100000).toFixed(1)} LPA`;
      } else if (payload.stipend) {
        const stNum = Number(payload.stipend);
        pkgText = isNaN(stNum) ? String(payload.stipend) : `₹${stNum.toLocaleString("en-IN")}/mo`;
      }

      const bodyParts = [payload.jobTitle || "New Opportunity"];
      if (pkgText) bodyParts.push(pkgText);
      if (payload.location) bodyParts.push(payload.location);

      return {
        title: `💼 New Job: ${payload.companyName || "Campus Placement"}`,
        body: `${bodyParts.join(" • ")}. Tap to view eligibility & apply!`,
        subTitle: "SCIS Placement Drive",
        data: {
          type: "JOB_POSTED",
          jobId: payload.jobId,
          companyName: payload.companyName,
          screen: "/(app)/placement/center",
          action: "open_job_detail",
          url: payload.link,
        },
      };
    },
  },

  APPLICATION_DEADLINE: {
    channelId: NOTIFICATION_CHANNELS.APPLICATION_UPDATES.id,
    defaultPriority: "high",
    preferenceKey: "deadlineRemindersEnabled",
    formatter: (payload) => ({
      title: `⏳ Deadline Alert: ${payload.companyName}`,
      body: `Applications for ${payload.jobTitle} close ${
        payload.hoursRemaining ? `in ${payload.hoursRemaining} hours` : "very soon"
      }. Don't miss out!`,
      subTitle: "Application Deadline",
      data: {
        type: "APPLICATION_DEADLINE",
        jobId: payload.jobId,
        screen: "/(app)/placement/center",
        action: "open_job_detail",
      },
    }),
  },

  APPLICATION_STATUS_UPDATE: {
    channelId: NOTIFICATION_CHANNELS.APPLICATION_UPDATES.id,
    defaultPriority: "high",
    preferenceKey: "jobAlertsEnabled",
    formatter: (payload) => ({
      title: `📋 Application Update: ${payload.companyName}`,
      body: `Your application status for ${payload.jobTitle} is now: ${payload.status}.`,
      subTitle: "Placement Cell Update",
      data: {
        type: "APPLICATION_STATUS_UPDATE",
        jobId: payload.jobId,
        screen: "/(app)/(tabs)/notifications",
      },
    }),
  },

  RESULT_PUBLISHED: {
    channelId: NOTIFICATION_CHANNELS.ACADEMIC_RESULTS.id,
    defaultPriority: "high",
    preferenceKey: "resultsPublishedEnabled",
    formatter: (payload) => ({
      title: `📊 Results Announced: ${payload.testTitle}`,
      body: `Scores are now available.${payload.rank ? ` Your Rank: #${payload.rank}.` : ""} Tap to inspect full assessment breakdown.`,
      subTitle: "Assessment & Results",
      data: {
        type: "RESULT_PUBLISHED",
        resultId: payload.resultId,
        screen: "/(app)/placement/center",
        tab: "results",
      },
    }),
  },

  CAMPUS_ANNOUNCEMENT: {
    channelId: NOTIFICATION_CHANNELS.CAMPUS_ANNOUNCEMENTS.id,
    defaultPriority: "default",
    preferenceKey: "announcementsEnabled",
    formatter: (payload) => ({
      title: `📢 ${payload.title}`,
      body: payload.message,
      subTitle: "SCIS Notice Board",
      data: {
        type: "CAMPUS_ANNOUNCEMENT",
        announcementId: payload.announcementId,
        screen: "/(app)/(tabs)/notifications",
      },
    }),
  },

  CHALLENGE_INVITE: {
    channelId: NOTIFICATION_CHANNELS.GENERAL.id,
    defaultPriority: "default",
    formatter: (payload) => ({
      title: `⚡ Coding Challenge: ${payload.title}`,
      body: `A new competitive coding challenge is open!${payload.points ? ` Earn ${payload.points} Points.` : ""}`,
      subTitle: "SCIS Challenges",
      data: {
        type: "CHALLENGE_INVITE",
        challengeId: payload.challengeId,
        screen: "/(app)/(tabs)/index",
      },
    }),
  },

  CUSTOM_ALERT: {
    channelId: NOTIFICATION_CHANNELS.GENERAL.id,
    defaultPriority: "default",
    formatter: (payload) => ({
      title: payload.title || "SCIS Connect Alert",
      body: payload.body || "",
      data: payload.data || { type: "CUSTOM_ALERT" },
    }),
  },
};

/**
 * Register or override a trigger definition at runtime
 */
export function registerNotificationTrigger<T = Record<string, unknown>>(
  triggerName: string,
  definition: TriggerDefinition<T>
) {
  triggerRegistry[triggerName] = definition as unknown as TriggerDefinition<any>;
}
