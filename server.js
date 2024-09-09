const express = require('express');
const path = require('path');
const compilerRoutes = require('./src/routes/compilerRoutes');
const { cleanupInactiveContainers } = require('./src/services/containerCleanup');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

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
  cleanupInactiveContainers();
});
