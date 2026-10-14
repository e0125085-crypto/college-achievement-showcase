const eventForm = document.getElementById("eventForm");
const eventsList = document.getElementById("eventsList");
const messageBox = document.getElementById("message");
const addEventBtn = document.getElementById("addEventBtn");
const refreshBtn = document.getElementById("refreshBtn");

// Get the login token
function getToken() {
    return localStorage.getItem("token");
}

// Display success or error messages
function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `alert alert-${type}`;
}

// Hide the message
function hideMessage() {
    messageBox.textContent = "";
    messageBox.className = "alert d-none";
}

// Safely display text from the database
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// Format the date
function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Load events
async function loadEvents() {
    eventsList.innerHTML = `
        <div class="col-12 text-muted">Loading events...</div>
    `;

    try {
        const response = await fetch("/api/events");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load events");
        }

        const events = result.events || [];

        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        No events available. Add your first event above.
                    </div>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = events.map(event => `
            <div class="col-md-6 col-lg-4">
                <div class="event-card card h-100">
                    <div class="card-body d-flex flex-column">

                        <div class="mb-3">
                            <span class="event-category">
                                ${escapeHTML(event.category || "College Event")}
                            </span>
                        </div>

                        <h5>${escapeHTML(event.title)}</h5>

                        <p class="event-description text-muted">
                            ${escapeHTML(event.description)}
                        </p>

                        <hr>

                        <p class="mb-2">
                            <strong>Date:</strong>
                            ${escapeHTML(formatDate(event.date))}
                        </p>

                        <p class="mb-2">
                            <strong>Venue:</strong>
                            ${escapeHTML(event.venue || "College Campus")}
                        </p>

                        <p class="mb-4">
                            <strong>Organizer:</strong>
                            ${escapeHTML(event.organizer || "College")}
                        </p>

                        <button
                            type="button"
                            class="btn btn-danger mt-auto delete-event-btn"
                            data-id="${escapeHTML(event._id)}"
                        >
                            Delete Event
                        </button>

                    </div>
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.error("Error loading events:", error);

        eventsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Unable to load events. Check your server and try Refresh.
                </div>
            </div>
        `;
    }
}

// Add an event
eventForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideMessage();

    const token = getToken();

    if (!token) {
        showMessage("Please log in first.", "warning");
        return;
    }

    const eventData = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value,
        venue: document.getElementById("venue").value.trim(),
        organizer: document.getElementById("organizer").value.trim()
    };

    if (!eventData.title || !eventData.description || !eventData.date) {
        showMessage("Please fill in all required fields.", "warning");
        return;
    }

    addEventBtn.disabled = true;
    addEventBtn.textContent = "Adding...";

    try {
        const response = await fetch("/api/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to add event");
        }

        eventForm.reset();

        showMessage("Event added successfully!", "success");

        await loadEvents();

    } catch (error) {
        console.error("Error adding event:", error);
        showMessage(error.message || "Failed to add event.", "danger");
    } finally {
        addEventBtn.disabled = false;
        addEventBtn.textContent = "Add Event";
    }
});

// Delete an event
eventsList.addEventListener("click", async function (event) {
    const deleteButton = event.target.closest(".delete-event-btn");

    if (!deleteButton) {
        return;
    }

    const token = getToken();

    if (!token) {
        showMessage("Please log in first.", "warning");
        return;
    }

    const eventId = deleteButton.dataset.id;

    if (!eventId) {
        showMessage("Event ID is missing.", "danger");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    hideMessage();
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    try {
        const response = await fetch(
            `/api/events/${encodeURIComponent(eventId)}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to delete event");
        }

        showMessage("Event deleted successfully!", "success");

        await loadEvents();

    } catch (error) {
        console.error("Error deleting event:", error);

        showMessage(
            error.message || "Failed to delete event. Please try again.",
            "danger"
        );

        deleteButton.disabled = false;
        deleteButton.textContent = "Delete Event";
    }
});

// Refresh events
refreshBtn.addEventListener("click", function () {
    hideMessage();
    loadEvents();
});

// Load events when the page opens
loadEvents();