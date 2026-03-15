module.exports = {
    EMERGENCY_SERVICES: {
        POLICE: {
            number: "100",
            name: "Police",
            icon: "👮",
        },
        FIRE: {
            number: "101",
            name: "Fire Department",
            icon: "🔥",
        },
        AMBULANCE: {
            number: "102",
            name: "Ambulance",
            icon: "🚑",
        },
    },

    SOS_TYPES: {
        FIRE: "fire",
        MEDICAL: "medical",
        POLICE: "police",
        GENERAL: "general",
    },

    getServiceForType(type) {
        switch (type) {
            case this.SOS_TYPES.FIRE:
                return this.EMERGENCY_SERVICES.FIRE;
            case this.SOS_TYPES.MEDICAL:
                return this.EMERGENCY_SERVICES.AMBULANCE;
            case this.SOS_TYPES.POLICE:
                return this.EMERGENCY_SERVICES.POLICE;
            default:
                return null;
        }
    },
};
