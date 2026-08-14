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