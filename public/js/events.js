document.addEventListener("DOMContentLoaded", loadEvents);

async function loadEvents() {
    const eventsList = document.getElementById("eventsList");

    try {
        const response = await fetch("/api/events");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load events");
        }

        const events = Array.isArray(data)
            ? data
            : data.events || [];

        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        No events available yet.
                    </div>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = events.map(event => {
            const title = escapeHtml(event.title || event.name || "College Event");
            const description = escapeHtml(
                event.description || "Join us and showcase your skills."
            );
            const category = escapeHtml(event.category || event.type || "College Event");

            const dateValue = event.date || event.eventDate;
            const eventDate = dateValue
                ? new Date(dateValue).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })
                : "Date to be announced";

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card event-card">
                        <div class="card-body p-4">
                            <div class="event-icon">🎓</div>

                            <span class="event-type">
                                ${category}
                            </span>

                            <h4 class="fw-bold mt-3">
                                ${title}
                            </h4>

                            <p class="text-muted">
                                ${description}
                            </p>

                            <p class="event-date mb-0">
                                📅 ${eventDate}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Error loading events:", error);

        eventsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    Unable to load events. Please check your server
                    and events API.
                </div>
            </div>
        `;
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}