const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Admin = require("../models/Admin");
const Achievement = require("../models/Achievement");
const User = require("../models/User");

const router = express.Router();

// =====================================================
// ADMIN TEST
// GET /api/admin/test
// =====================================================

router.get("/test", function (req, res) {
    res.json({
        success: true,
        message: "Admin API is working"
    });
});

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================

router.post("/login", async function (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const admin = await Admin.findOne({
            email: email.trim().toLowerCase()
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration is missing."
            });
        }

        const token = jwt.sign(
            {
                id: admin._id.toString(),
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            token: token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during admin login."
        });
    }
});

// =====================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =====================================================

function verifyAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server authentication configuration is missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            decoded.role !== "admin" ||
            !decoded.id
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token."
        });
    }
}

// =====================================================
// GET ALL ACHIEVEMENTS
// GET /api/admin/achievements
// =====================================================

router.get(
    "/achievements",
    verifyAdmin,
    async function (req, res) {
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
                achievements: achievements
            });

        } catch (error) {
            console.error("Get admin achievements error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch achievements."
            });
        }
    }
);

// =====================================================
// APPROVE / REJECT ACHIEVEMENT
// PUT /api/admin/achievements/:id/status
// =====================================================

router.put(
    "/achievements/:id/status",
    verifyAdmin,
    async function (req, res) {
        try {
            const { status, rejectionReason } = req.body;

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be approved or rejected."
                });
            }

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid achievement ID."
                });
            }

            if (
                status === "rejected" &&
                rejectionReason !== undefined &&
                typeof rejectionReason !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rejection reason must be text."
                });
            }

            const achievement = await Achievement.findById(
                req.params.id
            );

            if (!achievement) {
                return res.status(404).json({
                    success: false,
                    message: "Achievement not found."
                });
            }

            achievement.status = status;

            if (status === "rejected") {
                achievement.rejectionReason =
                    typeof rejectionReason === "string"
                        ? rejectionReason.trim()
                        : "";
            } else {
                achievement.rejectionReason = "";
            }

            await achievement.save();

            const updatedAchievement = await Achievement.findById(
                achievement._id
            )
                .populate(
                    "student",
                    "name email rollNumber department year"
                )
                .lean();

            return res.status(200).json({
                success: true,
                message:
                    status === "approved"
                        ? "Achievement approved successfully."
                        : "Achievement rejected successfully.",
                achievement: updatedAchievement
            });

        } catch (error) {
            console.error("Update achievement status error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update achievement status."
            });
        }
    }
);

// =====================================================
// GET ALL STUDENTS
// GET /api/admin/students
// =====================================================

router.get(
    "/students",
    verifyAdmin,
    async function (req, res) {
        try {
            const students = await User.find({
                role: "student"
            })
                .select(
                    "name email rollNumber department year profileImage createdAt"
                )
                .sort({ createdAt: -1 })
                .lean();

            const studentIds = students.map(
                student => student._id
            );

            let achievementCounts = [];

            if (studentIds.length > 0) {
                achievementCounts = await Achievement.aggregate([
                    {
                        $match: {
                            student: {
                                $in: studentIds
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$student",
                            total: {
                                $sum: 1
                            }
                        }
                    }
                ]);
            }

            const countMap = new Map();

            achievementCounts.forEach(function (item) {
                countMap.set(
                    item._id.toString(),
                    item.total
                );
            });

            const studentsWithCounts = students.map(
                function (student) {
                    return {
                        ...student,
                        achievementCount:
                            countMap.get(student._id.toString()) || 0
                    };
                }
            );

            return res.status(200).json({
                success: true,
                count: studentsWithCounts.length,
                students: studentsWithCounts
            });

        } catch (error) {
            console.error("Get students error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch students."
            });
        }
    }
);
// =====================================================
// UPDATE STUDENT ROLL NUMBER
// PUT /api/admin/students/:id/roll-number
// =====================================================

router.put(
    "/students/:id/roll-number",
    verifyAdmin,
    async function (req, res) {
        try {
            const { rollNumber } = req.body;

            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID."
                });
            }

            if (
                typeof rollNumber !== "string" ||
                !rollNumber.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A valid roll number is required."
                });
            }

            const student = await User.findOne({
                _id: req.params.id,
                role: "student"
            });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            const newRollNumber = rollNumber.trim();

            const existingStudent = await User.findOne({
                rollNumber: newRollNumber,
                _id: { $ne: student._id }
            });

            if (existingStudent) {
                return res.status(409).json({
                    success: false,
                    message: "This roll number is already in use."
                });
            }

            student.rollNumber = newRollNumber;
            await student.save();

            return res.status(200).json({
                success: true,
                message: "Student roll number updated successfully.",
                student: {
                    id: student._id,
                    name: student.name,
                    email: student.email,
                    rollNumber: student.rollNumber
                }
            });

        } catch (error) {
            console.error("Update student roll number error:", error);

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "This roll number is already in use."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Unable to update student roll number."
            });
        }
    }
);


// =====================================================
// DELETE STUDENT ACCOUNT
// DELETE /api/admin/students/:id
// =====================================================

router.delete(
    "/students/:id",
    verifyAdmin,
    async function (req, res) {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID."
                });
            }

            const student = await User.findOne({
                _id: req.params.id,
                role: "student"
            });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            // Prevent deleting an account that owns achievements.
            const achievementCount = await Achievement.countDocuments({
                student: student._id
            });

            if (achievementCount > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This student has achievements. Handle those records before deleting the account.",
                    achievementCount: achievementCount
                });
            }

            await User.deleteOne({
                _id: student._id
            });

            return res.status(200).json({
                success: true,
                message: "Student account deleted successfully."
            });

        } catch (error) {
            console.error("Delete student error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete student account."
            });
        }
    }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;