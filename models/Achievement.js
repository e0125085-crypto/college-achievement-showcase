const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        level: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        certificate: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        rejectionReason: {
            type: String,
            default: ""
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.Achievement ||
    mongoose.model("Achievement", achievementSchema);