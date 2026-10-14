// ========================================
// ACHIEVEX - ADMIN LOGIN
// ========================================

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const message = document.getElementById("message");

        if (!emailInput || !passwordInput || !message) {
            console.error("Admin login HTML elements are missing.");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            message.textContent = "Please enter email and password.";
            message.style.color = "red";
            return;
        }

        message.textContent = "Checking admin account...";
        message.style.color = "blue";

        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            console.log("Admin login response:", data);

            if (!response.ok || !data.success || !data.token) {
                throw new Error(
                    data.message || "Admin login failed."
                );
            }

            // Save authentication token.
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("token", data.token);

            // Save admin information.
            const admin = data.admin || data.user || {
                email: email
            };

            localStorage.setItem("admin", JSON.stringify(admin));
            localStorage.setItem("user", JSON.stringify(admin));

            message.textContent = "Login successful!";
            message.style.color = "green";

            // Redirect after successful login.
            setTimeout(function () {
                window.location.href = "/admin-dashboard.html";
            }, 500);

        } catch (error) {
            console.error("Admin login error:", error);

            message.textContent =
                error.message || "Unable to connect to the server.";

            message.style.color = "red";
        }
    });
}

// ========================================
// DISPLAY ADMIN INFORMATION (IF PRESENT)
// ========================================

// Run only on pages containing admin information elements.
document.addEventListener("DOMContentLoaded", function () {
    const adminNameElement = document.getElementById("adminName");
    const adminEmailElement = document.getElementById("adminEmail");

    if (!adminNameElement && !adminEmailElement) {
        return;
    }

    const storedAdmin =
        localStorage.getItem("admin") ||
        localStorage.getItem("user");

    if (!storedAdmin) {
        console.warn("Admin information has not been saved.");
        return;
    }

    try {
        const admin = JSON.parse(storedAdmin);

        if (adminNameElement) {
            adminNameElement.textContent =
                admin.name || admin.username || "Administrator";
        }

        if (adminEmailElement) {
            adminEmailElement.textContent = admin.email || "";
        }

    } catch (error) {
        console.error("Unable to load admin information:", error);
    }
});