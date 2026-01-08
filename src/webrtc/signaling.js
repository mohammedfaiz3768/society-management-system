// src/webrtc/signaling.js
const db = require("../config/db");

function initWebrtcSignaling(io) {
  const nsp = io.of("/webrtc");

  // cameraId -> publisher socket.id
  const publishers = new Map();

  nsp.on("connection", (socket) => {
    console.log("WebRTC client connected:", socket.id);

    // Common join for both publisher + viewer
    socket.on("join", async ({ token, cameraId, role }) => {
      try {
        if (!token || !cameraId) {
          socket.emit("error", { message: "token and cameraId required" });
          socket.disconnect(true);
          return;
        }

        // 🔐 validate token
        const { rows } = await db.query(
          `SELECT * FROM cctv_view_tokens
           WHERE token = $1 AND camera_id = $2 AND expires_at > NOW()`,
          [token, cameraId]
        );

        if (!rows.length) {
          socket.emit("error", { message: "Invalid or expired token" });
          socket.disconnect(true);
          return;
        }

        socket.data.cameraId = cameraId;
        socket.data.role = role || "viewer";
        socket.join(`cam_${cameraId}`);

        if (socket.data.role === "publisher") {
          publishers.set(cameraId, socket.id);
          console.log(`Publisher registered for camera ${cameraId}:`, socket.id);
          nsp.to(`cam_${cameraId}`).emit("publisher-ready", {
            cameraId,
          });
        } else {
          console.log(`Viewer joined camera ${cameraId}:`, socket.id);
          const pubId = publishers.get(cameraId);
          if (pubId) {
            // tell publisher a new viewer wants stream
            nsp.to(pubId).emit("viewer-joined", {
              viewerId: socket.id,
              cameraId,
            });
          }
        }
      } catch (err) {
        console.error("join error:", err);
        socket.emit("error", { message: "Server error" });
      }
    });

    // Viewer → Publisher: offer
    socket.on("viewer-offer", ({ cameraId, sdp }) => {
      const pubId = publishers.get(cameraId);
      if (!pubId) return;
      nsp.to(pubId).emit("viewer-offer", {
        viewerId: socket.id,
        cameraId,
        sdp,
      });
    });

    // Publisher → Viewer: answer
    socket.on("publisher-answer", ({ viewerId, cameraId, sdp }) => {
      nsp.to(viewerId).emit("publisher-answer", {
        cameraId,
        sdp,
      });
    });

    // ICE candidates from viewer
    socket.on("viewer-ice-candidate", ({ cameraId, candidate }) => {
      const pubId = publishers.get(cameraId);
      if (!pubId) return;
      nsp.to(pubId).emit("viewer-ice-candidate", {
        viewerId: socket.id,
        cameraId,
        candidate,
      });
    });

    // ICE candidates from publisher
    socket.on("publisher-ice-candidate", ({ viewerId, cameraId, candidate }) => {
      nsp.to(viewerId).emit("publisher-ice-candidate", {
        cameraId,
        candidate,
      });
    });

    socket.on("disconnect", () => {
      const cameraId = socket.data?.cameraId;
      const role = socket.data?.role;

      if (cameraId && role === "publisher") {
        // Drop publisher for that camera
        if (publishers.get(cameraId) === socket.id) {
          publishers.delete(cameraId);
          nsp.to(`cam_${cameraId}`).emit("publisher-disconnected", {
            cameraId,
          });
        }
      }

      console.log("WebRTC client disconnected:", socket.id);
    });
  });
}

module.exports = { initWebrtcSignaling };
