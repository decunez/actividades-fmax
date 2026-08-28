module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      id, nombre, usuario, telefono, direccion, sector,
      valor_act, valor_pred, valor_ac, valor_exc, valor_visit
    } = req.body || {};

    if (!id || !nombre || !usuario) {
      return res.status(400).json({ error: 'ID, nombre y usuario son obligatorios' });
    }

    const sqlQuery = `
      UPDATE actividades.usuarios 
      SET nombre = ?, usuario = ?, telefono = ?, direccion = ?, sector = ?, 
          valor_act = ?, valor_pred = ?, valor_ac = ?, valor_exc = ?, valor_visit = ?
      WHERE id = ?
    `;

    const params = [
      nombre.toUpperCase(),
      usuario.toLowerCase().trim(),
      telefono || null,
      direccion || null,
      sector || null,
      parseFloat(valor_act) || 7.00,
      parseFloat(valor_pred) || 1.00,
      parseFloat(valor_ac) || 1.00,
      parseFloat(valor_exc) || 0.04,
      parseFloat(valor_visit) || 6.00,
      id
    ];

    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      await conn.execute(sqlQuery, params);
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      await connection.execute(sqlQuery, params);
      await connection.end();
    }

    return res.status(200).json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar: ' + error.message });
  }
};