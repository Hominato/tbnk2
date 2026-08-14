/**
 * Horizon National Bank - Storage Engine & Database Initializer
 */
"use strict";

const DB_KEYS = {
    USERS: "hnb_users",
    SESSION: "hnb_active_session",
    ACCOUNTS: "hnb_accounts",
    TRANSACTIONS: "hnb_transactions",
    BENEFICIARIES: "hnb_beneficiaries",
    CARDS: "hnb_cards",
    BILLS: "hnb_bills",
    NOTIFICATIONS: "hnb_notifications",
    SETTINGS: "hnb_settings"
};

const StorageEngine = (() => {
    // Demo Customer Seed
    const SEED_DATA = {
        user: {
            id: "USR-882910",
            firstName: "Gordon broney Steven ",
            lastName: "& Gordon Kimberly yien",
            email: "Gordonbroneysteven@gmail.com",
            phone: "+1 (555) 019-2834",
            dob: "1988-05-14",
            address: "742 Evergreen Terrace, Springfield, OR 97477",
            passwordHash: "Godisgood2014", // Demo purpose plain text/simple hash
            registeredAt: "2014-01-15T08:30:00Z",
            twoFactorEnabled: true,
            securityScore: 92
        },
        accounts: [
            {
                id: "ACC-5625",
                type: "Checking",
                accountNumber: "109283745625",
                routingNumber: "021000021",
                balance: 1395000000.45,
                availableBalance: 1395000000.45,
                status: "Active",
                createdAt: "2014-01-15"
            },
            {
                id: "ACC-8842",
                type: "Savings",
                accountNumber: "209283748842",
                routingNumber: "021000021",
                balance: 59670.20,
                availableBalance: 59670.20,
                interestRate: "2.15% APY",
                status: "Active",
                createdAt: "2024-01-15"
            },
            {
                id: "ACC-3921",
                type: "Credit Card",
                accountNumber: "4532890123453921",
                routingNumber: "021000021",
                balance: -2550.00, // Amount spent
                creditLimit: 5000.00,
                availableBalance: 2450.00,
                status: "Active",
                createdAt: "2024-02-01"
            }
        ],
        cards: [
            {
                id: "CARD-1",
                accountId: "ACC-5625",
                cardNumber: "4532890123453921",
                holderName: "Gordon broney Steven",
                expiry: "08/28",
                cvv: "882",
                type: "Visa Debit",
                isFrozen: false,
                pin: "4321"
            },
            {
                id: "CARD-2",
                accountId: "ACC-3921",
                cardNumber: "5412751234563921",
                holderName: "Gordon Kimberly Yien",
                expiry: "11/27",
                cvv: "319",
                type: "Mastercard Credit",
                isFrozen: false,
                pin: "9876"
            }
        ],
        beneficiaries: [
            {
                id: "BEN-1",
                name: "Sarah Jenkins",
                bankName: "Chase Bank",
                accountNumber: "••••••••4412",
                routingNumber: "021000021",
                type: "Checking",
                nickname: "Sister"
            },
            {
                id: "BEN-2",
                name: "Apex Utilities Co.",
                bankName: "Wells Fargo",
                accountNumber: "••••••••8890",
                routingNumber: "121000358",
                type: "Corporate",
                nickname: "Electric Bill"
            }
        ],
        bills: [
            {
                id: "BILL-1",
                billerName: "Pacific Power & Light",
                category: "Utilities",
                amount: 142.50,
                dueDate: "2026-08-25",
                autoPay: true,
                status: "Scheduled"
            },
            {
                id: "BILL-2",
                billerName: "Xfinity Broadband",
                category: "Internet",
                amount: 89.99,
                dueDate: "2026-08-28",
                autoPay: false,
                status: "Scheduled"
            }
        ],
        notifications: [
            {
                id: "NOTIF-1",
                title: "Security Alert",
                message: "New successful login detected from Chrome (macOS).",
                timestamp: new Date().toISOString(),
                read: false,
                type: "security"
            },
            {
                id: "NOTIF-2",
                title: "Dividend Received",
                message: "Your Savings account received an interest payout of $106.88.",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                read: true,
                type: "transaction"
            }
        ]
    };

    // Generate 30 sample transactions dynamically
    const generateInitialTransactions = () => {
        const categories = [
            { desc: "Amazon.com Purchase", type: "Debit", cat: "Shopping", acc: "Checking", min: 12, max: 250 },
            { desc: "Payroll Direct Deposit", type: "Credit", cat: "Income", acc: "Checking", min: 3500, max: 4850 },
            { desc: "Starbucks Coffee", type: "Debit", cat: "Food", acc: "Checking", min: 4, max: 15 },
            { desc: "Whole Foods Market", type: "Debit", cat: "Food", acc: "Checking", min: 45, max: 210 },
            { desc: "Monthly Transfer to Savings", type: "Debit", cat: "Transfer", acc: "Checking", min: 500, max: 1000 },
            { desc: "Shell Gas Station", type: "Debit", cat: "Transportation", acc: "Credit Card", min: 30, max: 65 },
            { desc: "Netflix Subscription", type: "Debit", cat: "Entertainment", acc: "Credit Card", min: 19.99, max: 19.99 }
        ];

        const txs = [];
        const now = new Date();

        for (let i = 0; i < 30; i++) {
            const template = categories[Math.floor(Math.random() * categories.length)];
            const date = new Date(now.getTime() - i * 86400000 * (1 + Math.random()));
            const amt = (Math.random() * (template.max - template.min) + template.min).toFixed(2);

            txs.push({
                id: `TXN-${100000 + i}`,
                date: date.toISOString().split("T")[0],
                time: date.toTimeString().split(" ")[0].substring(0, 5),
                description: template.desc,
                category: template.cat,
                type: template.type,
                account: template.acc,
                amount: parseFloat(amt),
                status: "Completed",
                reference: `REF-${Math.floor(10000000 + Math.random() * 90000000)}`
            });
        }
        return txs;
    };

    // Initialize LocalStorage Data
    const init = () => {
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify([SEED_DATA.user]));
            localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(SEED_DATA.accounts));
            localStorage.setItem(DB_KEYS.CARDS, JSON.stringify(SEED_DATA.cards));
            localStorage.setItem(DB_KEYS.BENEFICIARIES, JSON.stringify(SEED_DATA.beneficiaries));
            localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(SEED_DATA.bills));
            localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(SEED_DATA.notifications));
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(generateInitialTransactions()));
        }
    };

    init();

    return {
        get: (key) => JSON.parse(localStorage.getItem(key)) || [],
        set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),

        // Entity helper queries
        getItemById: (key, id) => {
            const list = JSON.parse(localStorage.getItem(key)) || [];
            return list.find(item => item.id === id);
        },

        addItem: (key, newItem) => {
            const list = JSON.parse(localStorage.getItem(key)) || [];
            list.unshift(newItem);
            localStorage.setItem(key, JSON.stringify(list));
            return newItem;
        },

        updateItem: (key, id, updatedProps) => {
            let list = JSON.parse(localStorage.getItem(key)) || [];
            list = list.map(item => item.id === id ? { ...item, ...updatedProps } : item);
            localStorage.setItem(key, JSON.stringify(list));
        },

        deleteItem: (key, id) => {
            let list = JSON.parse(localStorage.getItem(key)) || [];
            list = list.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(list));
        }
    };
})();