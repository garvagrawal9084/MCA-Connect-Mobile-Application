import { apiClient } from "@/services/api";
import { storageService } from "@/services/storage";
import { logger } from "@/utils/logger";

type PushEvent = "received" | "opened";

export async function recordRemotePushEvent(
  data: Record<string, unknown> | undefined,
  event: PushEvent
): Promise<void> {
  const broadcastId = typeof data?.pushBroadcastId === "string"
    ? data.pushBroadcastId
    : "";

  if (!broadcastId || !storageService.getAccessToken()) return;

  try {
    const pushToken = await storageService.getExpoPushToken();
    await apiClient.post("/api/notifications/push-events", {
      broadcastId,
      event,
      pushToken: pushToken || undefined,
    });
  } catch (error) {
    // Analytics must never interrupt notification display or navigation.
    logger.debug("NOTIFICATIONS", `Could not record remote push ${event} event`, error);
  }
}
