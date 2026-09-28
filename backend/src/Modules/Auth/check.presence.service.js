const User = require("../../models/User")


const HEARTBEAT_TIMEOUT_MS = 60 * 1000;

setInterval(async () => {
    try {
        const timeout = new Date(
            Date.now() - HEARTBEAT_TIMEOUT_MS
        );

        await User.updateMany(
            {
                role: "worker",
                isOnline: true,
                lastHeartbeat: {
                    $lt: timeout
                }
            },
            {
                $set: {
                    isOnline: false
                }
            }
        );
    } catch (error) {
        console.error(
            "Worker presence cleanup failed",
            error
        );
    }
}, 30_000);