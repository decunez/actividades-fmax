module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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

    if (!id) {
      return res.status(400).json({ error: 'El ID es obligatorio para actualizar' });
    }
    if (!nombre || !usuario) {
      return res.status(400).json({ error: 'El nombre y el usuario son obligatorios' });
    }

    const numericId = parseInt(id, 10);
    const usernameClean = usuario.toLowerCase().trim();

    // 1. Verificar si el nombre de usuario ya está ocupado por OTRO registro
    const checkSql = 'SELECT id FROM actividades.usuarios WHERE usuario = ? AND id != ?';
    let duplicateCheck = [];

    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      const resCheck = await conn.execute(checkSql, [usernameClean, numericId]);
      duplicateCheck = resCheck.rows || resCheck;
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      const [rows] = await connection.execute(checkSql, [usernameClean, numericId]);
      duplicateCheck = rows;
      await connection.end();
    }

    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(400).json({
        error: `El nombre de usuario "${usernameClean}" ya está en uso por otro usuario. Por favor escribe uno diferente.`
      });
    }

    // 2. Ejecutar la actualización con el ID numérico
    const updateSql = `
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
      usernameClean,
      telefono ? telefono.trim() : null,
      direccion ? direccion.trim() : null,
      sector ? sector.trim() : null,
      valor_act !== undefined && valor_act !== '' ? parseFloat(valor_act) : 7.00,
      valor_pred !== undefined && valor_pred !== '' ? parseFloat(valor_pred) : 1.00,
      valor_ac !== undefined && valor_ac !== '' ? parseFloat(valor_ac) : 1.00,
      valor_exc !== undefined && valor_exc !== '' ? parseFloat(valor_exc) : 0.04,
      valor_visit !== undefined && valor_visit !== '' ? parseFloat(valor_visit) : 6.00,
      numericId
    ];

    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      await conn.execute(updateSql, params);
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      await connection.execute(updateSql, params);
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