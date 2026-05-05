import { z } from "zod";

export const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  // Optional external user id from the SDK (next-push >= 0.5.0).
  // Cap the length to prevent abuse; trim and treat empty string as absent.
  userId: z.string().trim().min(1).max(256).optional(),
});

export type SubscriptionPayload = z.infer<typeof subscriptionSchema>;
