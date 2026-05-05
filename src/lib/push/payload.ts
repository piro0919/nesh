import { z } from "zod";

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  url: z.string().url().optional().nullable(),
  // Optional list of external_user_id values to target. Omitted/empty = broadcast.
  userIds: z.array(z.string().trim().min(1).max(256)).max(1000).optional(),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
