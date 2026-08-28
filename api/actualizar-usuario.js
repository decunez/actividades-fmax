module.exports = async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Respuesta rápida para preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar método HTTP
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      id,
      nombre,
      usuario,
      telefono,
      direccion,
      sector,
      valor_act,
      valor_pred,
      valor_ac,
      valor_exc,
      valor_visit
    } = req.body || {};

    // Validar campos obligatorios
    if (!id) {
      return res.status(400).json({ error: 'El ID es obligatorio para actualizar' });
    }
    if (!nombre || !usuario) {
      return res.status(400).json({ error: 'El nombre y el usuario son obligatorios' });
    }

    // Consulta SQL para actualización de datos
    const sqlQuery = `
      UPDATE actividades.usuarios 
      SET 
        nombre = ?, 
        usuario = ?, 
        telefono = ?, 
        direccion = ?, 
        sector = ?, 
        valor_act = ?, 
        valor_pred = ?, 
        valor_ac = ?, 
        valor_exc = ?, 
        valor_visit = ?
      WHERE id = ?
    `;

    const params = [
      nombre.toUpperCase().trim(),
      usuario.toLowerCase().trim(),
      telefono ? telefono.trim() : null,
      direccion ? direccion.trim() : null,
      sector ? sector.trim() : null,
      valor_act !== undefined && valor_act !== '' ? parseFloat(valor_act) : 7.00,
      valor_pred !== undefined && valor_pred !== '' ? parseFloat(valor_pred) : 1.00,
      valor_ac !== undefined && valor_ac !== '' ? parseFloat(valor_ac) : 1.00,
      valor_exc !== undefined && valor_exc !== '' ? parseFloat(valor_exc) : 0.04,
      valor_visit !== undefined && valor_visit !== '' ? parseFloat(valor_visit) : 6.00,
      id
    ];

    // Intentar ejecutar mediante TiDB Cloud Serverless y fallback a mysql2
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

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({
      error: 'Error en el servidor al actualizar: ' + error.message
    });
  }
};