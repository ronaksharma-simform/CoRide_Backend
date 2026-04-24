import { ErrorCode } from "@/errors/errorCodes";
import { ERROR_MAP } from "@/errors/errorDefinitions";

class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  constructor(code: ErrorCode, customMessage?: string) {
    const errorDef = ERROR_MAP[code];

    super(customMessage || errorDef.message);

    this.statusCode = errorDef.statusCode;
    this.code = code;

    Error.captureStackTrace(this);
  }
}
export default AppError;
