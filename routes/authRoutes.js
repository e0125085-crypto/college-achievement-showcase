const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            rollNumber,
            department,
            year
        } = req.body;

        // Check required fields
        if (
            !name ||
            !email ||
            !password ||
            !rollNumber ||
            !department ||
            !year
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Check if roll number already exists
        const existingRollNumber = await User.findOne({
            rollNumber
        });

        if (existingRollNumber) {
            return res.status(400).json({
                success: false,
                message: "Roll number already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            rollNumber,
            department,
            year,
            role: "student"
        });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                department: user.department,
                year: user.year
            }
        });

    } catch (error) {
        console.log("Registration error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                department: user.department,
                year: user.year,
                role: user.role
            }
        });

    } catch (error) {
        console.log("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
});

module.exports = router;