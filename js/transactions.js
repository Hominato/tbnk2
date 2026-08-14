/**
 * Horizon National Bank - Transaction Engine Filters & Receipts
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    const tbody = document.getElementById("full-transactions-body");
    const searchInput = document.getElementById("txn-search-input");
    const filterType = document.getElementById("filter-type");
    const filterAccount = document.getElementById("filter-account");

    if (!tbody) return;

    const render = () => {
        let txs = StorageEngine.get(DB_KEYS.TRANSACTIONS);
        const searchVal = searchInput ? searchInput.value.toLowerCase() : "";
        const typeVal = filterType ? filterType.value : "All";
        const accVal = filterAccount ? filterAccount.value : "All";

        // Filter Logic
        txs = txs.filter(tx => {
            const matchesSearch = tx.description.toLowerCase().includes(searchVal) || tx.reference.toLowerCase().includes(searchVal);
            const matchesType = typeVal === "All" || tx.type === typeVal;
            const matchesAccount = accVal === "All" || tx.account === accVal;
            return matchesSearch && matchesType && matchesAccount;
        });

        tbody.innerHTML = "";

        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No matching transactions found.</td></tr>`;
            return;
        }

        txs.forEach(tx => {
            const tr = document.createElement("tr");
            const isCredit = tx.type === "Credit";
            tr.innerHTML = `
        <td>${Utils.formatDate(tx.date)}</td>
        <td><strong>${tx.description}</strong><br><small class="text-muted">Ref: ${tx.reference}</small></td>
        <td><span class="badge badge-warning">${tx.category}</span></td>
        <td>${tx.account}</td>
        <td class="${isCredit ? 'text-success' : ''}">${isCredit ? '+' : '-'}${Utils.formatCurrency(tx.amount)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="alert('Transaction Receipt\\nRef: ${tx.reference}\\nAmount: $${tx.amount}\\nStatus: ${tx.status}')">
            Receipt
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });
    };

    if (searchInput) searchInput.addEventListener("input", render);
    if (filterType) filterType.addEventListener("change", render);
    if (filterAccount) filterAccount.addEventListener("change", render);

    render();
});