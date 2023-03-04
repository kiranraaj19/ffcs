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
    if (req.user.id != 0) return res.status(401).send({succss: false, data: {}})

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

app.post('/admin/slot', authenticateToken, async (req,res) => {
    // Not admin
    if (req.user.id != 0) return res.sendStatus(401)

    const { id, timings } = req.body;

  try {

    // Check if slot with given ID already exists
    const { rowCount: existingRowCount } = await pool.query('SELECT COUNT(*) FROM Slot WHERE id = $1', [id]);
    if (existingRowCount > 0) {
      return res.status(405).json({ success: false, message: 'Slot with given ID already exists' });
    }

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

app.post('/admin/course',authenticateToken, async (req, res) => {
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

  app.post('/admin/student', authenticateToken, async (req,res) => {
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

  app.get('/faculty/:faculty_id', async (req,res) => {
    const { faculty_id } = req.params;

    try {
      const { rows: faculty } = await pool.query(`
        SELECT id, name
        FROM Faculty
        WHERE id = $1
      `, [faculty_id]);
  
      if (faculty.length == 0) {
        return res.status(404).json({ success: false, message: `Faculty with id ${faculty_id} not found` });
      }
  
      return res.status(201).json({ success: true, data: faculty });
    } catch (error) {
      console.error(`Error fetching faculty with id ${faculty_id}`, error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  })

  app.get('/course/:course_id', async (req,res) => {
    const { course_id } = req.params;

    try {
      const { rows: course } = await pool.query(`
        SELECT id,name,course_type,faculties,allowed_slots
        FROM Course
        WHERE id = $1
      `, [course_id]);
      console.log(course)

      if (course.length == 0) {
        return res.status(404).json({ success: false, message: `Course with id ${course_id} not found` });
      }

      const {id,name,course_type, faculties, allowed_slots} = course[0]
      
      const faculty_ids = faculties.map(({id,name}) => (id))
      const slot_ids = allowed_slots.map(({id,timings}) => (id))
    
      return res.json({ success: true, data: {id,name,slot_ids,faculty_ids,course_type} });
    } catch (error) {
      console.error(`Error fetching faculty with id ${course_id}`, error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  })
  
  app.post('/register', authenticateToken, async (req,res) => {
    // Couldnt deserialize ID so not a valid student
    if (!req.user.id) {
      return res.status(401).send({success:false,data:{}})
    }

    // A Valid student is accessing the endpoint
    if (req.user.id > 0) {

      const { course_id, faculty_id, slot_ids } = req.body;

      try {
        // Fetch course data
        const { rows: course } = await pool.query(
          'SELECT id, name, course_type, faculties, allowed_slots FROM Course WHERE id = $1',
          [course_id]
        );

        // Fetch faculty data
        const faculty = course[0].faculties.find((faculty) => faculty.id === faculty_id);

        // Fetch slot data
        const { rows: slots } = await pool.query(
          'SELECT id, timings FROM Slot WHERE id = ANY($1::text[])',
          [slot_ids]
        );

        // Check if the slot id clashes with already registered courses
        const { rows } = await pool.query(
          'SELECT registered_courses FROM Student WHERE id = $1',
          [req.user.id]
        );
        
        // Extract all slot ids of registered courses and store them in a Set
        const registeredSlots = new Set();
        
        rows[0].registered_courses.forEach(item => {
          if (item.slots){
          item.slots.forEach(slot => {
            registeredSlots.add(slot.id)
          })
        }
        })

        for (const slot of slot_ids) {
          if (registeredSlots.has(slot)){
            return res.status(405).send({success:false, error: "Slots Clash"})
          }
        }

        // Construct response object
        const registered_course = {
          course: {
            id: course[0].id,
            name: course[0].name,
            faculties: [faculty],
            course_type: course[0].course_type,
            allowed_slots: course[0].allowed_slots,
          },
          slots,
        };

        // Insert registered course data into student's registered_courses field
        await pool.query(
          'UPDATE Student SET registered_courses = registered_courses || $1::jsonb WHERE id = $2',
          [JSON.stringify([registered_course]), req.user.id]
        );

        res.status(201).json({ success: true, data: { registered_course } });
      } catch (error) {
        console.error('Error registering course', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
      
    } else {
      res.status(401).send({success:false,data:{}})
    }
  
  })

app.get('/timetable', authenticateToken, async (req,res) => {

  try {
  if (req.user.id > 0) {

    const id = req.user.id;
  
  
    const { rows: students } = await pool.query(`
      SELECT * FROM Student
      WHERE id = $1
    `, [id])

    if (students.length == 0) {
      return res.status(401).send({success:false, data: {}})
    }

    return res.status(201).send({success: true, data: students[0]})
  
    
  } else {
    return res.status(401).send({success:false, data: {}})
  }
  } catch (err) {
    console.log(err)
    res.status(500).json({success:false, error: err})
  }

})

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