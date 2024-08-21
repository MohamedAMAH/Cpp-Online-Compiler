const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const docker = new Docker();

exports.run = async (req, res) => {
    console.log('Run function called');
  
    // Get the code from the request body
    const code = req.body.code;
    console.log('Received code:', code);

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // Create a temporary directory to store the code
    const tmpDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir);
    }

    const filePath = path.join(tmpDir, 'main.cpp');
    fs.writeFileSync(filePath, code);

    try {
        // Create and start a Docker container using the cpp-compiler image
        const container = await docker.createContainer({
            Image: 'cpp-compiler',
            Tty: false,
            Cmd: ['sh', '-c', 'g++ -o program main.cpp && ./program'],
            Volumes: {
                '/usr/src/app': {}  // Mounting the temp directory inside the container
            },
            HostConfig: {
                Binds: [`${tmpDir}:/usr/src/app`]  // Bind the temp directory to the container
            }
        });

        // Start the container
        await container.start();

        // Capture the output
        const stream = await container.logs({
            stdout: true,
            stderr: true,
            follow: true
        });

        let output = '';
        stream.on('data', (chunk) => {
            output += chunk.toString();
        });

        // Wait for the container to finish execution
        await container.wait();

        // Remove the container
        await container.remove();

        // Return the output back to the client
        res.json({ output });
    } catch (error) {
        console.error('Error running the container:', error);
        res.status(500).json({ error: 'Error running the code in the container' });
    } finally {
        // Clean up the temp directory
        fs.unlinkSync(filePath);
    }
};

exports.clear = (req, res) => {
    console.log('Clear function called');
    // Add your logic to clear the output
    res.json({ message: 'Output cleared' });
};
