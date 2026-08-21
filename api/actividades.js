import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    // Endpoint para obtener la lista de sectores sin repetir
    if (req.query.obtener_sectores === 'true') {
      const [sectores] = await connection.execute(
        `SELECT DISTINCT sector FROM act_detalles WHERE sector IS NOT NULL AND sector != '' ORDER BY sector ASC`
      );
      await connection.end();
      return res.status(200).json(sectores.map(s => s.sector));
    }

    const { fecha, fecha_inicio, fecha_fin, tipo_actividad, sector } = req.query;

    let query = `
      SELECT a.*, u.nombre AS nombre_usuario 
      FROM act_detalles a
      LEFT JOIN usuarios u ON a.id_usuario = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filtro por fecha individual
    if (fecha) {
      query += ` AND DATE(a.fecha) = ?`;
      params.push(fecha);
    } else {
      // Filtro por rango (Período)
      if (fecha_inicio) {
        query += ` AND DATE(a.fecha) >= ?`;
        params.push(fecha_inicio);
      }
      if (fecha_fin) {
        query += ` AND DATE(a.fecha) <= ?`;
        params.push(fecha_fin);
      }
    }

    // Filtro por Tipo
    if (tipo_actividad && tipo_actividad !== 'TODOS') {
      query += ` AND a.tipo_actividad = ?`;
      params.push(tipo_actividad);
    }

    // Filtro por Sector
    if (sector && sector !== 'TODOS') {
      query += ` AND a.sector = ?`;
      params.push(sector);
    }

    query += ` ORDER BY a.fecha DESC, a.id DESC`;

    const [rows] = await connection.execute(query, params);
    await connection.end();

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}