import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { submissionRouter } from "./modules/submissions/submission.routes.js";
import { fileRouter } from "./modules/files/file.routes.js";
import studentProfileRouter from "./modules/studentProfiles/studentProfile.routes.js";
import { errorHandler } from "./core/middleware/errorHandler.js";
const app = express();
// 1. Security headers FIRST
app.use(helmet({
    contentSecurityPolicy: false // Customize per frontend later
}));
// 2. CORS (credentials: true for cookies)
app.use(cors({
    origin: env.CORS_ORIGIN, // http://localhost:5173
    credentials: true
}));
// 3. Body parsing (strict limits)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// 4. Cookie parsing (JWT tokens)
app.use(cookieParser());
// 5. Health check (always available)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
// 6. Auth routes
app.use("/auth", authRouter);
// 7. Submission routes
app.use("/api/submissions", submissionRouter);
// 8. Student profile routes
app.use("/api/student/profile", studentProfileRouter);
// 9. File upload/download routes
app.use("/api/files", fileRouter);
// 10. 404 handler (minimal)
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found"
    });
});
// 11. Global error handler (LAST middleware)
app.use(errorHandler);
export default app;
