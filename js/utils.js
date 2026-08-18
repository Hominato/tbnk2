/**
 * Horizon National Bank - Common Utilities & Helpers
 */
"use strict";

const Utils = {
    formatCurrency: (amount) => {
        const numeric = parseFloat(amount);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(numeric);
    },

    formatDate: (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    maskAccount: (accNum) => {
        if (!accNum) return "••••";
        const str = String(accNum);
        return `•••• ${str.slice(-4)}`;
    },

    generateId: (prefix = "ID") => {
        return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    },

    showToast: (message, type = "info") => {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        let iconClass = "fa-circle-info";
        if (type === "success") iconClass = "fa-circle-check";
        if (type === "danger") iconClass = "fa-triangle-exclamation";
        if (type === "warning") iconClass = "fa-circle-exclamation";

        toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Global Simulation Footer Auto-Injector
document.addEventListener("DOMContentLoaded", () => {
    // Exclude login page from auto-injecting demo notifications/footer
    const path = window.location.pathname;
    if (path.endsWith("login.html") || path.endsWith("/login")) return;

    if (!document.querySelector(".simulation-footer") && !document.querySelector("footer.footer")) {
        const simFooter = document.createElement("footer");
        simFooter.className = "simulation-footer";
        simFooter.innerHTML = `
            <div class="simulation-footer-content">
                <div class="simulation-badge">
                    <i class="fa-solid fa-flask"></i> EDUCATIONAL SIMULATION DEMO ONLY
                </div>
                <p>This application is a synthetic online banking simulation created for educational and portfolio demonstration purposes. No real monetary transactions, live bank accounts, or real user credentials are used or processed.</p>
                <small>&copy; 2026 Horizon National Bank Demo Environment. All rights reserved.</small>
            </div>
        `;

        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.appendChild(simFooter);
        } else {
            document.body.appendChild(simFooter);
        }
    }
});