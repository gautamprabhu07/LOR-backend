export class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
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
