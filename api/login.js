import { connect } from '@tidbcloud/serverless';

export default async function handler(req, res) {
  // Configuración global de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder inmediatamente solicitudes PREFLIGHT (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { usuario, password } = req.body || {};

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Por favor, ingrese usuario y contraseña' });
    }

    // Conexión a TiDB
    const conn = connect({ url: process.env.DATABASE_URL });
    const result = await conn.execute(
      'SELECT id, nombre, usuario, sector FROM actividades.usuarios WHERE usuario = ? AND password = ?',
      [usuario, password]
    );

    const users = Array.isArray(result) ? result : (result.rows || []);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = users[0];

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
    return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
  }
}