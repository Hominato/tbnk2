/**
 * Horizon National Bank - Email Notification Engine
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

    // One EmailJS template for both login and transfer
    templateId: "Sage1909"
};


const EmailNotifier = (() => {

    /*
     * Check whether EmailJS is available
     * and credentials have been configured.
     */
    const isConfigured =
        typeof emailjs !== "undefined" &&
        EMAIL_CONFIG.publicKey &&
        EMAIL_CONFIG.publicKey !== "9zVEGau5i1yKnXZND" &&
        EMAIL_CONFIG.serviceId &&
        EMAIL_CONFIG.serviceId !== "service_trlvuws" &&
        EMAIL_CONFIG.templateId &&
        EMAIL_CONFIG.templateId !== "Sage1909";


    /*
     * Initialize EmailJS
     */
    if (isConfigured) {

        try {

            emailjs.init({
                publicKey: EMAIL_CONFIG.publicKey
            });

            console.log(
                "[EmailNotifier] EmailJS initialized successfully."
            );

        } catch (error) {

            console.error(
                "[EmailNotifier] EmailJS initialization failed:",
                error
            );

        }

    } else {

        console.warn(
            "[EmailNotifier] EmailJS is not fully configured. " +
            "Running in demo mode."
        );

    }


    /*
     * Main email sender
     */
    const sendEmail = async (params = {}) => {

        /*
         * Make sure notification type exists
         */
        if (!params.notification_type) {

            console.warn(
                "[EmailNotifier] Missing notification_type."
            );

            return {
                success: false,
                status: 400,
                text: "Notification type is required."
            };

        }


        /*
         * Only allow Login and Transfer notifications
         */
        const allowedTypes = [
            "Login",
            "Transfer"
        ];

        if (!allowedTypes.includes(params.notification_type)) {

            console.warn(
                `[EmailNotifier] Unsupported notification type: ${params.notification_type}`
            );

            return {
                success: false,
                status: 400,
                text: "Unsupported notification type."
            };

        }


        /*
         * Validate template ID
         */
        if (
            !EMAIL_CONFIG.templateId ||
            EMAIL_CONFIG.templateId === "Sage1909"
        ) {

            console.error(
                "[EmailNotifier] EmailJS template ID has not been configured."
            );

            return {
                success: false,
                status: 400,
                text: "EmailJS template ID is missing."
            };

        }


        /*
         * DEMO MODE
         */
        if (!isConfigured) {

            console.log(
                `[EmailNotifier DEMO] ${params.notification_type} email would be sent.`,
                params
            );

            return {
                success: true,
                demo: true,
                status: 200,
                text: "Demo email notification."
            };

        }


        /*
         * SEND EMAIL
         */
        try {

            const response = await emailjs.send(
                EMAIL_CONFIG.serviceId,
                EMAIL_CONFIG.templateId,
                params
            );


            console.log(
                `[EmailNotifier] ${params.notification_type} email sent successfully.`,
                response
            );


            return {
                success: true,
                demo: false,
                status: response.status || 200,
                text: response.text || "Email sent successfully."
            };


        } catch (error) {

            console.error(
                `[EmailNotifier] Failed to send ${params.notification_type} email:`,
                error
            );


            return {
                success: false,
                demo: false,
                status: error?.status || 500,
                text: error?.text || "Failed to send email.",
                error: error
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

        return sendEmail({

            notification_type: "Login",

            to_email: to_email || "",

            customer_name: customer_name || "Customer",

            login_date:
                login_date ||
                new Date().toLocaleDateString(),

            login_time:
                login_time ||
                new Date().toLocaleTimeString(),

            device:
                device ||
                "Web Browser",

            location:
                location ||
                "Unknown",

            // Empty transfer fields
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

        return sendEmail({

            notification_type: "Transfer",

            to_email: to_email || "",

            customer_name: customer_name || "Customer",

            amount: amount || "",

            recipient_name:
                recipient_name || "",

            account_last4:
                account_last4 || "",

            transaction_id:
                transaction_id || "",

            transaction_date:
                transaction_date ||
                new Date().toLocaleDateString(),

            transaction_time:
                transaction_time ||
                new Date().toLocaleTimeString(),

            status:
                status || "Completed",

            // Empty login fields
            login_date: "",
            login_time: "",
            device: "",
            location: ""

        });

    };


    /*
     * Public API
     */
    return {

        sendLoginAlert,

        sendTransferAlert

    };

})();