import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const {
    id, // Extrae el ID enviado en la petición para verificar si es edición
    id_usuario, cliente, fecha, cuadrilla, sector, tipo_actividad,
    forma_actividad, cantidad_act, valor_actividad, cantidad_fibra,
    punto_red, valor_pred, ac, valor_ac, exedente, valor_exedente, total_act
  } = req.body;

  if (!id_usuario || !fecha || !tipo_actividad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

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

    if (id) {
      // ----------------------------------------------------
      // MODO ACTUALIZAR (UPDATE)
      // ----------------------------------------------------
      await connection.execute(
        `UPDATE act_detalles SET
          id_usuario = ?, cliente = ?, fecha = ?, cuadrilla = ?, sector = ?,
          tipo_actividad = ?, forma_actividad = ?, cantidad_act = ?, valor_actividad = ?,
          cantidad_fibra = ?, punto_red = ?, valor_pred = ?, ac = ?, valor_ac = ?,
          exedente = ?, valor_exedente = ?, total_act = ?
        WHERE id = ?`,
        [
          id_usuario, cliente || 'NO DEFINIDO', fecha, cuadrilla || 'PROPIA', sector || '', tipo_actividad,
          forma_actividad, cantidad_act, valor_actividad, cantidad_fibra || 0,
          punto_red || 0, valor_pred || 0, ac || 0, valor_ac || 0, exedente || 0, valor_exedente || 0, total_act || 0.00,
          id
        ]
      );

      await connection.end();
      return res.status(200).json({ success: true, message: 'Actividad actualizada con éxito', id });

    } else {
      // ----------------------------------------------------
      // MODO CREAR NUEVO (INSERT)
      // ----------------------------------------------------
      const [result] = await connection.execute(
        `INSERT INTO act_detalles (
          id_usuario, cliente, fecha, cuadrilla, sector, tipo_actividad, forma_actividad,
          cantidad_act, valor_actividad, cantidad_fibra, punto_red, valor_pred,
          ac, valor_ac, exedente, valor_exedente, total_act
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_usuario, cliente || 'NO DEFINIDO', fecha, cuadrilla || 'PROPIA', sector || '', tipo_actividad,
          forma_actividad, cantidad_act, valor_actividad, cantidad_fibra || 0,
          punto_red || 0, valor_pred || 0, ac || 0, valor_ac || 0, exedente || 0, valor_exedente || 0, total_act || 0.00
        ]
      );

      await connection.end();
      return res.status(201).json({ success: true, message: 'Actividad registrada con éxito', id: result.insertId });
    }

  } catch (error) {
    if (connection) await connection.end();
    return res.status(500).json({ error: error.message });
  }
}