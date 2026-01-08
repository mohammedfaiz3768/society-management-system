/**
 * Demo Mode Middleware
 * Prevents destructive actions when DEMO_MODE=true
 * Use this to protect your demo environment from unwanted changes
 */

const isDemoMode = () => {
    return process.env.DEMO_MODE === 'true' || process.env.APP_ENV === 'demo';
};

/**
 * Block destructive actions in demo mode
 * Attach this middleware to routes you want to protect
 */
exports.demoModeGuard = (req, res, next) => {
    if (isDemoMode()) {
        const destructiveMethods = ['DELETE', 'PUT', 'PATCH'];
        const isDestructive = destructiveMethods.includes(req.method);

        // Block specific destructive routes
        const destructiveRoutes = [
            '/api/registration/register', // Prevent new society creation
            '/api/users/delete',
            '/api/societies/delete',
            '/api/flats/delete',
        ];

        const isDestructiveRoute = destructiveRoutes.some(route =>
            req.path.includes(route)
        );

        if (isDestructive || isDestructiveRoute) {
            return res.status(403).json({
                error: 'Demo Mode: This action is disabled in the demo environment',
                message: 'To test this feature, please deploy your own instance',
                demoMode: true
            });
        }
    }

    next();
};

/**
 * Send demo notifications (logs instead of real SMS/Email)
 */
exports.sendDemoNotification = (type, to, data) => {
    if (isDemoMode()) {
        console.log('=====================================');
        console.log('📧 DEMO MODE - Notification Simulated');
        console.log('=====================================');
        console.log(`Type: ${type}`);
        console.log(`To: ${to}`);
        console.log(`Data:`, data);
        console.log('=====================================');
        return { success: true, demo: true };
    }
    return null; // Let real notification handlers proceed
};

/**
 * Check if SMS sending should be skipped
 */
exports.shouldSkipSMS = () => {
    return isDemoMode() || process.env.OTP_MODE === 'demo';
};

/**
 * Check if Email sending should be skipped
 */
exports.shouldSkipEmail = () => {
    return isDemoMode() || process.env.OTP_MODE === 'demo';
};

/**
 * Get demo mode status
 */
exports.getDemoModeStatus = () => {
    return {
        isDemoMode: isDemoMode(),
        otpMode: process.env.OTP_MODE,
        paymentMode: process.env.PAYMENT_MODE,
        appEnv: process.env.APP_ENV
    };
};

module.exports = {
    demoModeGuard: exports.demoModeGuard,
    sendDemoNotification: exports.sendDemoNotification,
    shouldSkipSMS: exports.shouldSkipSMS,
    shouldSkipEmail: exports.shouldSkipEmail,
    getDemoModeStatus: exports.getDemoModeStatus
};
