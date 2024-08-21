exports.run = (req, res) => {
    console.log('Run function called');
    const { code } = req.body;
  
    // Log the code to the console
    console.log('Received code:', code);
  
    // Return the code as the output
    res.json({ output: code });
};
  
exports.clear = (req, res) => {
    console.log('Clear function called');
    // Add your logic to clear the output
    res.json({ message: 'Output cleared' });
};