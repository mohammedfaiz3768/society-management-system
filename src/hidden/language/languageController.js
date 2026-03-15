const db = require("../../config/db");

exports.getLanguages = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT code, name, native_name, is_default FROM supported_languages ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("getLanguages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.changeLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language_code } = req.body;

    const check = await db.query(
      `SELECT code FROM supported_languages WHERE code = $1`,
      [language_code]
    );

    if (check.rowCount === 0) {
      return res.status(400).json({ error: "Invalid language code" });
    }

    await db.query(
      `UPDATE users SET language_code = $1 WHERE id = $2`,
      [language_code, userId]
    );

    res.json({ success: true, message: "Language updated successfully" });
  } catch (err) {
    console.error("changeLanguage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
