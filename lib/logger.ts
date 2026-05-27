import { env } from "./env";

type LogLevel = "info" | "warn" | "error";

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(data && { data }),
      env: env.NODE_ENV,
    };

    if (env.NODE_ENV === "production") {
      // In production, you would typically send this to a service like Logtail or Sentry
      console.log(JSON.stringify(logData));
    } else {
      const color = {
        info: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
      }[level];
      console.log(`${color}[${level.toUpperCase()}] ${timestamp}: ${message}\x1b[0m`, data || "");
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  // Specialized POS logger
  checkoutFailure(error: any, cartData: any) {
    this.error("Checkout Failed", { error, cartData });
  }

  syncFailure(error: any, queueItem: any) {
    this.error("Offline Sync Failed", { error, queueItem });
  }
}

export const logger = new Logger();
