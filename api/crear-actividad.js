import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const {
    id_usuario, cliente, fecha, cuadrilla, sector, tipo_actividad,
    forma_actividad, cantidad_act, valor_actividad, cantidad_fibra,
    punto_red, valor_pred, ac, valor_ac, exedente, valor_exedente, total_act
  } = req.body;

  if (!id_usuario || !fecha || !tipo_actividad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
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

    const [result] = await connection.execute(
      `INSERT INTO act_detalles (
        id_usuario, cliente, fecha, cuadrilla, sector, tipo_actividad, forma_actividad,
        cantidad_act, valor_actividad, cantidad_fibra, punto_red, valor_pred,
        ac, valor_ac, exedente, valor_exedente, total_act
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_usuario, cliente || 'NO DEFINIDO', fecha, cuadrilla || 'PROPIA', sector || '', tipo_actividad,
        forma_actividad, cantidad_act, valor_actividad, cantidad_fibra || 0,
        punto_red, valor_pred, ac, valor_ac, exedente, valor_exedente, total_act || 0.00
      ]
    );

    await connection.end();
    return res.status(201).json({ message: 'Actividad registrada con éxito', id: result.insertId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}