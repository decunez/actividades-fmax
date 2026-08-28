module.exports = async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Respuesta inmediata para Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { usuario, password } = req.body || {};

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Ingrese usuario y contraseña' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'La variable DATABASE_URL no está configurada en Vercel' });
    }

    let rows = [];

    // Consulta SQL incluyendo los valores de tarifas por usuario
    const sqlQuery = `
      SELECT id, nombre, usuario, sector, valor_act, valor_pred, valor_ac, valor_exc, valor_visit 
      FROM actividades.usuarios 
      WHERE usuario = ? AND password = ?
    `;

    // Estrategia de conexión dual (TiDB / MySQL)
    try {
      const { connect } = require('@tidbcloud/serverless');
      const conn = connect({ url: process.env.DATABASE_URL });
      const result = await conn.execute(sqlQuery, [usuario, password]);
      rows = Array.isArray(result) ? result : (result.rows || []);
    } catch (e1) {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      const [resRows] = await connection.execute(sqlQuery, [usuario, password]);
      await connection.end();
      rows = resRows;
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = rows[0];

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        sector: user.sector,
        valor_act: user.valor_act,
        valor_pred: user.valor_pred,
        valor_ac: user.valor_ac,
        valor_exc: user.valor_exc,
        valor_visit: user.valor_visit
      }
    });

  } catch (error) {
    console.error('Error en Login API:', error);
    return res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
};