/**
 * Horizon National Bank - Auth Handler
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    // Login Form Processor
    if (loginForm) {
        let failedAttempts = parseInt(localStorage.getItem("hnb_login_attempts") || "0");

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (failedAttempts >= 5) {
                Utils.showToast("Account locked due to multiple failed login attempts. Reset password to unlock.", "danger");
                return;
            }

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const users = StorageEngine.get(DB_KEYS.USERS);

            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (user && user.passwordHash === password) {
                localStorage.setItem("hnb_login_attempts", "0");
                sessionStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));

                // Dispatch Email Notification
                EmailNotifier.sendAlert("loginAlert", {
                    to_name: `${user.firstName} ${user.lastName}`,
                    to_email: user.email,
                    time: new Date().toLocaleString()
                });

                Utils.showToast("Login successful! Redirecting...", "success");
                setTimeout(() => window.location.href = "dashboard.html", 1000);
            } else {
                failedAttempts++;
                localStorage.setItem("hnb_login_attempts", failedAttempts.toString());
                Utils.showToast(`Invalid credentials. ${5 - failedAttempts} attempts remaining.`, "danger");
            }
        });
    }

    // Registration Form Processor
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const firstName = document.getElementById("reg-firstName").value.trim();
            const lastName = document.getElementById("reg-lastName").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const phone = document.getElementById("reg-phone").value.trim();
            const dob = document.getElementById("reg-dob").value;
            const address = document.getElementById("reg-address").value.trim();
            const password = document.getElementById("reg-password").value;
            const confirmPassword = document.getElementById("reg-confirmPassword").value;

            if (password !== confirmPassword) {
                Utils.showToast("Passwords do not match.", "danger");
                return;
            }

            const users = StorageEngine.get(DB_KEYS.USERS);
            if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                Utils.showToast("An account with this email address already exists.", "warning");
                return;
            }

            const newUser = {
                id: Utils.generateId("USR"),
                firstName,
                lastName,
                email,
                phone,
                dob,
                address,
                passwordHash: password,
                registeredAt: new Date().toISOString(),
                twoFactorEnabled: false,
                securityScore: 75
            };

            // Create Primary Checking Account
            const newAccount = {
                id: Utils.generateId("ACC"),
                type: "Checking",
                accountNumber: `10${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                routingNumber: "021000021",
                balance: 500.00, // Sign-up Bonus
                availableBalance: 500.00,
                status: "Active",
                createdAt: new Date().toISOString().split("T")[0]
            };

            StorageEngine.addItem(DB_KEYS.USERS, newUser);
            StorageEngine.addItem(DB_KEYS.ACCOUNTS, newAccount);

            EmailNotifier.sendAlert("welcome", {
                to_name: `${firstName} ${lastName}`,
                to_email: email
            });

            Utils.showToast("Account created successfully! Please sign in.", "success");
            setTimeout(() => window.location.href = "login.html", 1500);
        });
    }
});