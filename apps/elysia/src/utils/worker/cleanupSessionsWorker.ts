import { format } from "date-fns";

import { service as authService } from "@/src/api/auth/service";
import { logger } from "@/src/libs";

export const cleanupSessionsWorker = async () => {
  const res = await authService.removeExpiredRefreshSessions();

  logger.info(
    {
      at: format(new Date(), "dd-MM-yyyy HH:mm:ss"),
      count: res.count,
      scope: "cron",
    },
    "expired sessions cleanup finished",
  );
};
