document.addEventListener("DOMContentLoaded", function () {
    // Admin authentication token
    const adminToken =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token");

    const storedAdmin =
        localStorage.getItem("admin") ||
        localStorage.getItem("user");

    // Redirect if not logged in
    if (!adminToken) {
        window.location.replace("/admin-login.html");
        return;
    }

    // Read admin information
    let admin = {};

    try {
        admin = storedAdmin ? JSON.parse(storedAdmin) : {};
    } catch (error) {
        console.error("Unable to read admin information:", error);
    }

    const adminNameElement = document.getElementById("adminName");
    const adminEmailElement = document.getElementById("adminEmail");

    if (adminNameElement) {
        adminNameElement.textContent =
            admin.name || admin.username || "Administrator";
    }

    if (adminEmailElement) {
        adminEmailElement.textContent = admin.email || "";
    }

    // Logout
    const logoutButton = document.getElementById("adminLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("admin");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.replace("/admin-login.html");
        });
    }

    // Achievement elements
    const achievementList = document.getElementById("achievementList");
    const statusFilter = document.getElementById("statusFilter");

    let allAchievements = [];

    // ==========================================
    // LOAD ACHIEVEMENTS
    // ==========================================

    async function loadAchievements() {
        if (!achievementList) {
            console.error("Element #achievementList was not found.");
            return;
        }

        achievementList.textContent = "Loading achievements...";

        try {
            const response = await fetch("/api/achievements", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + adminToken
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load achievements."
                );
            }

            if (Array.isArray(data)) {
                allAchievements = data;
            } else if (Array.isArray(data.achievements)) {
                allAchievements = data.achievements;
            } else if (Array.isArray(data.data)) {
                allAchievements = data.data;
            } else {
                allAchievements = [];
            }

            updateStatistics(allAchievements);
            displayAchievements();

        } catch (error) {
            console.error("Load achievements error:", error);

            achievementList.textContent =
                "Could not load achievements. Please check the server.";
        }
    }

    // ==========================================
    // UPDATE STATISTICS
    // ==========================================

    function updateStatistics(achievements) {
        const totalElement =
            document.getElementById("totalAchievements");

        const pendingElement =
            document.getElementById("pendingAchievements");

        const approvedElement =
            document.getElementById("approvedAchievements");

        const rejectedElement =
            document.getElementById("rejectedAchievements");

        const pending = achievements.filter(function (item) {
            return (item.status || "pending").toLowerCase() === "pending";
        }).length;

        const approved = achievements.filter(function (item) {
            return (item.status || "").toLowerCase() === "approved";
        }).length;

        const rejected = achievements.filter(function (item) {
            return (item.status || "").toLowerCase() === "rejected";
        }).length;

        if (totalElement) {
            totalElement.textContent = achievements.length;
        }

        if (pendingElement) {
            pendingElement.textContent = pending;
        }

        if (approvedElement) {
            approvedElement.textContent = approved;
        }

        if (rejectedElement) {
            rejectedElement.textContent = rejected;
        }
    }

    // ==========================================
    // DISPLAY ACHIEVEMENTS
    // ==========================================

    function displayAchievements() {
        if (!achievementList) {
            return;
        }

        const selectedStatus = statusFilter
            ? statusFilter.value.toLowerCase()
            : "all";

        const filteredAchievements = allAchievements.filter(function (item) {
            const status = (item.status || "pending").toLowerCase();

            return selectedStatus === "all" || status === selectedStatus;
        });

        achievementList.innerHTML = "";

        if (filteredAchievements.length === 0) {
            achievementList.textContent = "No achievements found.";
            return;
        }

        filteredAchievements.forEach(function (item) {
            const card = document.createElement("div");
            card.className = "achievement-card";

            const title = document.createElement("h3");
            title.textContent =
                item.title ||
                item.achievementTitle ||
                "Untitled Achievement";

            const student = document.createElement("p");

            let studentName = "Not specified";

            if (item.student && typeof item.student === "object") {
                studentName =
                    item.student.name ||
                    item.student.username ||
                    item.student.rollNumber ||
                    "Not specified";
            } else {
                studentName =
                    item.studentName ||
                    item.name ||
                    "Not specified";
            }

            student.textContent = "Student: " + studentName;

            const category = document.createElement("p");
            category.textContent =
                "Category: " + (item.category || "Not specified");

            const level = document.createElement("p");
            level.textContent =
                "Level: " + (item.level || "Not specified");

            const date = document.createElement("p");

            if (item.date) {
                const parsedDate = new Date(item.date);

                date.textContent =
                    "Date: " +
                    (Number.isNaN(parsedDate.getTime())
                        ? "Not specified"
                        : parsedDate.toLocaleDateString());
            } else {
                date.textContent = "Date: Not specified";
            }

            const status = document.createElement("p");
            const currentStatus =
                (item.status || "pending").toLowerCase();

            status.textContent = "Status: " + currentStatus;

            card.append(
                title,
                student,
                category,
                level,
                date,
                status
            );

            // Approve and reject pending achievements
            if (item._id && currentStatus === "pending") {
                const approveButton = document.createElement("button");
                approveButton.type = "button";
                approveButton.textContent = "Approve";

                approveButton.addEventListener("click", function () {
                    updateStatus(item._id, "approved");
                });

                const rejectButton = document.createElement("button");
                rejectButton.type = "button";
                rejectButton.textContent = "Reject";

                rejectButton.addEventListener("click", function () {
                    updateStatus(item._id, "rejected");
                });

                card.append(approveButton, rejectButton);
            }

            achievementList.appendChild(card);
        });
    }

    // ==========================================
    // APPROVE OR REJECT ACHIEVEMENT
    // ==========================================

    async function updateStatus(achievementId, newStatus) {
        try {
            const response = await fetch(
                "/api/achievements/" + encodeURIComponent(achievementId),
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + adminToken
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update achievement status."
                );
            }

            alert("Achievement " + newStatus + " successfully!");

            await loadAchievements();

        } catch (error) {
            console.error("Update status error:", error);
            alert(error.message || "Failed to update achievement.");
        }
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", displayAchievements);
    }

    // ==========================================
    // LOAD STUDENTS
    // ==========================================

    async function loadStudents() {
        const studentContainer =
            document.getElementById("studentsList");

        if (!studentContainer) {
            console.error("Student container #studentsList not found.");
            return;
        }

        studentContainer.textContent = "Loading students...";

        try {
            const response = await fetch("/api/admin/students", {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + adminToken
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load students."
                );
            }

            const students = data.students || [];

            studentContainer.innerHTML = "";

            if (students.length === 0) {
                studentContainer.textContent = "No students found.";
                return;
            }

            students.forEach(function (student) {
                const card = document.createElement("div");
                card.className = "student-card";

                const name = document.createElement("h3");
                name.textContent = student.name || "Unnamed Student";

                const email = document.createElement("p");
                email.textContent =
                    "Email: " + (student.email || "Not provided");

                const rollNumber = document.createElement("p");
                rollNumber.textContent =
                    "Roll Number: " +
                    (student.rollNumber || "Not provided");

                const department = document.createElement("p");
                department.textContent =
                    "Department: " +
                    (student.department || "Not provided");

                const year = document.createElement("p");
                year.textContent =
                    "Year: " + (student.year || "Not provided");

                const actions = document.createElement("div");
                actions.className = "student-actions";

                // EDIT ROLL NUMBER BUTTON
                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "edit-student-btn";
                editButton.textContent = "Edit Roll Number";

                editButton.addEventListener("click", async function () {
                    const newRollNumber = prompt(
                        "Enter the new roll number for " +
                            (student.name || "this student") + ":",
                        student.rollNumber || ""
                    );

                    if (newRollNumber === null) {
                        return;
                    }

                    const cleanedRollNumber = newRollNumber.trim();

                    if (!cleanedRollNumber) {
                        alert("Roll number cannot be empty.");
                        return;
                    }

                    if (cleanedRollNumber === student.rollNumber) {
                        return;
                    }

                    try {
                        const updateResponse = await fetch(
                            "/api/admin/students/" +
                                encodeURIComponent(student._id) +
                                "/roll-number",
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer " + adminToken
                                },
                                body: JSON.stringify({
                                    rollNumber: cleanedRollNumber
                                })
                            }
                        );

                        const result = await updateResponse.json();

                        if (!updateResponse.ok) {
                            throw new Error(
                                result.message ||
                                    "Could not update roll number."
                            );
                        }

                        alert("Roll number updated successfully!");

                        await loadStudents();

                    } catch (error) {
                        console.error("Update roll number error:", error);

                        alert(
                            error.message ||
                                "Failed to update roll number."
                        );
                    }
                });

                // DELETE STUDENT BUTTON
                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "delete-student-btn";
                deleteButton.textContent = "Delete Student";

                deleteButton.addEventListener("click", async function () {
                    const confirmed = confirm(
                        "Are you sure you want to delete this student?\n\n" +
                        "Name: " + (student.name || "Unknown") + "\n" +
                        "Email: " + (student.email || "Unknown") + "\n" +
                        "Roll Number: " +
                            (student.rollNumber || "Unknown") +
                        "\n\nThis action cannot be undone."
                    );

                    if (!confirmed) {
                        return;
                    }

                    try {
                        const deleteResponse = await fetch(
                            "/api/admin/students/" +
                                encodeURIComponent(student._id),
                            {
                                method: "DELETE",
                                headers: {
                                    Authorization: "Bearer " + adminToken
                                }
                            }
                        );

                        const result = await deleteResponse.json();

                        if (!deleteResponse.ok) {
                            throw new Error(
                                result.message ||
                                    "Could not delete student."
                            );
                        }

                        alert("Student account deleted successfully!");

                        await loadStudents();

                    } catch (error) {
                        console.error("Delete student error:", error);

                        alert(
                            error.message ||
                                "Failed to delete student."
                        );
                    }
                });

                actions.append(editButton, deleteButton);

                card.append(
                    name,
                    email,
                    rollNumber,
                    department,
                    year,
                    actions
                );

                studentContainer.appendChild(card);
            });

        } catch (error) {
            console.error("Load students error:", error);

            studentContainer.textContent =
                "Could not load students. Please refresh and try again.";
        }
    }

    // ==========================================
    // START DASHBOARD
    // ==========================================

    loadStudents();
    loadAchievements();
});