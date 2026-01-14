import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { env } from "../../config/env.js";

// Structured logger (production-ready)
const logError = (err: unknown, req: Request): void => {
  console.error({
    level: "ERROR",
    timestamp: new Date().toISOString(),
    name: (err as any)?.name || "UnknownError",
    statusCode: (err as AppError)?.statusCode || 500,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id || "anonymous",
    message: (err as any)?.message || "Internal Server Error"
  });
};

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log ALL errors (structured, no PII)
  logError(err, req);

  // 1. AppError (handled errors)
  if (err instanceof AppError) {
    const { statusCode, code, message, isOperational } = err;

    if (isOperational) {
      res.status(statusCode).json({
        status: "error",
        code,
        message
      });
      return;
    }
  }

  // 2. Mongoose Validation Errors
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values((err as any).errors).map((e: any) => e.message);
    res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: messages.join(", ")
    });
    return;
  }

  // 3. Mongoose Cast Errors (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      status: "error",
      code: "INVALID_ID",
      message: "Invalid ID format"
    });
    return;
  }

  // 4. MongoDB Duplicate Key
  if ((err as any)?.name === "MongoError" && (err as any)?.code === 11000) {
    res.status(409).json({
      status: "error",
      code: "DUPLICATE_KEY",
      message: "Resource already exists"
    });
    return;
  }

  // 5. JWT Errors
  if ((err as any)?.name === "JsonWebTokenError" || (err as any)?.name === "TokenExpiredError") {
    res.status(401).json({
      status: "error",
      code: "AUTH_INVALID_TOKEN",
      message: "Authentication required"
    });
    return;
  }

  // 6. Zod Validation Errors
  if ((err as any)?.name === "ZodError") {
    res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Invalid request data"
    });
    return;
  }

  // 7. Generic Server Error (programmer bugs)
  res.status(500).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message: env.NODE_ENV === "development" ? (err as Error)?.message || "Unknown error" : "Internal Server Error"
  });
};
