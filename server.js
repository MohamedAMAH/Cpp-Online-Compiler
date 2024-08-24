const express = require('express');
const path = require('path');
const compilerRoutes = require('./src/routes/compilerRoutes');
const cookieParser = require('cookie-parser'); // Import cookie-parser
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser()); // Add cookie-parser middleware

// Session middleware
app.use(session({
  secret: 'online-cpp-compiler', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve the React.js frontend
app.use(express.static(path.join(__dirname, 'build')));

// Handle the backend API routes
app.use('/api', compilerRoutes);

// Catch-all route for the React.js frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
