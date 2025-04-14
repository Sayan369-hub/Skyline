// Import required modules
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config'); // Import the config file

// Initialize Express app
const app = express();
const port = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

//MIddleware to configure session
app.use(session({
  secret: '24072019', // A secret key for signing the session ID cookie
  resave: false,             // Forces the session to be saved back to the store, even if it's not modified
  saveUninitialized: true,  // Don't save empty sessions
  cookie: { secure: false }  // Set to true if using https (for production)
}));

// Create a MySQL connection using the config file
const db = mysql.createConnection(config.mysql);

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Define the route to get data from the database
app.get('/skylineedu', (req, res) => {
  const query = 'SELECT * FROM student LIMIT 1';  // Fetch one student record

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      res.status(500).send('Error retrieving data.');
      return;
    }

    if (results.length === 0) {
      res.send('No records found.');
      return;
    }

    // Pass the data to the EJS template
    res.render('index', { student: results[0] });
  });
});

// Render Login Page
app.get('/login', (req, res) => {
  req.session.status = 'NA';
  res.render('login', { session: req.session });
});
app.get('/courses', (req, res) => {
  res.render('courses');
});

app.get('/skylineedu', (req, res) => {
  const courses = [
    { image: 'course1.jpg', title: 'JavaScript for Beginners', updateDate: '21/8/22', reviews: 239, price: '$49.99' },
    { image: 'course2.jpg', title: 'HTML & CSS Mastery', updateDate: '18/7/21', reviews: 150, price: '$39.99' },
    { image: 'course3.jpg', title: 'Python Programming', updateDate: '10/9/23', reviews: 180, price: '$59.99' },
  ];

  res.render('index', { courses });
});


// Handle User Authentication (Dummy logic)
app.get('/authenticateuser', (req, res) => {
  const { id, password } = req.query;
  console.log(id);
  // SQL query that uses parameters (e.g., user id or name)
  const query = 'SELECT id,password FROM user WHERE id = ? AND password = ?';
  db.query(query, [id, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error - Inside Authentication');
    }
    //print(results);
    console.log(results);

    if (results.length > 0) {
      req.session.user = results.id;
      req.session.status = 'A';
      const branchq = "select branchid,branchName from branch where status = 'A'";
      const courseq = "SELECT courseid,coursename,type from course where status ='Active'";
      console.log(branchq);
      db.query(branchq, (err, bresults) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Database error- To fetch Branch');
        }
        db.query(courseq, (err, cresults) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Database error- To fetch Branch');
          }
          req.session.branches = bresults;
          req.session.courses = cresults;
          res.json({
            status: 'success',
            message: 'Login successful, redirecting...',
            redirectTo: '/home'  // This is the new page to redirect to
          });
          //console.log(bresults);
        });
      });

      console.log('Before redirection');
      console.log(req.session.branches);

    } // Return the results as JSON
    else {
      res.json(results);
    }

    // Dummy check (Replace this with real database authentication)
    /*if (username === "admin" && password === "admin123") {
      res.render('home', { username });
    } else {
      res.send("Invalid username or password");
    }*/
  });
});
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }
    req.session.status = 'NA';
    res.redirect('/login', { session: req.session }); // Redirect to login page after logout
  });
});
app.get('/home', (req, res) => {
  res.render('home', { session: req.session, branches: req.session.branches, courses: req.session.courses });
});
//start the registration action

