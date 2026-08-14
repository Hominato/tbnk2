/**
 * Horizon National Bank - Demonstration Security Engine
 */
"use strict";

const SecurityEngine = (() => {
    const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 Minutes
    let inactivityTimer;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        if (sessionStorage.getItem(DB_KEYS.SESSION)) {
            inactivityTimer = setTimeout(handleSessionTimeout, TIMEOUT_DURATION);
        }
    };

    const handleSessionTimeout = () => {
        sessionStorage.removeItem(DB_KEYS.SESSION);
        alert("Session expired due to inactivity. Please sign in again.");
        window.location.href = "login.html?reason=timeout";
    };

    const initListeners = () => {
        window.onload = resetTimer;
        document.onmousemove = resetTimer;
        document.onkeypress = resetTimer;
        document.ontouchstart = resetTimer;
        document.onclick = resetTimer;
    };

    return {
        init: () => {
            initListeners();
        },

        verifySession: () => {
            const activeSession = sessionStorage.getItem(DB_KEYS.SESSION);
            if (!activeSession) {
                window.location.href = "login.html";
                return null;
            }
            return JSON.parse(activeSession);
        },

        togglePasswordVisibility: (inputEl, iconEl) => {
            if (inputEl.type === "password") {
                inputEl.type = "text";
                iconEl.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                inputEl.type = "password";
                iconEl.classList.replace("fa-eye-slash", "fa-eye");
            }
        }
    };
})();

// Auto Initialize Inactivity Security Watcher
SecurityEngine.init();