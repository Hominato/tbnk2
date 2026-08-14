/**
 * Horizon National Bank - Notifications Manager
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    const notifList = document.getElementById("notifications-list");
    const markAllBtn = document.getElementById("mark-all-read-btn");

    if (!notifList) return;

    const getRelativeTime = (isoString) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);
        if (days > 0) return `${days}d ago`;
        if (hrs > 0) return `${hrs}h ago`;
        if (mins > 0) return `${mins}m ago`;
        return "Just now";
    };

    const iconMap = {
        security: "fa-shield-halved",
        transaction: "fa-arrow-right-arrow-left",
        info: "fa-circle-info"
    };

    const render = () => {
        const notifs = StorageEngine.get(DB_KEYS.NOTIFICATIONS).sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        notifList.innerHTML = "";

        if (notifs.length === 0) {
            notifList.innerHTML = `
                <div style="text-align:center;padding:3rem;color:var(--text-muted);">
                    <i class="fa-solid fa-bell-slash" style="font-size:3rem;margin-bottom:1rem;opacity:0.3;display:block;"></i>
                    <p>No notifications yet.</p>
                </div>`;
            return;
        }

        notifs.forEach(n => {
            const div = document.createElement("div");
            div.className = `notif-item ${n.read ? "" : "unread"}`;
            div.setAttribute("data-id", n.id);
            div.innerHTML = `
                <div class="notif-icon-wrap ${n.type || 'info'}">
                    <i class="fa-solid ${iconMap[n.type] || 'fa-circle-info'}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${getRelativeTime(n.timestamp)}</div>
                </div>
                ${!n.read ? '<div class="unread-dot"></div>' : ''}
            `;
            div.addEventListener("click", () => {
                StorageEngine.updateItem(DB_KEYS.NOTIFICATIONS, n.id, { read: true });
                render();
                updateBadge();
            });
            notifList.appendChild(div);
        });
    };

    const updateBadge = () => {
        const unread = StorageEngine.get(DB_KEYS.NOTIFICATIONS).filter(n => !n.read).length;
        const badge = document.getElementById("notif-count");
        if (badge) badge.textContent = unread > 0 ? unread : "";
    };

    if (markAllBtn) {
        markAllBtn.addEventListener("click", () => {
            const notifs = StorageEngine.get(DB_KEYS.NOTIFICATIONS);
            notifs.forEach(n => StorageEngine.updateItem(DB_KEYS.NOTIFICATIONS, n.id, { read: true }));
            Utils.showToast("All notifications marked as read.", "success");
            render();
            updateBadge();
        });
    }

    render();
    updateBadge();
});
