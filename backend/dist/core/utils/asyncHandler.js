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
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
