/**
 * Horizon National Bank - Dynamic Email Alert Engine
 */
"use strict";

const EMAIL_CONFIG = {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY", // Replace with your key
    serviceId: "YOUR_EMAILJS_SERVICE_ID", // Replace with your service ID
    templates: {
        welcome: "template_welcome",
        loginAlert: "template_login",
        transfer: "template_transfer",
        billPay: "template_bill"
    }
};

const EmailNotifier = (() => {
    // Initialize EmailJS Engine
    if (typeof emailjs !== "undefined" && EMAIL_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY") {
        emailjs.init(EMAIL_CONFIG.publicKey);
    }

    return {
        sendAlert: async (templateKey, templateParams) => {
            console.log(`[Demo Notification Engine] Dispatching '${templateKey}' with data:`, templateParams);

            // Fallback log if keys aren't replaced
            if (EMAIL_CONFIG.publicKey === "YOUR_EMAILJS_PUBLIC_KEY") {
                console.warn("EmailJS warning: API Credentials missing. Notification processed in demo mode.");
                return Promise.resolve({ status: 200, text: "Demo Success" });
            }

            try {
                const response = await emailjs.send(
                    EMAIL_CONFIG.serviceId,
                    EMAIL_CONFIG.templates[templateKey],
                    templateParams
                );
                return response;
            } catch (error) {
                console.error("EmailJS Dispatch Failure:", error);
                throw error;
            }
        }
    };
})();