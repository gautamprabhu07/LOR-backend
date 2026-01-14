import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, "FORBIDDEN_ERROR", true);
  }
}
