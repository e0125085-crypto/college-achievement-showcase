// =====================================================
// ACHIEVEX - ACHIEVEMENT ROUTES
// =====================================================

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const Achievement = require('../models/Achievement');
const User = require("../models/User");

const {
    verifyToken,
    studentOnly,
    adminOnly
} = require("../middleware/authMiddleware");

// =====================================================
// CERTIFICATE UPLOAD CONFIGURATION
// =====================================================

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, uploadDirectory);
    },

    filename: function (req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();

        callback(
            null,
            Date.now() + "-" +
            Math.round(Math.random() * 1e9) +
            extension
        );
    }
});

const fileFilter = function (req, file, callback) {
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        return callback(
            new Error(
                "Only PDF, PNG, JPG, and JPEG certificates are allowed."
            )
        );
    }

    callback(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// =====================================================
// TEST ROUTE
// GET /api/achievements/test
// =====================================================

router.get("/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Achievement API is working"
    });
});

// =====================================================
// GET ALL ACHIEVEMENTS
// ADMIN ONLY
// GET /api/achievements
// =====================================================

router.get("/", verifyToken, adminOnly, async (req, res) => {
    try {
        const achievements = await Achievement.find()
            .populate(
                "student",
                "name email rollNumber department year"
            )
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: achievements.length,
            achievements
        });

    } catch (error) {
        console.error("Fetch achievements error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch achievements."
        });
    }
});

// =====================================================
// CREATE ACHIEVEMENT
// STUDENTS ONLY
// POST /api/achievements
// =====================================================

router.post(
    "/",
    verifyToken,
    studentOnly,
    upload.single("certificate"),
    async (req, res) => {
        let uploadedFilePath = null;

        try {
            const {
                title,
                description,
                category,
                level,
                date
            } = req.body;

            if (
                !title ||
                !description ||
                !category ||
                !level ||
                !date
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required achievement details."
                });
            }

            if (
                typeof title !== "string" ||
                typeof description !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Title and description must be text."
                });
            }

            if (!title.trim() || !description.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Title and description cannot be empty."
                });
            }

            if (req.file) {
                uploadedFilePath = req.file.path;
            }

            const achievement = new Achievement({
                title: title.trim(),
                description: description.trim(),
                category,
                level,
                date,
                student: req.user._id,
                certificate: req.file
                    ? "/uploads/" + req.file.filename
                    : "",
                status: "pending",
                rejectionReason: ""
            });

            const savedAchievement = await achievement.save();

            return res.status(201).json({
                success: true,
                message: "Achievement submitted successfully.",
                achievement: savedAchievement
            });

        } catch (error) {
            console.error("Create achievement error:", error);

            if (
                uploadedFilePath &&
                fs.existsSync(uploadedFilePath)
            ) {
                try {
                    fs.unlinkSync(uploadedFilePath);
                } catch (fileError) {
                    console.error(
                        "Could not remove uploaded file:",
                        fileError
                    );
                }
            }

            return res.status(500).json({
                success: false,
                message: "Failed to save achievement."
            });
        }
    }
);

// =====================================================
// GET ACHIEVEMENTS FOR A STUDENT
// STUDENT CAN VIEW OWN; ADMIN CAN VIEW ANY
// GET /api/achievements/student/:studentId
// =====================================================

router.get(
    "/student/:studentId",
    verifyToken,
    async (req, res) => {
        try {
            const { studentId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID."
                });
            }

            const isAdmin = req.user.role === "admin";
            const isOwnAccount =
                req.user._id.toString() === studentId;

            if (!isAdmin && !isOwnAccount) {
                return res.status(403).json({
                    success: false,
                    message: "You can only view your own achievements."
                });
            }

            const achievements = await Achievement.find({
                student: studentId
            })
                .populate(
                    "student",
                    "name email rollNumber department year"
                )
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: achievements.length,
                achievements
            });

        } catch (error) {
            console.error("Student achievements error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch student achievements."
            });
        }
    }
);

// =====================================================
// GET APPROVED ACHIEVEMENTS
// PUBLIC ROUTE
// GET /api/achievements/approved
// =====================================================

router.get("/approved", async (req, res) => {
    try {
        const achievements = await Achievement.find({
            status: "approved"
        })
            .populate(
                "student",
                "name email rollNumber department year"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: achievements.length,
            achievements
        });

    } catch (error) {
        console.error("Approved achievements error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch approved achievements."
        });
    }
});

// =====================================================
// UPDATE ACHIEVEMENT
// ADMIN ONLY
// PUT /api/achievements/:id
// =====================================================

router.put(
    "/:id",
    verifyToken,
    adminOnly,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid achievement ID."
                });
            }

            const allowedFields = [
                "title",
                "description",
                "category",
                "level",
                "date",
                "status",
                "rejectionReason"
            ];

            const updates = {};

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No valid fields provided for update."
                });
            }

            if (updates.status !== undefined) {
                updates.status = String(
                    updates.status
                ).toLowerCase();

                if (
                    !["pending", "approved", "rejected"].includes(
                        updates.status
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid achievement status."
                    });
                }

                if (updates.status !== "rejected") {
                    updates.rejectionReason = "";
                }
            }

            const achievement = await Achievement.findByIdAndUpdate(
                id,
                { $set: updates },
                {
                    new: true,
                    runValidators: true
                }
            ).populate(
                "student",
                "name email rollNumber department year"
            );

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: "Achievement not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Achievement updated successfully.",
                achievement
            });

        } catch (error) {
            console.error("Update achievement error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to update achievement."
            });
        }
    }
);

// =====================================================
// DELETE ACHIEVEMENT
// ADMIN ONLY
// DELETE /api/achievements/:id
// =====================================================

router.delete(
    "/:id",
    verifyToken,
    adminOnly,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid achievement ID."
                });
            }

            const achievement = await Achievement.findByIdAndDelete(id);

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: "Achievement not found."
                });
            }

            // Remove the certificate file when deleting the achievement.
            if (achievement.certificate) {
                const certificatePath = path.basename(
                    achievement.certificate
                );

                const fullPath = path.join(
                    uploadDirectory,
                    certificatePath
                );

                if (fs.existsSync(fullPath)) {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (fileError) {
                        console.error(
                            "Could not delete certificate file:",
                            fileError
                        );
                    }
                }
            }

            return res.status(200).json({
                success: true,
                message: "Achievement deleted successfully."
            });

        } catch (error) {
            console.error("Delete achievement error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to delete achievement."
            });
        }
    }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
