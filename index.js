const express = require('express')
const app = express()
// For Authentication using JOTS (Json Web Tokens)
const jwt = require('jsonwebtoken')

// All requests will be JSONified
app.use(express.json())


// Import the config details
require('dotenv').config()

// Database Config
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.post('/admin/faculty', authenticateToken, (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    // Get the id and name from payload
    const { id, name } = req.body;
    console.log(id,name);
    pool.query('INSERT INTO Faculty (id,name) VALUES ($1, $2)', [id,name], (error, results) => {
        if (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to insert faculty.' });
        } else {
        console.log(`Inserted faculty with ID ${id} and name ${name}.`);
        res.status(201).json({ success: true, data: { id, name } });
    }
    });
})

app.post('/admin/slot', authenticateToken, (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id, timings } = req.body;

  try {
    const { rowCount } = pool.query(`
      INSERT INTO Slot (id, timings)
      VALUES ($1, $2)
    `, [id, JSON.stringify(timings)]);

    if (rowCount !== 1) {
      throw new Error('Failed to create slot');
    }

    const createdSlot = { id, timings };

    res.json({ success: true, data: createdSlot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create slot' });
  }
})

app.post('/admin/course',authenticateToken, async (req, res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id, name, course_type, slot_ids, faculty_ids } = req.body;
  
    const { rows: faculties } = await pool.query(`
      SELECT id, name
      FROM Faculty
      WHERE id IN (${faculty_ids.map((id) => `'${id}'`).join(', ')})
    `);

    const { rows: slots } = await pool.query(`
      SELECT id, timings
        FROM Slot
        WHERE id IN (${slot_ids.map((id) => `'${id}'`).join(', ')})
    `);

    console.log(faculties)
    console.log(slots)

    const { rows } = await pool.query(`
      INSERT INTO Course (id, name, course_type, faculties, allowed_slots)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, course_type, JSON.stringify(faculties), JSON.stringify(slots)]);
    
    res.json({
      success: true,
      data: rows[0],
    });
  });
  

function authenticateToken(req,res,next) {
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.listen(3000)