/**
 * Horizon National Bank - Core UI Controller
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme Persistence Control
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const currentTheme = localStorage.getItem("theme") || "light";

    document.documentElement.setAttribute("data-theme", currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = currentTheme === "dark"
            ? `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`
            : `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;

        themeToggleBtn.addEventListener("click", () => {
            const activeTheme = document.documentElement.getAttribute("data-theme");
            const targetTheme = activeTheme === "light" ? "dark" : "light";

            document.documentElement.setAttribute("data-theme", targetTheme);
            localStorage.setItem("theme", targetTheme);

            themeToggleBtn.innerHTML = targetTheme === "dark"
                ? `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`
                : `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
        });
    }

    // 2. Mobile Responsive Navigation Toggle
    const hamburgerBtn = document.getElementById("mobile-hamburger");
    const sidebar = document.getElementById("sidebar");

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }

    // 3. Global Logout Execution
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem(DB_KEYS.SESSION);
            Utils.showToast("Signed out successfully.", "info");
            setTimeout(() => window.location.href = "login.html", 800);
        });
    }

    // 4. Global Quick Search Handler
    const searchInput = document.getElementById("global-search");
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `transactions.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});