import { AppError } from "./AppError.js";
export class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, "NOT_FOUND", true);
    }
}
