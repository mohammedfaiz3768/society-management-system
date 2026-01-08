const db = require("../config/db");

exports.addTimeline = async (userId, title, description) => {
  await db.query(
    `INSERT INTO timeline (user_id, title, description)
     VALUES ($1, $2, $3)`,
    [userId, title, description]
  );
};
