import { ErrorCode } from "@/constants/errorCodes";
import { ERROR_MAP } from "@/constants/errorDefinitions";
class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details: unknown;
  constructor(code: ErrorCode, customMessage?: string, details?: unknown) {
    const errorDef = ERROR_MAP[code];

    super(customMessage || errorDef.message);

    this.statusCode = errorDef.statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this);
  }
}
export default AppError;
