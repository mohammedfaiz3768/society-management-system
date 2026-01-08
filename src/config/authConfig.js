const dotenv = require("dotenv");
dotenv.config();

const authConfig = {
    mode: process.env.AUTH_MODE || 'open',
    allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS
        ? process.env.ALLOWED_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase())
        : [],

    isOpen: function () {
        return this.mode === 'open';
    },

    isAdminOnly: function () {
        return this.mode === 'admin_only';
    },

    isDomainRestricted: function () {
        return this.mode === 'domain_restricted';
    },

    isInvitationOnly: function () {
        return this.mode === 'invitation_only';
    },

    isEmailDomainAllowed: function (email) {
        if (!this.isDomainRestricted()) return true;
        if (this.allowedDomains.length === 0) return true;

        const domain = email.split('@')[1]?.toLowerCase();
        return this.allowedDomains.includes(domain);
    }
};

module.exports = authConfig;
