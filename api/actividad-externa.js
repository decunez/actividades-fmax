import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  let connection;

  try {
    const {
      id, // Detecta si viene el ID para editar
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

    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || 'actividades',
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    // Normalizar la cadena para comparación segura
    const formaUpper = (forma_actividad || '').toUpperCase().trim();

    let cantidad_act = 1;
    let valor_actividad = 6.00;

    // Lógica dinámica según la Forma de Actividad
    if (formaUpper.includes('DUCTERIA') || formaUpper.includes('SOTERRADO')) {
      cantidad_act = 2;
      valor_actividad = 14.00;
    } else if (formaUpper.includes('RECABLEADO')) {
      cantidad_act = 1;
      valor_actividad = 7.00;
    } else {
      cantidad_act = 1;
      valor_actividad = 6.00;
    }

    const fibraNum = Number(cantidad_fibra) || 0;
    const exedente = fibraNum > 300 ? fibraNum - 300 : 0;
    const valor_exedente = exedente * 0.04;

    const predNum = Number(punto_red) || 0;
    const valor_pred = predNum * 5.00;

    const acNum = Number(ac) || 0;
    const valor_ac = acNum * 5.00;

    const total_act = valor_actividad + valor_exedente + valor_pred + valor_ac;

    const clienteClean = cliente?.trim() || 'NO DEFINIDO';
    const cuadrillaClean = cuadrilla?.toUpperCase().trim() || 'EXTERNA';
    const sectorClean = sector?.toUpperCase().trim() || 'OTROS VALLES';

    if (id) {
      // ----------------------------------------------------
      // MODO ACTUALIZAR (UPDATE)
      // ----------------------------------------------------
      const updateQuery = `
        UPDATE act_detalles SET
          id_usuario = ?, 
          cliente = ?, 
          fecha = ?, 
          cuadrilla = ?, 
          sector = ?, 
          tipo_actividad = ?, 
          forma_actividad = ?, 
          cantidad_act = ?, 
          valor_actividad = ?, 
          cantidad_fibra = ?, 
          exedente = ?, 
          valor_exedente = ?, 
          punto_red = ?, 
          valor_pred = ?, 
          ac = ?, 
          valor_ac = ?, 
          total_act = ?
        WHERE id = ?
      `;

      const updateValues = [
        id_usuario,
        clienteClean,
        fecha,
        cuadrillaClean,
        sectorClean,
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
        total_act,
        id // ID para la cláusula WHERE
      ];

      await connection.execute(updateQuery, updateValues);
      await connection.end();

      return res.status(200).json({ success: true, updatedId: id, message: 'Actividad actualizada correctamente' });

    } else {
      // ----------------------------------------------------
      // MODO CREAR NUEVO (INSERT)
      // ----------------------------------------------------
      const insertQuery = `
        INSERT INTO act_detalles (
          id_usuario, cliente, fecha, cuadrilla, sector, 
          tipo_actividad, forma_actividad, cantidad_act, valor_actividad, 
          cantidad_fibra, exedente, valor_exedente, 
          punto_red, valor_pred, ac, valor_ac, total_act
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertValues = [
        id_usuario,
        clienteClean,
        fecha,
        cuadrillaClean,
        sectorClean,
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

      const [result] = await connection.execute(insertQuery, insertValues);
      await connection.end();

      return res.status(200).json({ success: true, insertId: result.insertId, message: 'Actividad registrada correctamente' });
    }

  } catch (error) {
    if (connection) await connection.end();
    return res.status(500).json({ error: error.message });
  }
}