app.get('/load-content/:menuItem', (req, res) => {
  const menuItem = req.params.menuItem;
  console.log('before rendering menu item');
  // Dynamically render different content based on the menu item
  res.render(menuItem, { session: req.session, branches: req.session.branches || [], courses: req.session.courses || [] }); // Assuming you have partials like "menu1.ejs", "menu2.ejs"
});
app.post('/saveUserQuery', (req, res) => {

  const { username,phone, email, subject, query} = req.body;
  console.log(username);
  // SQL query that uses parameters (e.g., user id or name)
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0'); // Ensure two digits
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Ensure two digits (months are zero-indexed)

  // Generate a random integer between 1000 and 9999
  const randomInt = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

  // Concatenate the date, month, and random number
  const userid = `${day}${month}${randomInt}`;
  const userquery = "INSERT INTO  (userid, username, phone, email, subject, query, status, attrib1, attrib2, attrib3) VALUES (?, ?, ?, ?, ?, ?, 'N', NULL,NULL,NULL) ";
  db.query(userquery, [userid, username, phone, email, subject, query], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Failed to Save Query' });
      return res.status(500).send('Database error - Inside User Query');
    }
    else {

      res.json({ success: true, userid: userid, username: username, message: 'THANK YOU FOR CONTACTING US WE WILL REACH YOU SOON ' })

    }
  
    console.log(results);
  });
});

app.get('/contact', (req, res) => {
  res.render('Contact');
});

//Save the Student Data into Database
app.post('/saveStudent', (req, res) => {
  const { stdname, fname, mname, email, phone, dob, gender, address, school, clas, qua, branch, status } = req.body;
  console.log(stdname);
  // SQL query that uses parameters (e.g., user id or name)
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0'); // Ensure two digits
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Ensure two digits (months are zero-indexed)

  // Generate a random integer between 1000 and 9999
  const randomInt = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

  // Concatenate the date, month, and random number
  const studentid = `${day}${month}${randomInt}`;
  const query = "INSERT INTO student (stdid, stdname, dob, address, class, school, phoneno, fathername, mothername, email, qualification, status, teacherid, gender, branchid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?, ?) ";
  db.query(query, [studentid, stdname, dob, address, clas, school, phone, fname, mname, email, qua, status, gender, branch], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Failed to Save Data' });
      return res.status(500).send('Database error - Inside Student Save');
    }
    else {

      res.json({ success: true, studentid: studentid, studentname: stdname, message: 'Student Data Saved Successfully' })

    }
  
    console.log(results);
  });
});

//Save the Course for Student
app.post('/saveCourse', (req, res) => {
  const { stdidch, stdnamech, courseSelect, coursefee, admissionfee, admissiondate, coursename, cstatus } = req.body;
  console.log(stdidch);
  console.log(courseSelect);
  // SQL query that uses parameters (e.g., user id or name)
  const qtype = "select coursename,type from course where courseid = ?";
  const query = "INSERT INTO studentcourse (stdid, courseid, coursename, coursefee, coursetype, admissionfee, admissiondate, status, DueAmount, paidamount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(qtype, [courseSelect], (err, cresults) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Failed to Save Data' });
      return res.status(500).send('Database error - Inside Course type fetch');
    }
    else {
      const coursetype = cresults[0].type;
      const coursename = cresults[0].coursename;
      console.log(coursetype);
      db.query(query, [stdidch, courseSelect, coursename, coursefee, coursetype, admissionfee, admissiondate, cstatus, 0, 0], (err, results) => {
        if (err) {
          console.error(err);
          res.json({ success: false, message: 'Failed to Save Data' });
          return res.status(500).send('Database error - Inside Course Save');
        }
        else {

          res.json({ success: true, message: 'Course Data Saved Successfully' })
        }
        //print(results);
        console.log(results);

      });
    }
  });
});


app.post('/saveSlots', (req, res) => {
  const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ message: 'Invalid data' });
    }
    const qtype = "select coursename,type from course where courseid = ?";
    const slotSql = 'INSERT INTO studentassignment (assignmentid, stdid, stdname, day, time, courseid, coursename, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    slots.forEach((slot) => {
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0'); // Ensure two digits
      const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Ensure two digits (months are zero-indexed)
    
      // Generate a random integer between 1000 and 9999
      const randomInt = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    
      // Concatenate the date, month, and random number
      const assignmentid = `${day}${month}${randomInt}`;

        db.query(slotSql, [assignmentid,slot.stdid,slot.day, slot.time], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving slots', error: err });
            }
        });
    });

    res.status(200).json({ message: 'Slots saved successfully' });
});
// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
