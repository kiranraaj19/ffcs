// These routes are accessible by admin only

const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/faculty', authenticateToken, async (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.status(401).send({success: false, data: {}})

    // Get the id and name from payload
    const { id, name } = req.body;

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

router.post('/slot', authenticateToken, async (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id, timings } = req.body;

  try {
    const { rowCount } = pool.query(`
      INSERT INTO Slot (id, timings)
      VALUES ($1, $2)
    `, [id, JSON.stringify(timings)]);

    const createdSlot = { id, timings };

    res.json({ success: true, data: createdSlot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, data: 'Failed to create slot' });
  }
  
})

router.post('/course',authenticateToken, async (req, res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id, name, course_type, slot_ids, faculty_ids } = req.body;
    try {
    const { rows: faculties } = await pool.query(`
      SELECT id, name
      FROM Faculty
      WHERE id IN (${faculty_ids.map((id) => `'${id}'`).join(', ')})
    `);

    const { rows: allowed_slots } = await pool.query(`
      SELECT id, timings
        FROM Slot
        WHERE id IN (${slot_ids.map((id) => `'${id}'`).join(', ')})
    `);

    if (allowed_slots.length == 0) {
      return res.status(405).send({success:false, error: "Invalid Slot"})
    }

    const { rows } = await pool.query(`
      INSERT INTO Course (id, name, course_type, faculties, allowed_slots)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, course_type, JSON.stringify(faculties), JSON.stringify(allowed_slots)]);
    
    res.json({
      success: true,
      data: {id, name, faculties, allowed_slots},
    });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, data: 'Failed to create course' });
    }
  });

router.post('/student', authenticateToken, async (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id,name } = req.body;
    
    // Check if the student doesnt exist already
    const {rows: students} = await pool.query(`
      SELECT id from Student WHERE id = $1 
    `, [id])

    if (!students){
      return res.status(401).send({success: false, data: {}})
    } else {
    try {
    pool.query('INSERT INTO Student (id,name, registered_courses) VALUES ($1, $2, $3)', [id,name,[]], (error, results) => {
        if (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to insert Student.' });
        } else {
        console.log(`Inserted Student with ID ${id} and name ${name}.`);
        res.status(201).json({ success: true, data: { id, name } });
        }
    })
    } catch (error) {
        console.error(`Error inserting student with id ${id}`, error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]
  
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  }

module.exports = router