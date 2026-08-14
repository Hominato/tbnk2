/**
 * Horizon National Bank - Email Notification Engine & Adapter
 * EmailJS Integration
 *
 * Uses ONE EmailJS template for:
 * 1. Login notifications
 * 2. Transfer notifications
 *
 * DEMO DISCLAIMER:
 * Never include passwords, OTPs, PINs, CVVs, or full banking
 * credentials in client-side JavaScript.
 */

"use strict";

const EMAIL_CONFIG = {
    publicKey: "9zVEGau5i1yKnXZND",
    serviceId: "service_trlvuws",
    templateId: "Sage1909"
};

const EmailNotifier = (() => {

    /*
     * Check whether EmailJS is loaded and credentials are configured.
     */
    const isConfigured =
        typeof emailjs !== "undefined" &&
        EMAIL_CONFIG.publicKey &&
        EMAIL_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY" &&
        EMAIL_CONFIG.serviceId &&
        EMAIL_CONFIG.serviceId !== "YOUR_EMAILJS_SERVICE_ID" &&
        EMAIL_CONFIG.templateId &&
        EMAIL_CONFIG.templateId !== "YOUR_EMAILJS_TEMPLATE_ID";

    /*
     * Initialize EmailJS
     */
    if (isConfigured) {
        try {
            emailjs.init({
                publicKey: EMAIL_CONFIG.publicKey
            });
            console.log("[EmailNotifier] EmailJS initialized successfully.");
        } catch (error) {
            console.error("[EmailNotifier] EmailJS initialization failed:", error);
        }
    } else {
        console.warn("[EmailNotifier] EmailJS is not fully configured.");
        if (typeof emailjs === "undefined") {
            console.warn("[EmailNotifier] EmailJS library is not loaded.");
        }
    }

    /*
     * MAIN SEND FUNCTION
     */
    const sendAlert = async (templateKey, templateParams = {}) => {

        const allowedTypes = [
            "login",
            "transfer",
            "Login",
            "Transfer"
        ];

        if (!allowedTypes.includes(templateKey)) {
            console.warn(`[EmailNotifier] Unsupported notification type: ${templateKey}`);
            return {
                success: false,
                status: 400,
                text: "Unsupported notification type."
            };
        }

        const notificationType =
            templateKey.toLowerCase() === "login"
                ? "Login"
                : "Transfer";

        const params = {
            ...templateParams,
            notification_type: notificationType
        };

        if (
            !EMAIL_CONFIG.templateId ||
            EMAIL_CONFIG.templateId === "YOUR_EMAILJS_TEMPLATE_ID"
        ) {
            console.error("[EmailNotifier] EmailJS template ID is missing.");
            return {
                success: false,
                status: 400,
                text: "EmailJS template ID is missing."
            };
        }

        if (!isConfigured) {
            console.log(`[EmailNotifier DEMO] ${notificationType} email would be sent.`, params);
            return {
                success: true,
                demo: true,
                status: 200,
                text: "Demo email notification."
            };
        }

        try {
            const response = await emailjs.send(
                EMAIL_CONFIG.serviceId,
                EMAIL_CONFIG.templateId,
                params
            );

            console.log(`[EmailNotifier] ${notificationType} email sent successfully.`, response);

            return {
                success: true,
                demo: false,
                status: response.status || 200,
                text: response.text || "Email sent successfully."
            };
        } catch (error) {
            console.error(`[EmailNotifier] Failed to send ${notificationType} email:`, error);
            return {
                success: false,
                demo: false,
                status: error?.status || 500,
                text: error?.text || "Failed to send email.",
                error
            };
        }
    };

    /*
     * LOGIN NOTIFICATION
     */
    const sendLoginAlert = async ({
        to_email,
        customer_name,
        login_date,
        login_time,
        device,
        location
    } = {}) => {
        return sendAlert("login", {
            to_email: to_email || "",
            customer_name: customer_name || "Customer",
            login_date: login_date || new Date().toLocaleDateString(),
            login_time: login_time || new Date().toLocaleTimeString(),
            device: device || "Web Browser",
            location: location || "Unknown",
            amount: "",
            recipient_name: "",
            account_last4: "",
            transaction_id: "",
            transaction_date: "",
            transaction_time: "",
            status: ""
        });
    };

    /*
     * TRANSFER NOTIFICATION
     */
    const sendTransferAlert = async ({
        to_email,
        customer_name,
        amount,
        recipient_name,
        account_last4,
        transaction_id,
        transaction_date,
        transaction_time,
        status
    } = {}) => {
        return sendAlert("transfer", {
            to_email: to_email || "",
            customer_name: customer_name || "Customer",
            amount: amount || "",
            recipient_name: recipient_name || "",
            account_last4: account_last4 || "",
            transaction_id: transaction_id || "",
            transaction_date: transaction_date || new Date().toLocaleDateString(),
            transaction_time: transaction_time || new Date().toLocaleTimeString(),
            status: status || "Completed",
            login_date: "",
            login_time: "",
            device: "",
            location: ""
        });
    };

    return {
        sendAlert,
        sendLoginAlert,
        sendTransferAlert
    };

})();

/**
 * Global Email Bridge Adapter
 * Used by transfers.js to bridge calls cleanly
 */
const Email = {
    sendTransferNotification: async (data) => {
        if (typeof EmailNotifier === "undefined") {
            console.error("[Email Adapter] EmailNotifier is not loaded.");
            return { success: false, error: "EmailNotifier module missing" };
        }

        const now = new Date();

        return await EmailNotifier.sendTransferAlert({
            to_email: data.to,
            customer_name: data.customerName || "Customer",
            amount: data.amount,
            recipient_name: data.recipientName || "Recipient",
            account_last4: data.accountLast4 || "****",
            transaction_id: data.ref,
            transaction_date: now.toLocaleDateString(),
            transaction_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "Completed"
        });
    },

    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

window.Email = Email;
window.EmailNotifier = EmailNotifier;