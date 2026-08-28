import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const [rows] = await connection.execute('SELECT nombre FROM usuarios WHERE id = 1');
    await connection.end();

    if (rows.length > 0) {
      return res.status(200).json({ nombre: rows[0].nombre });
    }
    return res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}