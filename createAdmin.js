const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const Admin = require("./models/Admin");

dotenv.config();

async function createAdmin() {
    try {

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");

        // Admin details
        const name = "AchieveX Admin";
        const email = "admin@achievex.com";
        const password = "Admin@123";

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            email: email
        });

        if (existingAdmin) {

            console.log("Admin already exists.");

            await mongoose.connection.close();

            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Create admin
        const admin = await Admin.create({
            name: name,
            email: email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("======================================");
        console.log("Admin created successfully!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Password:", password);
        console.log("======================================");

        await mongoose.connection.close();

    } catch (error) {

        console.log("Error creating admin:");
        console.log(error.message);

        process.exit(1);
    }
}

createAdmin();