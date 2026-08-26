import { mysql } from '@tidbcloud/serverless'; // O la librería de conexión que uses en tus otras APIs (mysql2, etc.)

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Por favor, ingrese usuario y contraseña' });
  }

  try {
    // Usa la misma lógica de conexión de tus otros archivos de /api
    const connection = mysql.createConnection(process.env.DATABASE_URL);

    const [rows] = await connection.query(
      'SELECT id, nombre, usuario, sector FROM actividades.usuarios WHERE usuario = ? AND password = ?',
      [usuario, password]
    );

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
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}