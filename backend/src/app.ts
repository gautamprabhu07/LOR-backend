import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { submissionRouter } from "./modules/submissions/submission.routes.js";
import { fileRouter } from "./modules/files/file.routes.js";
import studentProfileRouter from "./modules/studentProfiles/studentProfile.routes.js";
import facultyProfileRouter, {
  adminRouter as facultyAdminRouter,
  directoryRouter as facultyDirectoryRouter
} from "./modules/facultyProfiles/facultyProfile.routes.js";
import { errorHandler } from "./core/middleware/errorHandler.js";

const app = express();

// 1. Security headers FIRST
app.use(
  helmet({
    contentSecurityPolicy: false // Customize per frontend later
  })
);

// 2. CORS (credentials: true for cookies)
const configuredOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    env.FRONTEND_URL
  ].filter(Boolean))
);

const allowAnyOrigin = configuredOrigins.includes("*");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowAnyOrigin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    optionsSuccessStatus: 200
  })
);

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

// 8.1 Faculty profile routes
app.use("/api/faculty/profile", facultyProfileRouter);
app.use("/api/faculty/profiles", facultyAdminRouter);
app.use("/api/faculty/directory", facultyDirectoryRouter);

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
