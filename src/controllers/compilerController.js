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

        stream.on('end', () => {
            console.log('Output from stream:', output);
        });

        // Wait for the container to finish execution
        await container.wait();

        // Remove the container
        await container.remove();

        // Remove the specific SOH character (☺ or \x01)
        // const cleanedOutput = output.replace(/\x01/g, '');

        // Clean the output: Remove null characters and trim whitespace
        const cleanedOutput = output
            .replace(/\x00/g, '') // Remove all null characters
            .replace(/^[\s\x01-\x1F\x7F]+/g, '') // Remove leading control characters and whitespace
            .replace(/[\s\x01-\x1F\x7F]+$/g, ''); // Remove trailing control characters and whitespace

        console.log('hey: ', {cleanedOutput});

        // Return the cleaned output back to the client
        res.json({ output: cleanedOutput });
    } catch (error) {
        console.error('Error running the container:', error);
        res.status(500).json({ error: 'Error running the code in the container' });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Temp file ${filePath} deleted successfully.`);
        }
    }
};

exports.clear = (req, res) => {
    console.log('Clear function called');
    res.json({ message: 'Output cleared', output: '' });
};