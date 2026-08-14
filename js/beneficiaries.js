/**
 * Horizon National Bank - Beneficiaries Manager
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    const listContainer = document.getElementById("beneficiaries-list");
    const addModal = document.getElementById("add-beneficiary-modal");
    const addForm = document.getElementById("add-beneficiary-form");
    const addBtn = document.getElementById("btn-add-beneficiary");

    if (!listContainer) return;

    const render = () => {
        const bens = StorageEngine.get(DB_KEYS.BENEFICIARIES);
        listContainer.innerHTML = "";

        if (bens.length === 0) {
            listContainer.innerHTML = `
                <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">
                    No payees added yet. Click "Add Payee" to get started.
                </td></tr>`;
            return;
        }

        bens.forEach(b => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td data-label="Name"><strong>${b.name}</strong><br><small class="text-muted">${b.nickname || ''}</small></td>
                <td data-label="Bank">${b.bankName}</td>
                <td data-label="Account">${b.accountNumber}</td>
                <td data-label="Type"><span class="badge badge-info">${b.type}</span></td>
                <td data-label="Actions">
                    <button class="btn btn-danger btn-sm" onclick="BenManager.delete('${b.id}')">
                        <i class="fa-solid fa-trash"></i> Remove
                    </button>
                </td>
            `;
            listContainer.appendChild(tr);
        });
    };

    window.BenManager = {
        delete: (id) => {
            if (!confirm("Remove this payee from your account?")) return;
            StorageEngine.deleteItem(DB_KEYS.BENEFICIARIES, id);
            StorageEngine.addItem(DB_KEYS.NOTIFICATIONS, {
                id: Utils.generateId("NOTIF"),
                title: "Payee Removed",
                message: "A payee has been removed from your account.",
                timestamp: new Date().toISOString(),
                read: false,
                type: "security"
            });
            Utils.showToast("Payee removed successfully.", "success");
            render();
        }
    };

    if (addBtn && addModal) {
        addBtn.addEventListener("click", () => addModal.classList.add("active"));
        document.getElementById("close-add-ben-modal").addEventListener("click", () => addModal.classList.remove("active"));
    }

    if (addForm) {
        addForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("ben-name").value.trim();
            const bankName = document.getElementById("ben-bank").value.trim();
            const accountNumber = document.getElementById("ben-account").value.trim();
            const routingNumber = document.getElementById("ben-routing").value.trim();
            const type = document.getElementById("ben-type").value;
            const nickname = document.getElementById("ben-nickname").value.trim();

            if (!name || !bankName || !accountNumber || !routingNumber) {
                Utils.showToast("Please fill in all required fields.", "warning");
                return;
            }

            const newBen = {
                id: Utils.generateId("BEN"),
                name,
                bankName,
                accountNumber: `••••••••${accountNumber.slice(-4)}`,
                routingNumber,
                type,
                nickname
            };

            StorageEngine.addItem(DB_KEYS.BENEFICIARIES, newBen);
            StorageEngine.addItem(DB_KEYS.NOTIFICATIONS, {
                id: Utils.generateId("NOTIF"),
                title: "Payee Added",
                message: `${name} has been added as a payee.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: "info"
            });

            Utils.showToast(`${name} added as a payee.`, "success");
            addModal.classList.remove("active");
            addForm.reset();
            render();
        });
    }

    render();
});
