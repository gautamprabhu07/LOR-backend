import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

/**
 * Async error handler wrapper
 * Converts async controller errors → proper error handling pipeline
 * 
 * Usage:
 * export const myController = asyncHandler(async (req, res) => {
 *   const data = await heavyOperation();
 *   res.json(data);
 * });
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
