const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Shan@22it',
  database: 'new_schema'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1); // Exit the app if the DB connection fails
  }
  console.log('Connected to MySQL');
});

// Helper function for server-side validation
const validateEmployeeData = (data) => {
  const { firstName, lastName, employeeID, email, phoneNumber, department, dateOfJoining, role } = data;
  if (!firstName || !lastName || !employeeID || !email || !phoneNumber || !department || !dateOfJoining || !role) {
    return 'All fields are required';
  }
  if (!/^\d{10}$/.test(phoneNumber)) {
    return 'Invalid phone number';
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return 'Invalid email address';
  }
  if (new Date(dateOfJoining) > new Date()) {
    return 'Future dates not allowed';
  }
  return null; // No errors
};

// API Endpoint to Add Employee
app.post('/api/employees', (req, res) => {
  const employeeData = req.body;

  // Validate data
  const validationError = validateEmployeeData(employeeData);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { firstName, lastName, employeeID, email, phoneNumber, department, dateOfJoining, role } = employeeData;

  // Check for duplicates
  const checkQuery = 'SELECT email, employeeID FROM employees WHERE email = ? OR employeeID = ?';
  db.query(checkQuery, [email, employeeID], (err, results) => {
    if (err) {
      console.error('Database error during duplicate check:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      const duplicateField = results[0].email === email ? 'Email ID' : 'Employee ID';
      return res.status(400).json({ error: `${duplicateField} already exists` });
    }

    // Insert new employee
    const insertQuery =
      'INSERT INTO employees(firstName, lastName, employeeID, email, phoneNumber, department, dateOfJoining, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(insertQuery, [firstName, lastName, employeeID, email, phoneNumber, department, dateOfJoining, role], (err) => {
      if (err) {
        console.error('Database error during insertion:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ success: 'Employee added successfully' });
    });
  });
});

// Start the Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
