import { connect } from '@tidbcloud/serverless';

export default async function handler(req, res) {
  // Manejo directo de preflight OPTIONS
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

    const conn = connect({ url: process.env.DATABASE_URL });
    const result = await conn.execute(
      'SELECT id, nombre, usuario, sector FROM actividades.usuarios WHERE usuario = ? AND password = ?',
      [usuario, password]
    );

    const rows = Array.isArray(result) ? result : (result.rows || []);

    if (rows.length === 0) {
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
        sector: user.sector
      }
    });

  } catch (error) {
    console.error('Error en API Login:', error);
    return res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
}