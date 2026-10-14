// =====================================================
// ACHIEVEX - AUTHENTICATION
// Register + Login
// =====================================================


// =====================================================
// REGISTER
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const message = document.getElementById("message");

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const department = document.getElementById("department").value;
        const year = document.getElementById("year").value;
        const password = document.getElementById("password").value;

        message.textContent = "Creating your account...";
        message.style.color = "#9b8cff";

        try {

            const response = await fetch("/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    rollNumber,
                    department,
                    year,
                    password
                })

            });

            const data = await response.json();

            if (data.success) {

                message.textContent =
                    "✓ Registration successful! Opening login...";

                message.style.color = "#4ade80";

                setTimeout(() => {

                    window.location.href = "/login.html";

                }, 1200);

            } else {

                message.textContent =
                    data.message || "Registration failed.";

                message.style.color = "#ff6b6b";

            }

        } catch (error) {

            console.error("Registration error:", error);

            message.textContent =
                "Unable to connect to the server.";

            message.style.color = "#ff6b6b";

        }

    });

}



// =====================================================
// LOGIN
// =====================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const message = document.getElementById("message");

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        if (!email || !password) {

            message.textContent =
                "Please enter email and password.";

            message.style.color = "#ff6b6b";

            return;

        }


        message.textContent = "Checking your account...";
        message.style.color = "#9b8cff";


        try {

            const response = await fetch("/api/auth/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });


            const data = await response.json();


            console.log("Login response:", data);


            if (data.success && data.token) {

                // Save login token
                localStorage.setItem(
                    "token",
                    data.token
                );


                // Save student information
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );


                // Verify that data was saved
                console.log(
                    "Saved token:",
                    localStorage.getItem("token")
                );

                console.log(
                    "Saved user:",
                    localStorage.getItem("user")
                );


                message.textContent =
                    "✓ Login successful! Opening dashboard...";

                message.style.color = "#4ade80";


                // Open dashboard
                setTimeout(() => {

                    window.location.href =
                        "/dashboard.html";

                }, 700);


            } else {

                message.textContent =
                    data.message ||
                    "Invalid email or password.";

                message.style.color = "#ff6b6b";

            }


        } catch (error) {

            console.error("Login error:", error);

            message.textContent =
                "Unable to connect to the server.";

            message.style.color = "#ff6b6b";

        }

    });

}