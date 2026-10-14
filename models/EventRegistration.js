const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        registrationDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate registrations
eventRegistrationSchema.index(
    { event: 1, student: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "EventRegistration",
    eventRegistrationSchema
);