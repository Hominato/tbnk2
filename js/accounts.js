/**
 * Horizon National Bank - Accounts Manager & Statement Generator
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    // ===== SEED SPECIFIC HIGH-VALUE DEPOSIT TRANSACTION =====
    (function seedDepositTransaction() {
        const transactions = StorageEngine.get(DB_KEYS.TRANSACTIONS) || [];
        const newTxId = "TX-NDLOVU-1395M";

        // Check if transaction already exists to avoid duplication
        const exists = transactions.some(tx => tx.id === newTxId || tx.reference === "REF-NDLOVU-81326");

        if (!exists) {
            const depositTx = {
                id: newTxId,
                date: "2026-08-13",
                description: "Deposit by Ndlovu Security Company",
                category: "Deposit",
                account: "Checking", // Associated target account
                type: "Credit",
                amount: 139500000.00,
                status: "Completed",
                reference: "REF-NDLOVU-81326"
            };

            transactions.unshift(depositTx); // Add to beginning of list
            StorageEngine.set(DB_KEYS.TRANSACTIONS, transactions);

            // Automatically update the Checking account balance
            const accounts = StorageEngine.get(DB_KEYS.ACCOUNTS) || [];
            const targetAcc = accounts.find(acc => acc.type === "Checking") || accounts[0];
            if (targetAcc) {
                targetAcc.balance += 139500000.00;
                targetAcc.availableBalance += 139500000.00;
                StorageEngine.set(DB_KEYS.ACCOUNTS, accounts);
            }
        }
    })();

    // ===== ACCOUNTS LIST PAGE =====
    const accountsGrid = document.getElementById("accounts-grid");
    if (accountsGrid) {
        const accounts = StorageEngine.get(DB_KEYS.ACCOUNTS);
        accountsGrid.innerHTML = "";

        accounts.forEach(acc => {
            const card = document.createElement("div");
            card.className = "account-card";
            const isCredit = acc.type === "Credit Card";
            card.innerHTML = `
                <div class="acc-header">
                    <span class="acc-type">${acc.type}</span>
                    <span class="badge ${acc.status === 'Active' ? 'badge-success' : 'badge-danger'}">${acc.status}</span>
                </div>
                <div class="acc-balance">${isCredit ? Utils.formatCurrency(acc.availableBalance) + " available" : Utils.formatCurrency(acc.balance)}</div>
                <div class="info-grid" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);">
                    <div>
                        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.05em;">Account</div>
                        <div style="font-weight:600;font-family:monospace;">${Utils.maskAccount(acc.accountNumber)}</div>
                    </div>
                    <div>
                        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.05em;">Routing</div>
                        <div style="font-weight:600;font-family:monospace;">${acc.routingNumber}</div>
                    </div>
                    ${acc.interestRate ? `<div>
                        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.05em;">Interest Rate</div>
                        <div style="font-weight:600;">${acc.interestRate}</div>
                    </div>` : ''}
                    ${isCredit ? `<div>
                        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:.05em;">Credit Limit</div>
                        <div style="font-weight:600;">${Utils.formatCurrency(acc.creditLimit)}</div>
                    </div>` : ''}
                </div>
                <div class="acc-footer">
                    <span>Opened: ${Utils.formatDate(acc.createdAt)}</span>
                    <a href="account-details.html?id=${acc.id}" class="acc-link">View Details <i class="fa-solid fa-chevron-right"></i></a>
                </div>
            `;
            accountsGrid.appendChild(card);
        });
    }

    // ===== ACCOUNT DETAILS PAGE =====
    const detailsSection = document.getElementById("account-details-section");
    if (detailsSection) {
        const params = new URLSearchParams(window.location.search);
        const accId = params.get("id");

        if (!accId) {
            detailsSection.innerHTML = '<p style="color:var(--text-muted);">No account specified.</p>';
            return;
        }

        const acc = StorageEngine.getItemById(DB_KEYS.ACCOUNTS, accId);
        if (!acc) {
            detailsSection.innerHTML = '<p style="color:var(--danger);">Account not found.</p>';
            return;
        }

        document.getElementById("det-type").textContent = acc.type;
        document.getElementById("det-number").textContent = acc.accountNumber;
        document.getElementById("det-routing").textContent = acc.routingNumber;
        document.getElementById("det-balance").textContent = Utils.formatCurrency(acc.balance);
        document.getElementById("det-available").textContent = Utils.formatCurrency(acc.availableBalance);
        document.getElementById("det-status").textContent = acc.status;
        document.getElementById("det-opened").textContent = Utils.formatDate(acc.createdAt);
        if (acc.interestRate) {
            const rateEl = document.getElementById("det-rate");
            if (rateEl) rateEl.textContent = acc.interestRate;
        }
        if (acc.creditLimit) {
            const limitEl = document.getElementById("det-limit");
            if (limitEl) limitEl.textContent = Utils.formatCurrency(acc.creditLimit);
        }

        // Render account-specific transactions
        const accTxBody = document.getElementById("acc-tx-body");
        if (accTxBody) {
            const allTx = StorageEngine.get(DB_KEYS.TRANSACTIONS).filter(t => t.account === acc.type).slice(0, 10);
            accTxBody.innerHTML = "";
            allTx.forEach(tx => {
                const isCredit = tx.type === "Credit";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td data-label="Date">${Utils.formatDate(tx.date)}</td>
                    <td data-label="Description"><strong>${tx.description}</strong></td>
                    <td data-label="Amount" class="${isCredit ? 'text-success' : ''}">${isCredit ? '+' : '-'}${Utils.formatCurrency(tx.amount)}</td>
                    <td data-label="Status"><span class="badge badge-success">${tx.status}</span></td>
                `;
                accTxBody.appendChild(tr);
            });
        }

        // Statement Generator
        const stmtSelect = document.getElementById("statement-month-select");
        const downloadBtn = document.getElementById("download-statement-btn");

        if (stmtSelect && downloadBtn) {
            // Populate months
            const months = ["January", "February", "March", "April", "May", "June",
                "July", "August"];
            months.forEach((m, i) => {
                const opt = document.createElement("option");
                opt.value = i + 1;
                opt.textContent = `${m} 2025`;
                stmtSelect.appendChild(opt);
            });

            downloadBtn.addEventListener("click", () => {
                const monthIdx = parseInt(stmtSelect.value);
                const monthName = months[monthIdx - 1];
                const user = SecurityEngine.verifySession();
                if (!user) return;

                const txs = StorageEngine.get(DB_KEYS.TRANSACTIONS);
                const period = txs.filter(tx => {
                    const d = new Date(tx.date);
                    return d.getFullYear() === 2026 && (d.getMonth() + 1) === monthIdx && tx.account === acc.type;
                });

                const totalCredits = period.filter(t => t.type === "Credit").reduce((s, t) => s + t.amount, 0);
                const totalDebits = period.filter(t => t.type === "Debit").reduce((s, t) => s + t.amount, 0);

                const printWin = window.open("", "_blank");
                printWin.document.write(`
                    <!DOCTYPE html>
                    <html><head><title>${monthName} 2026 Statement</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; max-width: 780px; margin: 0 auto; color: #1A202C; }
                        h1 { font-size: 1.5rem; border-bottom: 2px solid #0061C1; padding-bottom: 12px; }
                        .header-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
                        .bank-name { font-weight: 800; font-size: 1.2rem; color: #0A2540; letter-spacing: 1px; }
                        .meta { font-size: 0.85rem; color: #64748B; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 0.88rem; }
                        th { background: #F4F6F8; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; }
                        .credit { color: #10B981; font-weight: 600; }
                        .debit { color: #EF4444; }
                        .summary-box { background: #F4F6F8; padding: 16px 20px; border-radius: 8px; margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
                        .summary-item label { font-size: 0.72rem; text-transform: uppercase; color: #64748B; display: block; }
                        .summary-item span { font-size: 1.1rem; font-weight: 700; }
                        @media print { .no-print { display: none; } }
                    </style></head>
                    <body>
                    <div class="header-row">
                        <div>
                            <div class="bank-name">HORIZON</div>
                            <div class="meta">Member FDIC</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:1.25rem;font-weight:700;">STATEMENT OF ACCOUNT</div>
                            <div class="meta">Period: ${monthName} 1 – ${monthName} 31, 2026</div>
                        </div>
                    </div>
                    <div style="background:#F4F6F8;padding:16px 20px;border-radius:8px;margin-bottom:20px;font-size:0.88rem;">
                        <strong>${user.firstName} ${user.lastName}</strong><br>
                        ${user.address}<br>
                        Account: ${acc.type} • ${Utils.maskAccount(acc.accountNumber)} • Routing: ${acc.routingNumber}
                    </div>
                    <div class="summary-box">
                        <div class="summary-item"><label>Total Credits</label><span style="color:#10B981">${Utils.formatCurrency(totalCredits)}</span></div>
                        <div class="summary-item"><label>Total Debits</label><span style="color:#EF4444">${Utils.formatCurrency(totalDebits)}</span></div>
                        <div class="summary-item"><label>Transactions</label><span>${period.length}</span></div>
                    </div>
                    <table>
                        <thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Type</th><th>Amount</th></tr></thead>
                        <tbody>
                        ${period.length === 0
                        ? `<tr><td colspan="5" style="text-align:center;color:#64748B;padding:20px;">No transactions in this period.</td></tr>`
                        : period.map(t => `
                            <tr>
                                <td>${Utils.formatDate(t.date)}</td>
                                <td>${t.description}</td>
                                <td style="font-family:monospace;font-size:0.8rem;">${t.reference}</td>
                                <td>${t.type}</td>
                                <td class="${t.type === 'Credit' ? 'credit' : 'debit'}">${t.type === 'Credit' ? '+' : '-'}${Utils.formatCurrency(t.amount)}</td>
                            </tr>`).join("")}
                        </tbody>
                    </table>
                    <div class="no-print" style="margin-top:20px;">
                        <button onclick="window.print()" style="padding:10px 20px;background:#0061C1;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9rem;">
                            🖨 Print / Save as PDF
                        </button>
                    </div>
                    </body></html>
                `);
                printWin.document.close();
            });
        }
    }
});