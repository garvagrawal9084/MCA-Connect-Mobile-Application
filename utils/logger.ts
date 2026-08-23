/**
 * MCA Connect Mobile - Logger Utility
 * Provides standardized logging conforming to the project's error log specifications.
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private formatTimestamp(): string {
    const now = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const ms = pad(now.getMilliseconds(), 3);
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
  }

  private log(level: LogLevel, module: string, message: string, data?: unknown, error?: Error): LogEntry {
    const timestamp = this.formatTimestamp();
    const entry: LogEntry = {
      timestamp,
      level,
      module,
      message,
      data,
      error,
    };

    const formattedMessage = `[${timestamp}] [${level.padEnd(5)}] [${module}] ${message}`;

    switch (level) {
      case "ERROR":
      case "FATAL":
        console.error(formattedMessage, data ?? "", error ?? "");
        break;
      case "WARN":
        console.warn(formattedMessage, data ?? "");
        break;
      case "INFO":
        console.info(formattedMessage, data ?? "");
        break;
      case "DEBUG":
      default:
        console.debug(formattedMessage, data ?? "");
        break;
    }

    return entry;
  }

  info(module: string, message: string, data?: unknown) {
    return this.log("INFO", module, message, data);
  }

  warn(module: string, message: string, data?: unknown) {
    return this.log("WARN", module, message, data);
  }

  error(module: string, message: string, error?: Error | unknown, data?: unknown) {
    return this.log(
      "ERROR",
      module,
      message,
      data,
      error instanceof Error ? error : undefined
    );
  }

  debug(module: string, message: string, data?: unknown) {
    return this.log("DEBUG", module, message, data);
  }
}

export const logger = new Logger();
export default logger;
