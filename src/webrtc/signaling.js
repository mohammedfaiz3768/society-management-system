const db = require("../config/db");

function initWebrtcSignaling(io) {
  const nsp = io.of("/webrtc");

  const publishers = new Map(); // cameraId -> publisherSocketId
  const viewers = new Map();    // cameraId -> Set of viewerSocketIds

  nsp.on("connection", (socket) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("WebRTC client connected:", socket.id);
    }

    socket.on("join", async ({ token, cameraId }) => {
      try {
        if (!token || !cameraId) {
          socket.emit("error", { message: "token and cameraId required" });
          socket.disconnect(true);
          return;
        }

        // ✅ Role comes from DB — client cannot fake it
        // ✅ Token must be unused to prevent replay attacks
        const { rows } = await db.query(
          `SELECT * FROM cctv_view_tokens
                     WHERE token = $1
                       AND camera_id = $2
                       AND expires_at > NOW()
                       AND used = FALSE`,
          [token, cameraId]
        );

        if (!rows.length) {
          socket.emit("error", { message: "Invalid or expired token" });
          socket.disconnect(true);
          return;
        }

        // ✅ Mark token as used immediately — single use only
        await db.query(
          `UPDATE cctv_view_tokens 
                     SET used = TRUE, used_at = NOW() 
                     WHERE token = $1`,
          [token]
        );

        // ✅ Trust role from DB, never from client payload
        socket.data.cameraId = cameraId;
        socket.data.role = rows[0].role || "viewer";
        socket.join(`cam_${cameraId}`);

        if (socket.data.role === "publisher") {
          publishers.set(cameraId, socket.id);

          if (process.env.NODE_ENV !== "production") {
            console.log(`Publisher registered for camera ${cameraId}:`, socket.id);
          }

          nsp.to(`cam_${cameraId}`).emit("publisher-ready", { cameraId });

        } else {
          // ✅ Track viewer in viewers Map
          if (!viewers.has(cameraId)) viewers.set(cameraId, new Set());
          viewers.get(cameraId).add(socket.id);

          if (process.env.NODE_ENV !== "production") {
            console.log(`Viewer joined camera ${cameraId}:`, socket.id);
          }

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

    // ✅ All signaling events use socket's own verified cameraId
    // ✅ Payload cameraId is ignored — client cannot target other cameras

    socket.on("viewer-offer", ({ sdp }) => {
      const cameraId = socket.data.cameraId;
      if (!cameraId || !sdp) return;

      const pubId = publishers.get(cameraId);
      if (!pubId) return;

      nsp.to(pubId).emit("viewer-offer", {
        viewerId: socket.id,
        cameraId,
        sdp,
      });
    });

    socket.on("publisher-answer", ({ viewerId, sdp }) => {
      const cameraId = socket.data.cameraId;
      if (!cameraId || !viewerId || !sdp) return;

      // ✅ Verify viewerId is actually in this camera's viewer set
      if (!viewers.get(cameraId)?.has(viewerId)) return;

      nsp.to(viewerId).emit("publisher-answer", { cameraId, sdp });
    });

    socket.on("viewer-ice-candidate", ({ candidate }) => {
      const cameraId = socket.data.cameraId;
      if (!cameraId || !candidate) return;

      const pubId = publishers.get(cameraId);
      if (!pubId) return;

      nsp.to(pubId).emit("viewer-ice-candidate", {
        viewerId: socket.id,
        cameraId,
        candidate,
      });
    });

    socket.on("publisher-ice-candidate", ({ viewerId, candidate }) => {
      const cameraId = socket.data.cameraId;
      if (!cameraId || !viewerId || !candidate) return;

      // ✅ Verify viewerId is actually in this camera's viewer set
      if (!viewers.get(cameraId)?.has(viewerId)) return;

      nsp.to(viewerId).emit("publisher-ice-candidate", { cameraId, candidate });
    });

    socket.on("disconnect", () => {
      const cameraId = socket.data?.cameraId;
      const role = socket.data?.role;

      if (cameraId) {
        if (role === "publisher") {
          // ✅ Only delete if this socket is still the current publisher
          // Prevents a reconnecting publisher from being wiped by old socket
          if (publishers.get(cameraId) === socket.id) {
            publishers.delete(cameraId);
            nsp.to(`cam_${cameraId}`).emit("publisher-disconnected", { cameraId });
          }
        } else {
          // ✅ Clean up viewer from tracking Set
          viewers.get(cameraId)?.delete(socket.id);

          // ✅ Delete empty Sets to prevent memory leak
          if (viewers.get(cameraId)?.size === 0) {
            viewers.delete(cameraId);
          }
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("WebRTC client disconnected:", socket.id);
      }
    });
  });
}

module.exports = { initWebrtcSignaling };