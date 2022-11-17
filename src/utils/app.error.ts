export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isAppError: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isAppError = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
