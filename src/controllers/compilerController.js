const { codeRequiresInput } = require('../utils/codeChecker');
const { runOneTimeContainer, runPersistentContainer } = require('../services/docker');
const fs = require('fs').promises;

const userContainers = {};
const userFiles = {};

exports.run = async (req, res) => {
  const sessionID = req.headers['session-id'];
  const code = req.body.code;

  if (!code || !sessionID) {
    return res.status(400).json({ error: 'No code or session ID provided' });
  }

  try {
    const requiresInput = codeRequiresInput(code);

    if (requiresInput) {
      // Use persistent container
      const { container, output, filePath } = await runPersistentContainer(code, sessionID);
      userContainers[sessionID] = container;
      userFiles[sessionID] = filePath;
      res.json({ output, requiresInput: true });
    } else {
      // Use one-time container
      const output = await runOneTimeContainer(code);
      res.json({ output, requiresInput: false });
    }
  } catch (error) {
    console.error('Error running the code:', error);
    res.status(500).json({ error: 'Error running the code' });
  }
};

exports.cleanup = async (req, res) => {
    const sessionID = req.headers['session-id'];
    if (userContainers[sessionID]) {
      try {
        await userContainers[sessionID].remove({ force: true });
        delete userContainers[sessionID];
  
        if (userFiles[sessionID]) {
          await fs.unlink(userFiles[sessionID]);
          delete userFiles[sessionID];
        }
  
        res.json({ message: 'Container and associated files removed successfully' });
      } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ error: 'Error during cleanup' });
      }
    } else {
      res.status(404).json({ message: 'No container found for this session' });
    }
};
  
  // You might want to add a function to handle user input for persistent containers
exports.handleInput = async (req, res) => {
    const sessionID = req.headers['session-id'];
    const { input } = req.body;
  
    if (!userContainers[sessionID]) {
      return res.status(404).json({ error: 'No active container for this session' });
    }
  
    try {
      const container = userContainers[sessionID];
      const exec = await container.exec({
        Cmd: ['sh', '-c', `echo "${input}" | ./program`],
        AttachStdout: true,
        AttachStderr: true,
      });
  
      const stream = await exec.start();
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
  
      stream.on('end', () => {
        res.json({ output: output.trim() });
      });
    } catch (error) {
      console.error('Error handling input:', error);
      res.status(500).json({ error: 'Error processing input' });
    }
};

// const Docker = require('dockerode');
// const fs = require('fs');
// const path = require('path');
// const docker = new Docker();

// exports.run = async (req, res) => {
//     console.log('Run function called');
//     // Get the code from the request body
//     const code = req.body.code;
//     console.log('Received code:', code);
//     if (!code) {
//         return res.status(400).json({ error: 'No code provided' });
//     }
//     // Create a temporary directory to store the code
//     const tmpDir = path.join(__dirname, 'temp');
//     if (!fs.existsSync(tmpDir)) {
//         fs.mkdirSync(tmpDir);
//     }
//     const filePath = path.join(tmpDir, 'main.cpp');
//     fs.writeFileSync(filePath, code);

//     try {
//         // Create and start a Docker container using the cpp-compiler image
//         const container = await docker.createContainer({
//             Image: 'cpp-compiler',
//             Tty: false,
//             Cmd: ['sh', '-c', 'g++ -o program main.cpp && ./program'],
//             Volumes: {
//                 '/usr/src/app': {}  // Mounting the temp directory inside the container
//             },
//             HostConfig: {
//                 Binds: [`${tmpDir}:/usr/src/app`]  // Bind the temp directory to the container
//             }
//         });

//         // Start the container
//         await container.start();

//         // Wait for the container to finish execution
//         await container.wait();

//         // Regular expression to match the pattern
//         const pattern = /01000000000000.{2}/g;

//         // Capture the full output
//         const logs = await container.logs({
//             stdout: true,
//             stderr: true
//         });

//         // Convert the logs buffer to a string
//         let output = logs.toString('hex'); // Convert to hex to match the pattern
//         console.log('Hex output:', output);

//         // Remove the pattern from the hex output
//         output = output.replace(pattern, '');

//         // Convert back to utf-8 after removing the pattern
//         const cleanOutput = Buffer.from(output, 'hex').toString('utf8');

//         console.log('cleanedOutput:', cleanOutput);

//         console.log('Cleaned container output:', cleanOutput);

//         // Return the full output back to the client
//         res.json({ output: cleanOutput });

//     } catch (error) {
//         console.error('Error running the container:', error);
//         res.status(500).json({ error: 'Error running the code in the container' });
//     } finally {
//         if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//             console.log(`Temp file ${filePath} deleted successfully.`);
//         }
//     }
// };

// exports.clear = (req, res) => {
//     console.log('Clear function called');
//     res.json({ message: 'Output cleared', output: '' });
// };