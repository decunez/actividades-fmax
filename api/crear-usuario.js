module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const {
      nombre, usuario, password, telefono, direccion, sector,
      valor_act, valor_pred, valor_ac, valor_exc, valor_visit
    } = req.body || {};

    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Nombre, usuario y contraseña son requeridos' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL no está configurada' });
    }

    const sqlQuery = `
      INSERT INTO actividades.usuarios 
      (nombre, usuario, password, telefono, direccion, sector, valor_act, valor_pred, valor_ac, valor_exc, valor_visit, fecha_creacion) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      nombre.toUpperCase(),
      usuario.toLowerCase().trim(),
      password,
      telefono || null,
      direccion || null,
      sector || null,
      valor_act !== '' ? parseFloat(valor_act) : 7.00,
      valor_pred !== '' ? parseFloat(valor_pred) : 1.00,
      valor_ac !== '' ? parseFloat(valor_ac) : 1.00,
      valor_exc !== '' ? parseFloat(valor_exc) : 0.04,
      valor_visit !== '' ? parseFloat(valor_visit) : 6.00
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

    return res.status(200).json({ success: true, message: 'Usuario creado exitosamente' });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
};