const express = require('express');
const path = require('path');
const compilerRoutes = require('./routes/compilerRoutes');

const app = express();
const port = process.env.PORT || 3000;

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