import mongoose from "mongoose";
import { AppError } from "../errors/AppError.js";
import { env } from "../../config/env.js";
// Structured logger (production-ready)
const logError = (err, req) => {
    console.error({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        name: err?.name || "UnknownError",
        statusCode: err?.statusCode || 500,
        path: req.path,
        method: req.method,
        userId: req.user?.id || "anonymous",
        message: err?.message || "Internal Server Error"
    });
};
export const errorHandler = (err, req, res, next) => {
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
        const messages = Object.values(err.errors).map((e) => e.message);
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
    if (err?.name === "MongoError" && err?.code === 11000) {
        res.status(409).json({
            status: "error",
            code: "DUPLICATE_KEY",
            message: "Resource already exists"
        });
        return;
    }
    // 5. JWT Errors
    if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
        res.status(401).json({
            status: "error",
            code: "AUTH_INVALID_TOKEN",
            message: "Authentication required"
        });
        return;
    }
    // 6. Zod Validation Errors
    if (err?.name === "ZodError") {
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
        message: env.NODE_ENV === "development" ? err?.message || "Unknown error" : "Internal Server Error"
    });
};
