const http = require("http");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const app = require("./app");
const { initWebrtcSignaling } = require("./webrtc/signaling");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.use((socket, next) => {
    const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
        return next(new Error("Authentication required"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
        next();
    } catch {
        return next(new Error("Invalid or expired token"));
    }
});

const onlineUsers = {};

io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    if (userId) {
        onlineUsers[userId] = socket.id;
    }

    socket.on("disconnect", () => {
        if (userId && onlineUsers[userId] === socket.id) {
            delete onlineUsers[userId];
        }
    });
});

app.set("socketio", io);
app.set("onlineUsers", onlineUsers);

initWebrtcSignaling(io);

require("./cron/invoiceCron");
require("./cron/gatePassCron");
console.log("Cron jobs initialized: invoiceCron, gatePassCron");

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const shutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
