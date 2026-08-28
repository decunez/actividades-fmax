module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID de usuario requerido' });

    const sqlQuery = 'DELETE FROM actividades.usuarios WHERE id = ?';

    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      await conn.execute(sqlQuery, [id]);
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      await connection.execute(sqlQuery, [id]);
      await connection.end();
    }

    return res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar: ' + error.message });
  }
};