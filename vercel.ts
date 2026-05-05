import type { VercelConfig } from "@vercel/config/v1/types";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [{ path: "/api/cron/dispatch", schedule: "* * * * *" }],
};

export default config;
