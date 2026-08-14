/**
 * Horizon National Bank - Transfers System
 * Supports Saved Beneficiaries and New External Recipients with EmailJS Alerts
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    if (typeof SecurityEngine !== "undefined") {
        SecurityEngine.verifySession();
    }

    const step1 = document.getElementById("transfer-step-1");
    const step2 = document.getElementById("transfer-step-2");
    const step3 = document.getElementById("transfer-step-3");

    if (!step1) return;

    // Step Switcher
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

    // Form DOM Elements
    const fromAccSelect = document.getElementById("from-account");
    const radioSaved = document.getElementById("type-saved");
    const radioNew = document.getElementById("type-new");
    const recipientSelect = document.getElementById("to-recipient");

    // New Recipient Inputs
    const newNameInput = document.getElementById("new-recipient-name");
    const newBankInput = document.getElementById("new-bank-name");
    const newRoutingInput = document.getElementById("new-routing-number");
    const newAccNumInput = document.getElementById("new-account-number");

    // General Transfer Inputs
    const recipientEmailInput = document.getElementById("recipient-email");
    const notifyCheckbox = document.getElementById("notify-recipient");

    const accounts = (typeof StorageEngine !== "undefined" && StorageEngine.get(DB_KEYS.ACCOUNTS)) || [];
    const beneficiaries = (typeof StorageEngine !== "undefined" && StorageEngine.get(DB_KEYS.BENEFICIARIES)) || [];

    // Populate source accounts (excluding Credit Cards)
    if (fromAccSelect) {
        accounts.filter(a => a.type !== "Credit Card").forEach(acc => {
            const opt = document.createElement("option");
            opt.value = acc.id;
            opt.textContent = `${acc.type} (${Utils.maskAccount(acc.accountNumber)}) — ${Utils.formatCurrency(acc.availableBalance)} available`;
            fromAccSelect.appendChild(opt);
        });
    }

    // Populate saved beneficiaries + internal option
    if (recipientSelect) {
        const internalOpt = document.createElement("option");
        internalOpt.value = "INTERNAL";
        internalOpt.textContent = "My Savings Account (Internal Transfer)";
        recipientSelect.appendChild(internalOpt);

        beneficiaries.forEach(ben => {
            const opt = document.createElement("option");
            opt.value = ben.id;
            opt.textContent = `${ben.name} — ${ben.bankName} (${ben.nickname || 'Saved'})`;
            recipientSelect.appendChild(opt);
        });
    }

    let currentTransferState = {};

    // STEP 1 -> STEP 2 (REVIEW)
    document.getElementById("btn-review-transfer").addEventListener("click", () => {
        const accountId = fromAccSelect.value;
        const isNewRecipient = radioNew && radioNew.checked;

        const recipientEmail = recipientEmailInput ? recipientEmailInput.value.trim() : "";
        const shouldNotify = notifyCheckbox ? notifyCheckbox.checked : false;
        const amount = parseFloat(document.getElementById("transfer-amount").value);
        const transferDate = document.getElementById("transfer-date").value;
        const memo = document.getElementById("transfer-memo").value || "No memo";

        // Validate Source Account and Amount
        if (!accountId || isNaN(amount) || amount <= 0) {
            Utils.showToast("Please select an account and enter a valid transfer amount.", "warning");
            return;
        }

        const sourceAccount = accounts.find(a => a.id === accountId);
        if (!sourceAccount) return;

        if (sourceAccount.availableBalance < amount) {
            Utils.showToast(`Insufficient funds. Available: ${Utils.formatCurrency(sourceAccount.availableBalance)}`, "danger");
            return;
        }

        // Validate Email
        if (!recipientEmail || (typeof Email !== "undefined" && !Email.validateEmail(recipientEmail))) {
            Utils.showToast("Please enter a valid recipient email address.", "warning");
            if (recipientEmailInput) recipientEmailInput.focus();
            return;
        }

        let recipient = {};
        let isInternal = false;

        if (isNewRecipient) {
            // Read New Recipient Data
            const name = newNameInput ? newNameInput.value.trim() : "";
            const bank = newBankInput ? newBankInput.value.trim() : "";
            const routing = newRoutingInput ? newRoutingInput.value.trim() : "";
            const accNum = newAccNumInput ? newAccNumInput.value.trim() : "";

            if (!name || !bank || !routing || !accNum) {
                Utils.showToast("Please complete all fields for the new recipient.", "warning");
                return;
            }

            recipient = {
                name: name,
                bankName: bank,
                routingNumber: routing,
                accountNumber: accNum,
                isNew: true
            };
        } else {
            // Read Saved Recipient Data
            const recipientId = recipientSelect.value;
            if (!recipientId) {
                Utils.showToast("Please select a saved recipient.", "warning");
                return;
            }

            isInternal = recipientId === "INTERNAL";
            recipient = isInternal
                ? { name: "My Savings Account", bankName: "BOA (Internal)", accountNumber: "INTERNAL" }
                : beneficiaries.find(b => b.id === recipientId);

            if (!recipient) {
                Utils.showToast("Selected recipient is invalid.", "warning");
                return;
            }
        }

        currentTransferState = {
            sourceAccount,
            recipient,
            recipientEmail,
            shouldNotify,
            isInternal,
            amount,
            memo,
            transferDate
        };

        // Populate Step 2 (Review Page)
        document.getElementById("review-from").textContent = `${sourceAccount.type} (${Utils.maskAccount(sourceAccount.accountNumber)})`;
        document.getElementById("review-to").textContent = `${recipient.name} — ${recipient.bankName}`;

        const reviewEmailEl = document.getElementById("review-email");
        if (reviewEmailEl) reviewEmailEl.textContent = recipientEmail;

        document.getElementById("review-amount").textContent = Utils.formatCurrency(amount);
        document.getElementById("review-fee").textContent = "$0.00 (Standard ACH — Free)";
        document.getElementById("review-total").textContent = Utils.formatCurrency(amount);
        document.getElementById("review-date").textContent = Utils.formatDate(transferDate);
        document.getElementById("review-memo").textContent = memo;

        setStep(2);
    });

    document.getElementById("btn-back-step1").addEventListener("click", () => setStep(1));

    // STEP 2 -> STEP 3 (CONFIRM & EXECUTE)
    document.getElementById("btn-confirm-transfer").addEventListener("click", async () => {
        const confirmBtn = document.getElementById("btn-confirm-transfer");
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

        const {
            sourceAccount,
            recipient,
            recipientEmail,
            shouldNotify,
            isInternal,
            amount,
            memo,
            transferDate
        } = currentTransferState;

        // Deduct balance from source account
        if (typeof StorageEngine !== "undefined") {
            StorageEngine.updateItem(DB_KEYS.ACCOUNTS, sourceAccount.id, {
                balance: sourceAccount.balance - amount,
                availableBalance: sourceAccount.availableBalance - amount
            });

            // If internal transfer, credit savings
            if (isInternal) {
                const savings = StorageEngine.get(DB_KEYS.ACCOUNTS).find(a => a.type === "Savings");
                if (savings) {
                    StorageEngine.updateItem(DB_KEYS.ACCOUNTS, savings.id, {
                        balance: savings.balance + amount,
                        availableBalance: savings.availableBalance + amount
                    });
                }
            }
        }

        const referenceId = Utils.generateId("REF");

        // Record Transaction
        const newTx = {
            id: Utils.generateId("TXN"),
            date: transferDate,
            time: new Date().toTimeString().split(" ")[0].substring(0, 5),
            description: `Transfer to ${recipient.name}${memo !== "No memo" ? ` (${memo})` : ""}`,
            category: "Transfer",
            type: "Debit",
            account: sourceAccount.type,
            recipientEmail: recipientEmail,
            amount,
            status: "Completed",
            reference: referenceId
        };

        if (typeof StorageEngine !== "undefined") {
            StorageEngine.addItem(DB_KEYS.TRANSACTIONS, newTx);

            // Add notification to feed
            StorageEngine.addItem(DB_KEYS.NOTIFICATIONS, {
                id: Utils.generateId("NOTIF"),
                title: "Transfer Completed",
                message: `${Utils.formatCurrency(amount)} transferred to ${recipient.name}.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: "transaction"
            });
        }

        // Send EmailJS Notification
        if (shouldNotify && recipientEmail && typeof Email !== "undefined") {
            const result = await Email.sendTransferNotification({
                to: recipientEmail,
                customerName: recipient.name,
                recipientName: recipient.name,
                amount: Utils.formatCurrency(amount),
                accountLast4: sourceAccount.accountNumber ? sourceAccount.accountNumber.slice(-4) : "****",
                ref: referenceId
            });

            if (result.success) {
                Utils.showToast("Recipient notified via email!", "success");
            }
        }

        // Update Confirmation Step UI
        document.getElementById("confirm-ref").textContent = referenceId;
        document.getElementById("confirm-date").textContent = Utils.formatDate(transferDate);
        document.getElementById("confirm-amount").textContent = Utils.formatCurrency(amount);

        const confirmEmailEl = document.getElementById("confirm-email");
        if (confirmEmailEl) confirmEmailEl.textContent = recipientEmail;

        setStep(3);
        Utils.showToast("Transfer completed successfully!", "success");

        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Confirm & Send Transfer`;
    });

    setStep(1);
});