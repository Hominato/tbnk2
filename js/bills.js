/**
 * Horizon National Bank - Bill Pay System
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    const billsBody = document.getElementById("bills-body");
    const addBillForm = document.getElementById("add-bill-form");
    const payModal = document.getElementById("pay-bill-modal");

    if (!billsBody) return;

    let selectedBillId = null;

    const render = () => {
        const bills = StorageEngine.get(DB_KEYS.BILLS);
        billsBody.innerHTML = "";

        if (bills.length === 0) {
            billsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No bills scheduled yet.</td></tr>`;
            return;
        }

        bills.forEach(bill => {
            const statusClass = bill.status === "Completed" ? "badge-success" :
                                bill.status === "Failed" ? "badge-danger" : "badge-warning";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td data-label="Biller"><strong>${bill.billerName}</strong></td>
                <td data-label="Category"><span class="badge badge-info">${bill.category}</span></td>
                <td data-label="Amount"><strong>${Utils.formatCurrency(bill.amount)}</strong></td>
                <td data-label="Due Date">${Utils.formatDate(bill.dueDate)}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${bill.status}</span></td>
                <td data-label="Actions">
                    ${bill.status !== "Completed" ? `
                    <button class="btn btn-primary btn-sm" onclick="BillManager.openPayModal('${bill.id}')">
                        <i class="fa-solid fa-paper-plane"></i> Pay Now
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="BillManager.cancel('${bill.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>` : `<span class="text-muted">Paid</span>`}
                </td>
            `;
            billsBody.appendChild(tr);
        });
    };

    window.BillManager = {
        openPayModal: (id) => {
            selectedBillId = id;
            const bill = StorageEngine.getItemById(DB_KEYS.BILLS, id);
            if (!bill || !payModal) return;
            document.getElementById("pay-bill-name").textContent = bill.billerName;
            document.getElementById("pay-bill-amount").textContent = Utils.formatCurrency(bill.amount);

            // Populate account picker
            const accSelect = document.getElementById("pay-from-account");
            accSelect.innerHTML = "";
            StorageEngine.get(DB_KEYS.ACCOUNTS).forEach(acc => {
                if (acc.type !== "Credit Card") {
                    const opt = document.createElement("option");
                    opt.value = acc.id;
                    opt.textContent = `${acc.type} (${Utils.maskAccount(acc.accountNumber)}) - ${Utils.formatCurrency(acc.availableBalance)}`;
                    accSelect.appendChild(opt);
                }
            });
            payModal.classList.add("active");
        },

        confirmPay: () => {
            const bill = StorageEngine.getItemById(DB_KEYS.BILLS, selectedBillId);
            const accId = document.getElementById("pay-from-account").value;
            const account = StorageEngine.getItemById(DB_KEYS.ACCOUNTS, accId);

            if (!bill || !account) return;

            if (account.availableBalance < bill.amount) {
                Utils.showToast("Insufficient funds to pay this bill.", "danger");
                return;
            }

            // Deduct from account
            StorageEngine.updateItem(DB_KEYS.ACCOUNTS, accId, {
                balance: account.balance - bill.amount,
                availableBalance: account.availableBalance - bill.amount
            });

            // Mark bill as completed
            StorageEngine.updateItem(DB_KEYS.BILLS, selectedBillId, { status: "Completed" });

            // Record transaction
            StorageEngine.addItem(DB_KEYS.TRANSACTIONS, {
                id: Utils.generateId("TXN"),
                date: new Date().toISOString().split("T")[0],
                time: new Date().toTimeString().split(" ")[0].substring(0, 5),
                description: `Bill Payment - ${bill.billerName}`,
                category: "Bills",
                type: "Debit",
                account: account.type,
                amount: bill.amount,
                status: "Completed",
                reference: Utils.generateId("REF")
            });

            StorageEngine.addItem(DB_KEYS.NOTIFICATIONS, {
                id: Utils.generateId("NOTIF"),
                title: "Bill Payment Processed",
                message: `${Utils.formatCurrency(bill.amount)} paid to ${bill.billerName}.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: "transaction"
            });

            payModal.classList.remove("active");
            Utils.showToast(`${bill.billerName} bill paid successfully!`, "success");
            render();
        },

        cancel: (id) => {
            if (!confirm("Cancel this scheduled bill?")) return;
            StorageEngine.deleteItem(DB_KEYS.BILLS, id);
            Utils.showToast("Scheduled bill cancelled.", "info");
            render();
        }
    };

    if (addBillForm) {
        addBillForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const billerName = document.getElementById("bill-name").value.trim();
            const category = document.getElementById("bill-category").value;
            const amount = parseFloat(document.getElementById("bill-amount").value);
            const dueDate = document.getElementById("bill-due").value;

            if (!billerName || isNaN(amount) || amount <= 0 || !dueDate) {
                Utils.showToast("Please fill in all fields correctly.", "warning");
                return;
            }

            StorageEngine.addItem(DB_KEYS.BILLS, {
                id: Utils.generateId("BILL"),
                billerName,
                category,
                amount,
                dueDate,
                autoPay: false,
                status: "Scheduled"
            });

            Utils.showToast(`${billerName} added to your bill schedule.`, "success");
            addBillForm.reset();
            render();
        });
    }

    // Pay modal close
    if (payModal) {
        document.getElementById("close-pay-modal").addEventListener("click", () => {
            payModal.classList.remove("active");
        });
        document.getElementById("confirm-pay-btn").addEventListener("click", BillManager.confirmPay);
    }

    render();
});
