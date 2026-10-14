const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing"
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role === "admin") {
            const admin = await Admin.findById(decoded.id).select("-password");

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: "Admin account not found"
                });
            }

            req.user = {
                _id: admin._id,
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: "admin"
            };

            return next();
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Student account not found"
            });
        }

        req.user = user;
        return next();

    } catch (error) {
        console.error("Token verification error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

const studentOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "student") {
        return res.status(403).json({
            success: false,
            message: "Student access required"
        });
    }

    next();
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

module.exports = {
    verifyToken,
    studentOnly,
    adminOnly
};