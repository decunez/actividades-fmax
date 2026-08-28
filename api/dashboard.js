import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const { 
      fecha_inicio, 
      fecha_fin, 
      fecha, 
      usuario_id, 
      tipo_actividad, 
      tipo_cuadrilla, 
      cuadrilla_especifica, 
      sector 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 1. Filtro por Usuario (Se usa únicamente la columna 'usuario_id')
    if (usuario_id) {
      whereClause += ' AND usuario_id = ?';
      params.push(usuario_id);
    }

    // 2. Filtro por Fecha / Rango
    if (fecha) {
      whereClause += ' AND DATE(fecha) = ?';
      params.push(fecha);
    } else if (fecha_inicio && fecha_fin) {
      whereClause += ' AND DATE(fecha) >= ? AND DATE(fecha) <= ?';
      params.push(fecha_inicio, fecha_fin);
    }

    // 3. Filtro por Tipo de Actividad
    if (tipo_actividad && tipo_actividad !== 'TODOS') {
      whereClause += ' AND tipo_actividad = ?';
      params.push(tipo_actividad);
    }

    // 4. Filtro por Cuadrilla
    if (tipo_cuadrilla && tipo_cuadrilla !== 'TODOS') {
      if (tipo_cuadrilla === 'PROPIA') {
        whereClause += " AND UPPER(COALESCE(cuadrilla, 'PROPIA')) = 'PROPIA'";
      } else if (tipo_cuadrilla === 'EXTERNA') {
        whereClause += " AND UPPER(COALESCE(cuadrilla, 'PROPIA')) != 'PROPIA'";
        if (cuadrilla_especifica && cuadrilla_especifica !== 'TODOS') {
          whereClause += ' AND cuadrilla = ?';
          params.push(cuadrilla_especifica);
        }
      }
    }

    // 5. Filtro por Sector
    if (sector && sector !== 'TODOS') {
      whereClause += ' AND sector = ?';
      params.push(sector);
    }

    // Consulta KPIs
    const [kpis] = await connection.execute(`
      SELECT 
        COUNT(*) AS total_registros,
        COALESCE(SUM(CAST(cantidad_act AS UNSIGNED)), 0) AS total_actividades,
        COALESCE(SUM(total_act), 0) AS total_monto,
        COALESCE(SUM(exedente), 0) AS total_excedente_m,
        COALESCE(SUM(valor_exedente), 0) AS total_excedente_val,
        COALESCE(SUM(punto_red), 0) AS total_puntos_red,
        COALESCE(SUM(ac), 0) AS total_ac
      FROM act_detalles ${whereClause}
    `, params);

    // Consulta Desglose Cuadrilla
    const [origenData] = await connection.execute(`
      SELECT 
        CASE WHEN UPPER(COALESCE(cuadrilla, 'PROPIA')) = 'PROPIA' THEN 'PROPIA' ELSE 'EXTERNA' END AS origen,
        COALESCE(SUM(CAST(cantidad_act AS UNSIGNED)), 0) AS registros,
        COALESCE(SUM(total_act), 0) AS monto
      FROM act_detalles ${whereClause}
      GROUP BY origen
    `, params);

    // Consulta Desglose por Tipo
    const [tipoData] = await connection.execute(`
      SELECT 
        tipo_actividad,
        COALESCE(SUM(CAST(cantidad_act AS UNSIGNED)), 0) AS cantidad,
        COALESCE(SUM(total_act), 0) AS monto
      FROM act_detalles ${whereClause}
      GROUP BY tipo_actividad
    `, params);

    // Consulta Últimas Actividades
    const [recientes] = await connection.execute(`
      SELECT id, fecha, cuadrilla, cliente, tipo_actividad, forma_actividad, total_act
      FROM act_detalles ${whereClause}
      ORDER BY fecha DESC, id DESC
      LIMIT 5
    `, params);

    return res.status(200).json({
      summary: kpis[0] || {},
      origen: origenData || [],
      tipos: tipoData || [],
      recientes: recientes || []
    });

  } catch (error) {
    console.error("Error en BD:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}