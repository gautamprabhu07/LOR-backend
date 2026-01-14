export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintain prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
