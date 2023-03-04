// These routes are accessible by public
const express = require('express')
const router = express.Router()
const pool = require('../db');

router.get('/faculty/:faculty_id', async (req, res) => {
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

router.get('/course/:course_id', async (req, res) => {
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

        const { id, name, course_type, faculties, allowed_slots } = course[0]

        const faculty_ids = faculties.map(({ id, name }) => (id))
        const slot_ids = allowed_slots.map(({ id, timings }) => (id))

        return res.json({ success: true, data: { id, name, slot_ids, faculty_ids, course_type } });
    } catch (error) {
        console.error(`Error fetching faculty with id ${course_id}`, error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
})
// Endpoints for checking contents in tables
router.get('/faculties', async (req, res) => {

    try {
        const { rows } = await pool.query(`
      SELECT * FROM Faculty
    `)

        res.status(201).json({ success: true, data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, error: err })
    }

})

router.get('/courses', async (req, res) => {

    try {
        const { rows } = await pool.query(`
      SELECT * FROM Course
    `)

        res.status(201).json({ success: true, data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, error: err })
    }

})

router.get('/slots', async (req, res) => {

    try {
        const { rows } = await pool.query(`
      SELECT * FROM Slot
    `)

        res.status(201).json({ success: true, data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, error: err })
    }

})

router.post('/register', authenticateToken, async (req, res) => {
    // Couldnt deserialize ID so not a valid student
    if (!req.user.id) {
        return res.status(401).send({ success: false, data: {} })
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

            if (rows.length > 0) {
                rows[0].registered_courses.forEach(item => {
                    if (item.slots) {
                        item.slots.forEach(slot => {
                            registeredSlots.add(slot.id)
                        })
                    }
                })
            }

            for (const slot of slot_ids) {
                if (registeredSlots.has(slot)) {
                    return res.status(405).send({ success: false, error: "Slots Clash" })
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
        res.status(401).send({ success: false, data: {} })
    }

})

router.get('/timetable', authenticateToken, async (req, res) => {

    try {
        if (req.user.id > 0) {

            const id = req.user.id;


            const { rows: students } = await pool.query(`
        SELECT * FROM Student
        WHERE id = $1
      `, [id])

            if (students.length == 0) {
                return res.status(401).send({ success: false, data: {} })
            }

            return res.status(201).send({ success: true, data: students[0] })


        } else {
            return res.status(401).send({ success: false, data: {} })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, error: err })
    }

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