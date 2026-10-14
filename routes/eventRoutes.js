const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");

const {
    verifyToken,
    studentOnly,
    adminOnly
} = require("../middleware/authMiddleware");

// ========================================
// 1. GET ALL EVENTS
// ========================================
router.get("/", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });

        res.status(200).json({
            success: true,
            events
        });

    } catch (error) {
        console.error("Error fetching events:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        });
    }
});

// ========================================
// 2. ADD NEW EVENT (ADMIN ONLY)
// ========================================
router.post("/", verifyToken, adminOnly, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            date,
            venue,
            organizer
        } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and date are required"
            });
        }

        const event = await Event.create({
            title,
            description,
            category,
            date,
            venue,
            organizer
        });

        res.status(201).json({
            success: true,
            message: "Event added successfully",
            event
        });

    } catch (error) {
        console.error("Error adding event:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add event"
        });
    }
});

// ========================================
// 3. REGISTER FOR EVENT (STUDENT ONLY)
// ========================================
router.post("/:id/register", verifyToken, studentOnly, async (req, res) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const registration = await EventRegistration.create({
            event: event._id,
            student: req.user._id
        });

        res.status(201).json({
            success: true,
            message: "Successfully registered for the event",
            registration
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already registered for this event"
            });
        }

        console.error("Event registration error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to register for the event"
        });
    }
});

// ========================================
// 4. VIEW EVENT PARTICIPANTS (ADMIN ONLY)
// ========================================
router.get("/:id/participants", verifyToken, adminOnly, async (req, res) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const registrations = await EventRegistration.find({
            event: eventId
        })
            .populate("student", "name email rollNumber department year")
            .sort({ registrationDate: -1 });

        res.status(200).json({
            success: true,
            event: event.title,
            totalRegistrations: registrations.length,
            registrations
        });

    } catch (error) {
        console.error("Error fetching participants:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch participants"
        });
    }
});

// ========================================
// 5. DELETE EVENT (ADMIN ONLY)
// ========================================
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
    try {
        const eventId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        await EventRegistration.deleteMany({
            event: eventId
        });

        res.status(200).json({
            success: true,
            message: "Event and its registrations deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting event:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete event"
        });
    }
});

// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;