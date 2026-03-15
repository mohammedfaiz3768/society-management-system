const db = require("../config/db");

function initWebrtcSignaling(io) {
  const nsp = io.of("/webrtc");

  const publishers = new Map();

  nsp.on("connection", (socket) => {
    console.log("WebRTC client connected:", socket.id);

    socket.on("join", async ({ token, cameraId, role }) => {
      try {
        if (!token || !cameraId) {
          socket.emit("error", { message: "token and cameraId required" });
          socket.disconnect(true);
          return;
        }

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

    socket.on("viewer-offer", ({ cameraId, sdp }) => {
      const pubId = publishers.get(cameraId);
      if (!pubId) return;
      nsp.to(pubId).emit("viewer-offer", {
        viewerId: socket.id,
        cameraId,
        sdp,
      });
    });

    socket.on("publisher-answer", ({ viewerId, cameraId, sdp }) => {
      nsp.to(viewerId).emit("publisher-answer", {
        cameraId,
        sdp,
      });
    });

    socket.on("viewer-ice-candidate", ({ cameraId, candidate }) => {
      const pubId = publishers.get(cameraId);
      if (!pubId) return;
      nsp.to(pubId).emit("viewer-ice-candidate", {
        viewerId: socket.id,
        cameraId,
        candidate,
      });
    });

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
