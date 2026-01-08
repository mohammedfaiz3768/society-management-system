const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { addCamera, listCameras, assignCamera, getMyCameras, getSnapshot } =
  require("./cctvController");

router.post("/add", auth, addCamera);
router.get("/list", auth, listCameras);
router.post("/assign", auth, assignCamera);
router.get("/my-cameras", auth, getMyCameras);
router.get("/snapshot/:id", auth, getSnapshot);

module.exports = router;
