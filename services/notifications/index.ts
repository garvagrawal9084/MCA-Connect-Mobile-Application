/**
 * SCIS Connect Mobile - Notification Service Module
 * Exports the scalable notification engine, trigger registry, and types.
 */

export * from "./types";
export * from "./channels";
export * from "./triggerRegistry";
export * from "./notificationPermissions";
export * from "./notificationEngine";
export { notificationEngine as default } from "./notificationEngine";
