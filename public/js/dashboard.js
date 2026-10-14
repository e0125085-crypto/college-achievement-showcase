document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    console.log("AchieveX Dashboard Loaded");

    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
        window.location.href = "/login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(storedUser);
    } catch (error) {
        console.error("Invalid user information:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
        return;
    }

    const studentId = user.id || user._id;

    console.log("Logged-in user:", user);
    console.log("Student ID:", studentId);

    // ==========================================
    // 2. HTML ELEMENTS
    // ==========================================

    const form = document.getElementById("achievementForm");
    const submitBtn = document.getElementById("submitAchievementBtn");
    const messageElement = document.getElementById("achievementMessage");
    const achievementList = document.getElementById("achievementList");

    const titleInput = document.getElementById("title");
    const categoryInput = document.getElementById("category");
    const levelInput = document.getElementById("level");
    const dateInput = document.getElementById("date");
    const descriptionInput = document.getElementById("description");
    const certificateInput = document.getElementById("certificate");

    // ==========================================
    // 3. STUDENT INFORMATION
    // ==========================================

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    }

    setText("studentNameWelcome", user.name || "Student");
    setText("studentName", user.name || "Student");
    setText("studentEmail", user.email || "Not available");
    setText(
        "studentRollNumber",
        user.rollNumber || user.roll || "Not available"
    );
    setText("studentDepartment", user.department || "Not available");
    setText("studentYear", user.year || "Not available");

    // ==========================================
    // 4. LOGOUT
    // ==========================================

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login.html";
        });
    }

    // ==========================================
    // 5. MESSAGES
    // ==========================================

    function showMessage(message, color = "#ff6b6b") {
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.color = color;
        }

        console.log("Dashboard message:", message);
    }

    // ==========================================
    // 6. API RESPONSE HANDLING
    // ==========================================

    async function readResponse(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            console.error("Unexpected server response:", text);

            throw new Error(
                "Invalid server response. Check the server terminal."
            );
        }
    }

    // ==========================================
    // 7. CERTIFICATE VALIDATION
    // ==========================================

    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
    const maximumFileSize = 5 * 1024 * 1024;

    if (certificateInput) {
        certificateInput.addEventListener("change", () => {
            const certificate = certificateInput.files[0];

            if (!certificate) {
                showMessage("Please select a certificate.");
                return;
            }

            if (!allowedExtensions.test(certificate.name)) {
                certificateInput.value = "";

                showMessage("Choose a PDF, JPG, JPEG or PNG file.");
                return;
            }

            if (certificate.size > maximumFileSize) {
                certificateInput.value = "";

                showMessage("Certificate must not exceed 5 MB.");
                return;
            }

            showMessage(
                "Certificate selected: " + certificate.name,
                "#4ade80"
            );
        });
    }

    // ==========================================
    // 8. SUBMIT ACHIEVEMENT
    // ==========================================

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (
                !titleInput ||
                !categoryInput ||
                !levelInput ||
                !dateInput ||
                !descriptionInput ||
                !certificateInput
            ) {
                showMessage("A required form field is missing.");
                return;
            }

            if (!studentId) {
                showMessage(
                    "Student ID is missing. Please log out and log in again."
                );
                return;
            }

            const title = titleInput.value.trim();
            const category = categoryInput.value;
            const level = levelInput.value;
            const date = dateInput.value;
            const description = descriptionInput.value.trim();
            const certificate = certificateInput.files[0];

            // Validate form fields.

            if (!title) {
                showMessage("Please enter the achievement title.");
                titleInput.focus();
                return;
            }

            if (!category) {
                showMessage("Please select a category.");
                categoryInput.focus();
                return;
            }

            if (!level) {
                showMessage("Please select the achievement level.");
                levelInput.focus();
                return;
            }

            if (!date) {
                showMessage("Please select the achievement date.");
                dateInput.focus();
                return;
            }

            if (!description) {
                showMessage("Please enter the description.");
                descriptionInput.focus();
                return;
            }

            if (!certificate) {
                showMessage("Please select a certificate.");
                certificateInput.focus();
                return;
            }

            if (!allowedExtensions.test(certificate.name)) {
                showMessage("Choose a PDF, JPG, JPEG or PNG certificate.");
                return;
            }

            if (certificate.size > maximumFileSize) {
                showMessage("Certificate must not exceed 5 MB.");
                return;
            }

            // Prepare multipart form data.

            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("level", level);
            formData.append("date", date);
            formData.append("studentId", String(studentId));
            formData.append("certificate", certificate);

            // Debugging information.

            console.log("Submitting achievement:");
            console.log("Title:", title);
            console.log("Category:", category);
            console.log("Level:", level);
            console.log("Date:", date);
            console.log("Student ID:", studentId);
            console.log("Certificate:", certificate.name);

            // Disable submit button.

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Submitting...";
            }

            showMessage("Submitting your achievement...", "#9b8cff");

            try {
                const response = await fetch("/api/achievements", {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: formData
                });

                const data = await readResponse(response);

                console.log("Submission HTTP status:", response.status);
                console.log("Submission response:", data);

                if (!response.ok || data.success === false) {
                    showMessage(
                        data.message ||
                        `Submission failed (HTTP ${response.status}).`
                    );

                    return;
                }

                showMessage(
                    data.message || "Achievement submitted successfully!",
                    "#4ade80"
                );

                form.reset();

                await loadAchievements();

            } catch (error) {
                console.error("Achievement submission error:", error);

                showMessage(
                    error.message || "Unable to submit achievement."
                );

            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Achievement";
                }
            }
        });
    } else {
        console.error("Achievement form not found.");
    }

    // ==========================================
    // 9. LOAD ACHIEVEMENTS
    // ==========================================

    async function loadAchievements() {
        if (!achievementList) {
            return;
        }

        if (!studentId) {
            achievementList.textContent = "Student ID is missing.";
            return;
        }

        achievementList.textContent = "Loading achievements...";

        try {
            const response = await fetch(
                `/api/achievements/student/${encodeURIComponent(studentId)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await readResponse(response);

            console.log("Load achievements status:", response.status);
            console.log("Loaded achievements:", data);

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || "Unable to load achievements."
                );
            }

            const achievements = Array.isArray(data)
                ? data
                : Array.isArray(data.achievements)
                    ? data.achievements
                    : [];

            updateStatistics(achievements);
            displayAchievements(achievements);

        } catch (error) {
            console.error("Loading achievements failed:", error);

            achievementList.textContent = error.message;
        }
    }

    // ==========================================
    // 10. STATISTICS
    // ==========================================

    function updateStatistics(achievements) {
        setText("totalAchievements", achievements.length);

        setText(
            "pendingAchievements",
            achievements.filter(
                item =>
                    String(item.status || "pending").toLowerCase() === "pending"
            ).length
        );

        setText(
            "approvedAchievements",
            achievements.filter(
                item =>
                    String(item.status || "").toLowerCase() === "approved"
            ).length
        );
    }

    // ==========================================
    // 11. DISPLAY ACHIEVEMENTS
    // ==========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function getCertificateUrl(certificate) {
        if (!certificate) {
            return "";
        }

        const value = typeof certificate === "string"
            ? certificate
            : certificate.url || certificate.path || "";

        if (!value) {
            return "";
        }

        try {
            const url = new URL(value, window.location.origin);

            if (url.origin !== window.location.origin) {
                return "";
            }

            return url.href;

        } catch (error) {
            return "";
        }
    }

    function displayAchievements(achievements) {
        if (!achievementList) {
            return;
        }

        if (!achievements.length) {
            achievementList.innerHTML = `
                <div class="empty-message">
                    <h3>No achievements yet</h3>
                    <p>Submit your first achievement using the form.</p>
                </div>
            `;

            return;
        }

        achievementList.innerHTML = achievements.map(item => {
            const title = escapeHTML(item.title || "Untitled");
            const description = escapeHTML(item.description || "");
            const category = escapeHTML(item.category || "General");
            const level = escapeHTML(item.level || "Not specified");

            const status = String(item.status || "pending").toLowerCase();

            const safeStatus = [
                "pending",
                "approved",
                "rejected"
            ].includes(status) ? status : "pending";

            const parsedDate = item.date ? new Date(item.date) : null;

            const date = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString("en-IN")
                : "Date not available";

            const certificate = getCertificateUrl(item.certificate);

            return `
                <article class="achievement-card">
                    <h3>${title}</h3>

                    <p>${description}</p>

                    <div class="achievement-meta">
                        <span class="achievement-tag">${category}</span>
                        <span class="achievement-tag">${level}</span>
                        <span class="achievement-tag">${escapeHTML(date)}</span>
                    </div>

                    <span class="status-badge status-${safeStatus}">
                        ${safeStatus}
                    </span>

                    ${
                        certificate
                            ? `
                                <p>
                                    <a
                                        class="certificate-link"
                                        href="${escapeHTML(certificate)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Certificate
                                    </a>
                                </p>
                            `
                            : ""
                    }
                </article>
            `;
        }).join("");
    }

    // ==========================================
    // 12. INITIAL LOAD
    // ==========================================

    loadAchievements();

});