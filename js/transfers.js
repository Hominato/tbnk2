/**
 * Horizon National Bank - Transfers System (updated with step indicators)
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();

    const step1 = document.getElementById("transfer-step-1");
    const step2 = document.getElementById("transfer-step-2");
    const step3 = document.getElementById("transfer-step-3");

    if (!step1) return;

    const setStep = (n) => {
        [step1, step2, step3].forEach((s, i) => s.classList.toggle("active", i + 1 === n));
        [1, 2, 3].forEach(i => {
            const dot = document.getElementById(`sdot-${i}`);
            const line = document.getElementById(`sline-${i}`);
            if (dot) {
                dot.classList.remove("active", "done");
                if (i < n) dot.classList.add("done");
                if (i === n) dot.classList.add("active");
            }
            if (line) line.classList.toggle("done", i < n - 1);
        });
    };

    const fromAccSelect = document.getElementById("from-account");
    const recipientSelect = document.getElementById("to-recipient");
    const accounts = StorageEngine.get(DB_KEYS.ACCOUNTS);
    const beneficiaries = StorageEngine.get(DB_KEYS.BENEFICIARIES);

    // Populate accounts (exclude credit card)
    accounts.filter(a => a.type !== "Credit Card").forEach(acc => {
        const opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = `${acc.type} (${Utils.maskAccount(acc.accountNumber)}) — ${Utils.formatCurrency(acc.availableBalance)} available`;
        fromAccSelect.appendChild(opt);
    });

    // Add "Internal Transfer to Savings" option first
    const internalOpt = document.createElement("option");
    internalOpt.value = "INTERNAL";
    internalOpt.textContent = "My Savings Account (Internal Transfer)";
    recipientSelect.appendChild(internalOpt);

    beneficiaries.forEach(ben => {
        const opt = document.createElement("option");
        opt.value = ben.id;
        opt.textContent = `${ben.name} — ${ben.bankName} (${ben.nickname})`;
        recipientSelect.appendChild(opt);
    });

    let currentTransferState = {};

    // Step 1 → Step 2
    document.getElementById("btn-review-transfer").addEventListener("click", () => {
        const accountId = fromAccSelect.value;
        const recipientId = recipientSelect.value;
        const amount = parseFloat(document.getElementById("transfer-amount").value);
        const transferDate = document.getElementById("transfer-date").value;
        const memo = document.getElementById("transfer-memo").value || "No memo";

        if (!accountId || !recipientId || isNaN(amount) || amount <= 0) {
            Utils.showToast("Please fill in all required transfer fields.", "warning");
            return;
        }

        const sourceAccount = accounts.find(a => a.id === accountId);
        if (!sourceAccount) return;

        if (sourceAccount.availableBalance < amount) {
            Utils.showToast(`Insufficient funds. Available: ${Utils.formatCurrency(sourceAccount.availableBalance)}`, "danger");
            return;
        }

        const isInternal = recipientId === "INTERNAL";
        const recipient = isInternal
            ? { name: "My Savings Account", bankName: "BOA (Internal)" }
            : beneficiaries.find(b => b.id === recipientId);

        if (!recipient) {
            Utils.showToast("Please select a valid recipient.", "warning");
            return;
        }

        currentTransferState = { sourceAccount, recipient, recipientId, isInternal, amount, memo, transferDate };

        document.getElementById("review-from").textContent = `${sourceAccount.type} (${Utils.maskAccount(sourceAccount.accountNumber)})`;
        document.getElementById("review-to").textContent = `${recipient.name} — ${recipient.bankName}`;
        document.getElementById("review-amount").textContent = Utils.formatCurrency(amount);
        document.getElementById("review-fee").textContent = "$0.00 (Standard ACH — Free)";
        document.getElementById("review-total").textContent = Utils.formatCurrency(amount);
        document.getElementById("review-date").textContent = Utils.formatDate(transferDate);
        document.getElementById("review-memo").textContent = memo;

        setStep(2);
    });

    document.getElementById("btn-back-step1").addEventListener("click", () => setStep(1));

    // Step 2 → Step 3
    document.getElementById("btn-confirm-transfer").addEventListener("click", () => {
        const { sourceAccount, recipient, isInternal, amount, memo, transferDate } = currentTransferState;

        // Deduct from source
        StorageEngine.updateItem(DB_KEYS.ACCOUNTS, sourceAccount.id, {
            balance: sourceAccount.balance - amount,
            availableBalance: sourceAccount.availableBalance - amount
        });

        // If internal, credit to savings
        if (isInternal) {
            const savings = StorageEngine.get(DB_KEYS.ACCOUNTS).find(a => a.type === "Savings");
            if (savings) {
                StorageEngine.updateItem(DB_KEYS.ACCOUNTS, savings.id, {
                    balance: savings.balance + amount,
                    availableBalance: savings.availableBalance + amount
                });
            }
        }

        // Create debit transaction
        const newTx = {
            id: Utils.generateId("TXN"),
            date: transferDate,
            time: new Date().toTimeString().split(" ")[0].substring(0, 5),
            description: `Transfer to ${recipient.name}${memo !== "No memo" ? ` (${memo})` : ""}`,
            category: "Transfer",
            type: "Debit",
            account: sourceAccount.type,
            amount,
            status: "Completed",
            reference: Utils.generateId("REF")
        };
        StorageEngine.addItem(DB_KEYS.TRANSACTIONS, newTx);

        // Notification
        StorageEngine.addItem(DB_KEYS.NOTIFICATIONS, {
            id: Utils.generateId("NOTIF"),
            title: "Transfer Completed",
            message: `${Utils.formatCurrency(amount)} transferred to ${recipient.name}.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: "transaction"
        });

        // Update confirmation UI
        document.getElementById("confirm-ref").textContent = newTx.reference;
        document.getElementById("confirm-date").textContent = Utils.formatDate(transferDate);
        document.getElementById("confirm-amount").textContent = Utils.formatCurrency(amount);

        setStep(3);
        Utils.showToast("Transfer completed successfully!", "success");
    });

    setStep(1);
});