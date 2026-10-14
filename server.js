const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// LOAD ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const adminRoutes = require("./routes/adminRoutes");
const eventRoutes = require("./routes/eventRoutes");

console.log("Auth routes loaded");
console.log("Achievement routes loaded");
console.log("Admin routes loaded");
console.log("Event routes loaded");

// =====================================================
// CHECK REGISTERED ACHIEVEMENT ROUTES
// =====================================================

console.log("\n========== ACHIEVEMENT ROUTE CHECK ==========");

console.log("Router type:", typeof achievementRoutes);
console.log(
    "Router stack exists:",
    Array.isArray(achievementRoutes.stack)
);

if (Array.isArray(achievementRoutes.stack)) {
    achievementRoutes.stack.forEach((layer, index) => {
        if (layer.route) {
            console.log(
                index,
                Object.keys(layer.route.methods)
                    .map(method => method.toUpperCase())
                    .join(","),
                layer.route.path
            );
        }
    });
}

console.log("==============================================\n");

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
    console.log(
        new Date().toISOString(),
        req.method,
        req.originalUrl
    );

    next();
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/achievements", achievementRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/events", eventRoutes);

// =====================================================
// UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// =====================================================
// STATIC WEBSITE FILES
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

// =====================================================
// MAIN API TEST
// =====================================================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "College Achievement Showcase API is working"
    });
});

// =====================================================
// ADMIN API TEST
// =====================================================

app.get("/api/admin/test", (req, res) => {
    res.json({
        success: true,
        message: "Admin API is working"
    });
});

// =====================================================
// EVENTS API TEST
// =====================================================

app.get("/api/events/test", (req, res) => {
    res.json({
        success: true,
        message: "Events API is working"
    });
});

// =====================================================
// API 404 HANDLER
// =====================================================

app.use("/api", (req, res) => {
    console.log(
        "API ROUTE NOT FOUND:",
        req.method,
        req.originalUrl
    );

    res.status(404).json({
        success: false,
        message: "API route not found",
        method: req.method,
        path: req.originalUrl
    });
});

// =====================================================
// GENERAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});
// =====================================================
// MONGODB CONNECTION AND START SERVER
// =====================================================

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "MONGODB_URI is missing from environment variables"
            );
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, "0.0.0.0", () => {
            console.log("======================================");
            console.log(" College Achievement Showcase");
            console.log(` Server running on port ${PORT}`);
            console.log("======================================");
        });

    } catch (error) {
        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
}

startServer();