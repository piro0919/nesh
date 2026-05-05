import { z } from "zod";

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  url: z.string().url().optional().nullable(),
});

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
