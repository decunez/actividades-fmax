import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const {
      id_usuario = 1,
      cuadrilla,
      sector,
      cliente,
      fecha,
      tipo_actividad,
      forma_actividad,
      cantidad_fibra = 0,
      punto_red = 0,
      ac = 0
    } = req.body;

    const connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    // Lógica de cálculo de valores
    let cantidad_act = 1;
    let valor_actividad = 0;
    
    if (tipo_actividad === 'INSTALACION' || tipo_actividad === 'TRASLADO') {
      valor_actividad = (forma_actividad === 'DUCTERIA') ? 14.00 : 7.00;
    } else if (tipo_actividad === 'VISITA') {
      valor_actividad = 14.00;
    }

    const fibraNum = Number(cantidad_fibra) || 0;
    const exedente = fibraNum > 200 ? fibraNum - 200 : 0;
    const valor_exedente = exedente * 0.04;

    const predNum = Number(punto_red) || 0;
    const valor_pred = predNum * 5.00;

    const acNum = Number(ac) || 0;
    const valor_ac = acNum * 5.00;

    const total_act = valor_actividad + valor_exedente + valor_pred + valor_ac;

    const query = `
      INSERT INTO act_detalles (
        id_usuario, cliente, fecha, cuadrilla, sector, 
        tipo_actividad, forma_actividad, cantidad_act, valor_actividad, 
        cantidad_fibra, exedente, valor_exedente, 
        punto_red, valor_pred, ac, valor_ac, total_act
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      id_usuario,
      cliente?.trim() || 'NO DEFINIDO',
      fecha,
      cuadrilla?.toUpperCase().trim() || 'EXTERNA',
      sector?.toUpperCase().trim() || 'OTROS VALLES',
      tipo_actividad,
      forma_actividad,
      cantidad_act,
      valor_actividad,
      fibraNum,
      exedente,
      valor_exedente,
      predNum,
      valor_pred,
      acNum,
      valor_ac,
      total_act
    ];

    const [result] = await connection.execute(query, values);
    await connection.end();

    return res.status(200).json({ success: true, insertId: result.insertId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}