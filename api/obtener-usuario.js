module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de usuario requerido' });

    const sqlQuery = 'SELECT * FROM actividades.usuarios WHERE id = ?';
    let user = null;

    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      const result = await conn.execute(sqlQuery, [id]);
      user = result.rows ? result.rows[0] : result[0];
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      const [rows] = await connection.execute(sqlQuery, [id]);
      user = rows[0];
      await connection.end();
    }

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuario: ' + error.message });
  }
};