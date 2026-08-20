import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const [rows] = await connection.execute(
      'SELECT id, nombre, telefono, direccion, sector FROM usuarios ORDER BY id ASC'
    );
    await connection.end();

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}