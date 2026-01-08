const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const app = require("./app");
const { initWebrtcSignaling } = require("./webrtc/signaling");

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const onlineUsers = {};

io.on("connection", (socket) => {
    socket.on("register", (userId) => {
        onlineUsers[userId] = socket.id;
    });

    socket.on("disconnect", () => {
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
            }
        }
    });
});

app.set("socketio", io);
app.set("onlineUsers", onlineUsers);

initWebrtcSignaling(io);

require("./cron/invoiceCron");
require("./cron/gatePassCron");

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
