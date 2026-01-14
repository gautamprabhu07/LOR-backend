import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z
        .string()
        .regex(/^\d+$/)
        .default("4000"),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    JWT_ACCESS_SECRET: z
        .string()
        .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"), // short-lived
    // refresh can be added later
    EMAIL_API_KEY: z.string().min(1, "EMAIL_API_KEY is required"),
    EMAIL_FROM: z.string().email(),
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z.string().min(1, "SMTP_PORT is required"),
    SMTP_USER: z.string().min(1, "SMTP_USER is required"),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
    FRONTEND_URL: z.string().url().optional().default("http://localhost:5173"),
    CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
    COOKIE_DOMAIN: z.string().min(1, "COOKIE_DOMAIN is required"),
    COOKIE_SECURE: z
        .string()
        .optional() // "true"/"false", consumed where cookie is set
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Environment validation failed");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1); // fail fast if critical config missing
}
export const env = parsed.data;
