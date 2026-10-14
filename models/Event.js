const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
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
            default: "College Event"
        },
        date: {
            type: Date,
            required: true
        },
        venue: {
            type: String,
            default: "College Campus"
        },
        organizer: {
            type: String,
            default: "College"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Event", eventSchema);