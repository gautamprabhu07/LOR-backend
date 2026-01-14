import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./db/index.js";
const port = Number(env.PORT) || 4000;
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    process.exit(0);
};
const start = async () => {
    try {
        // 1. Connect DB (fail-fast)
        await connectDb();
        // 2. Create HTTP server
        const server = http.createServer(app);
        // 3. Start listening
        const serverInstance = server.listen(port, () => {
            console.log(`🚀 Server running: http://localhost:${port}`);
            console.log(`📱 Environment: ${env.NODE_ENV}`);
            console.log(`🌍 CORS Origin: ${env.CORS_ORIGIN}`);
        });
        // 4. Graceful shutdown handlers
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        // 5. Unhandled error safety nets
        process.on("unhandledRejection", (reason, promise) => {
            console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
            // Don't exit, let PM2/systemd restart
        });
        process.on("uncaughtException", (err) => {
            console.error("💥 Uncaught Exception:", err);
            // Exit so PM2 can restart
            process.exit(1);
        });
        // Export for testing
        globalThis.server = serverInstance;
    }
    catch (error) {
        console.error("💀 Failed to start server:", error);
        process.exit(1);
    }
};
// Start server
void start();
