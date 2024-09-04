const Docker = require('dockerode');
const fs = require('fs').promises;
const fsM = require('fs');
// const path = require('path');
// const tar = require('tar');
// const fs = require('fs')
// const path = require('path');
const stream = require('stream');
const docker = new Docker();
const pattern = /01000000000000.{2}/g;
const tar = require('tar');
const path = require('path');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const streamPromise = require('stream-to-promise');
// const { Writable } = require('stream');
const os = require('os');
// const util = require('util');
// const { promisify } = require('util');
const childProcess = require('child_process');
// const execAsync = promisify(childProcess.exec);
const INITIALIZATION_MESSAGE = '{"stream":true,"stdin":true,"stdout":true,"stderr":true,"logs":true,"hijack":true}';
const regex = new RegExp(INITIALIZATION_MESSAGE, 'g');
const util = require('util');
// const exec = util.promisify(require('child_process').exec);
const { execSync } = require('child_process'); // Ensure you require 'child_process' for execSync



// const createTempFile = async (code) => {
//   const tmpDir = path.join(__dirname, '../temp');
//   await fs.mkdir(tmpDir, { recursive: true });
//   const filePath = path.join(tmpDir, 'main.cpp');
//   await fs.writeFile(filePath, code);
//   return { tmpDir, filePath };
// };

// Helper function to create a temporary file with C++ code
async function createTempFile(code) {
  const tmpDir = path.resolve('/tmp'); // Ensure the path is correct
  const filePath = path.join(tmpDir, 'main.cpp');
  fsM.writeFileSync(filePath, code);
  return { tmpDir, filePath };
}

exports.runlolContainer = async (code, userInput) => {
  const { tmpDir } = await createTempFile(code);

  // Create and start the container
  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  // Create an exec instance to run the compiled program
  const exec = await container.exec({
    Cmd: ['./program'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true
  });

  // Start the exec instance and get the stream
  const stream = await exec.start({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true
  });

  // Convert the stream into a readable stream
  const { Readable } = require('stream');
  const readableStream = new Readable().wrap(stream);

  // Handle the stream data
  readableStream.on('data', (data) => {
    console.log(data.toString());
  });

  readableStream.on('error', (err) => {
    console.error('Stream error:', err);
  });

  // Write user input to the exec instance's stdin
  stream.write(userInput + '\n');
  stream.end();

  // Wait for the stream to finish
  await new Promise((resolve, reject) => {
    readableStream.on('end', resolve);
    readableStream.on('error', reject);
  });
};

exports.runNewContainer = async (code, input = 'input_string\n') => {
  console.log('Creating container...');
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: false,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  console.log('Attaching to container...');
  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  console.log('Starting container...');
  await container.start();

  let stdout1 = '';
  let stderr1 = '';
  let stdout2 = '';
  let stderr2 = '';
  let currentOutput = { stdout: stdout1, stderr: stderr1 };

  // Function to handle output
  const handleOutput = (chunk) => {
    if (chunk[0] === 1) {  // stdout
      currentOutput.stdout += chunk.slice(8).toString('utf8');
    } else if (chunk[0] === 2) {  // stderr
      currentOutput.stderr += chunk.slice(8).toString('utf8');
    }
  };

  // Collect initial output
  stream.on('data', handleOutput);

  // Wait for initial output
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Sending input to the program...');
  stream.write(input);

  // Switch to collecting new output
  currentOutput = { stdout: stdout2, stderr: stderr2 };

  // Wait for new output
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Wait for the container to finish execution
  await container.wait();

  // Clean up
  await container.remove({ force: true });
  console.log('Container stopped and removed');

  return {
    stdout1,
    stderr1,
    stdout2,
    stderr2,
    stdin: input
  };
};

exports.runInteractiveContainer = async (code) => {
  console.log('Creating container...');
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,  // Allow stdin to be open
    StdinOnce: false  // Keep stdin open
  });

  console.log('Starting container...');
  await container.start();

  console.log('Attaching to container...');
  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,  // Get the logs before attachment, useful for debugging
    hijack: true  // Allows direct control over the streams
  });

  let output1 = '';

  // Collect initial output
  const collectOutput = (chunk) => {
    output1 += chunk.toString('utf8');
  };

  stream.on('data', collectOutput);

  console.log('Container started. Waiting for initial output...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for initial output

  console.log('First Output: ', output1)

  // Send input to the program running in the container
  stream.write('input_string\n');  // Ensure newline is included to simulate pressing Enter

  console.log('Input sent. Waiting for new output...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new output

  // Wait for the container to finish execution
  await container.wait();  // This waits until the container exits

  console.log('Fetching logs...');
  const logs = await container.logs({
    stdout: true,
    stderr: true
  });

  const output2 = logs.toString('utf8');

  // Stop the container after processing
  // await container.stop();
  await container.remove({ force: true });

  console.log('Container stopped and removed');

  const output = output2;
  return output;
};

exports.runInteractiveContainerFullOutputInspect = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  console.log('Container created. Inspecting...');
  let inspect = await container.inspect();
  console.log('Initial state:', inspect.State.Status);

  await container.start();
  console.log('Container started. Inspecting...');
  inspect = await container.inspect();
  console.log('After start state:', inspect.State.Status);

  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let output = '';
  let lastActivityTime = Date.now();

  const outputPromise = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      output += chunk.toString('utf8');
      lastActivityTime = Date.now();
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });
  });

  // Function to periodically check container state
  const checkContainerState = async () => {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

      inspect = await container.inspect();
      const inspectOutput = `While running: ${JSON.stringify(inspect, null, 2)}\n`;

      fs.appendFile('output.txt', inspectOutput, (err) => {
        if (err) throw err;
      });

      if (inspect.State.Status === 'exited' || inspect.State.Status === 'dead') {
        console.log('Container has stopped. Resolving promise.');
        return;
      }

      // Check for inactivity
      if (Date.now() - lastActivityTime > 10000) { // 10 seconds of inactivity
        console.log('No activity detected for 10 seconds. Considering as finished.');
        return;
      }
    }
  };

  // Run the check in parallel with the output promise
  await Promise.race([outputPromise, checkContainerState()]);

  console.log('Final inspection...');
  inspect = await container.inspect();
  console.log('Final state:', inspect.State.Status);

  return { output, container };
};


// const execCommandInContainer = async (container, command) => {
//   const exec = await container.exec({
//     Cmd: ['bash', '-c', command],
//     AttachStdout: true,
//     AttachStderr: true
//   });
//   const stream = await exec.start();
//   let output = '';
//   return new Promise((resolve, reject) => {
//     stream.on('data', (chunk) => {
//       output += chunk.toString('utf8');
//     });
//     stream.on('end', () => {
//       resolve(output);
//     });
//     stream.on('error', reject);
//   });
// };

exports.runXD = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler11',
    Tty: true,
    Cmd: ['bash', '-c', `g++ -o program /usr/src/app/main.cpp && ./program &> /usr/src/app/output.txt`],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();
  console.log('Container started');

  // Retrieve output from the file
  const exec = await container.exec({
    Cmd: ['cat', '/usr/src/app/output.txt'],
    AttachStdout: true,
    AttachStderr: true
  });

  const stream = await exec.start({hijack: true, stdin: true});
  let output = '';

  stream.on('data', (chunk) => {
    output += chunk.toString();
  });

  await new Promise((resolve) => {
    stream.on('end', () => resolve());
  });

  return { output, container };
};

exports.runXDD = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  // Create the container
  const container = await docker.createContainer({
    Image: 'cpp-compiler11',
    Tty: true,
    Cmd: ['bash', '-c', `g++ -o program /usr/src/app/main.cpp`],  // Just compile here
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();
  console.log('Container started');

  // Now run the program separately and pipe the output with 'tee'
  const execRunProgram = await container.exec({
    Cmd: ['bash', '-c', './program | tee /usr/src/app/output.log'], // Run program and use 'tee' here
    AttachStdout: true,
    AttachStderr: true
  });

  // Start the exec and wait for it to complete
  await execRunProgram.start({hijack: true, stdin: true});

  // Fetch the output from the output.log file
  const execFetchLog = await container.exec({
    Cmd: ['cat', '/usr/src/app/output.log'],
    AttachStdout: true,
    AttachStderr: true
  });

  const logStream = await execFetchLog.start({hijack: true, stdin: true});
  let output = '';

  logStream.on('data', (chunk) => {
    output += chunk.toString();
  });

  await new Promise((resolve) => {
    logStream.on('end', () => resolve());
  });

  return { output, container };
};


exports.runWithXD = async (container, input) => {

  let requiresInput = true
  // Attach to the container to send input
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  // Write input to the container and end the stream
  await stream.write(input + '\n');
  await stream.end();

  // Execute the program and capture output to a file using 'tee'
  const exec = await container.exec({
    Cmd: ['bash', '-c', './program | tee /usr/src/app/output.log'],
    AttachStdout: true,
    AttachStderr: true
  });
  await exec.start({ hijack: true });

  // Retrieve and return the output from the file
  const execOutput = await container.exec({
    Cmd: ['cat', '/usr/src/app/output.log'],
    AttachStdout: true,
    AttachStderr: true
  });

  const outputStream = await execOutput.start({ hijack: true });
  let output = '';

  outputStream.on('data', (chunk) => {
    output += chunk.toString();
  });

  await new Promise((resolve) => {
    outputStream.on('end', () => resolve());
  });

  return { output, requiresInput };
};

exports.runIsaIsa = async (container, input, clearLogs = false) => {
  let output = '';
  let waitingForInput = false;
  let requiresInput = true;

  if (clearLogs) {
    try {
      const containerName = container.id;
      execSync(`docker logs ${containerName} --tail 0 > NUL 2>&1`);
      console.log('Logs cleared for container:', containerName);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  const inputTimestamp = Date.now();
  await stream.write(input);
  await stream.write('\n');
  await stream.end();

  await sleep(200);

  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      const timestamp = Date.now();
      
      if (timestamp > inputTimestamp) {
        const formattedChunk = `${chunkString}`;
        output += formattedChunk;
        console.log('Stream output:', formattedChunk);
      }
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      resolve();
    });
  });

  const monitorStackTrace = async () => {
    while (!waitingForInput) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running.');
        waitingForInput = false;
        return;
      } else {
        const logContent = await execCommandInContainer(container, 'cat /tmp/strace.log');
        const lines = logContent.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.includes('read(0,' || lastLine.includes('EAGAIN'))) {
          console.log('The last line of the log indicates the process might be waiting for input.');
          waitingForInput = true;
          return;
        }
        // console.log('Log content:', logContent);
        // if (logContent.includes('read(0,') || logContent.includes('EAGAIN')) {
        //   console.log('Process is likely waiting for input.');
        //   waitingForInput = true;
        //   return;
        // }
      }
    }
  };

  await Promise.all([captureOutput, monitorStackTrace()]);

  await stream.destroy();

  if (waitingForInput) {
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
  } else {
    await sleep(200);
    console.log('Fetching the logs.');
    const logs = await container.logs({
      stdout: true,
      stderr: true
    });
    output = logs.toString('utf8');
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, requiresInput };
};

exports.runn00b = async (code) => {
  let output = '';
  let waitingForInput = false;

  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler11',
    Tty: true,
    Cmd: ['bash', '-c', `g++ -o program /usr/src/app/main.cpp && strace -o /tmp/strace.log ./program`],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false,
    Tty: true
  });

  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  await container.start();

  const outputPromise = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      output += chunk.toString('utf8');
      console.log('Stream output:', chunk.toString('utf8'));
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });
  });

  const checkStraceLog = async () => {
    while (!waitingForInput) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running.');
        waitingForInput = false;
        return;
      } else {
        const logContent = await execCommandInContainer(container, 'cat /tmp/strace.log');
        const lines = logContent.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine.includes('read(0,' || lastLine.includes('EAGAIN'))) {
          console.log('The last line of the log indicates the process might be waiting for input.');
          waitingForInput = true;
          return;
        }
        // console.log('Log content:', logContent);
        // if (logContent.includes('read(0,') || logContent.includes('EAGAIN')) {
        //   console.log('Process is likely waiting for input.');
        //   waitingForInput = true;
        //   return;
        // }
      }
    }
  };

  await Promise.race([outputPromise, checkStraceLog()]);

  await stream.destroy();

  if (waitingForInput) {
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
  } else {
    await sleep(200);
    console.log('Fetching the logs.');
    const logs = await container.logs({
      stdout: true,
      stderr: true
    });
    output = logs.toString('utf8');
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, container };
};

// exports.runWithInput = async (container, input) => {

//   let output = '';
//   let waitingForInput = false;
//   let requiresInput = true;

//   // Attach to the container to capture logs and send input
//   const stream = await container.attach({
//     stream: true,
//     stdin: true,
//     stdout: true,
//     stderr: true,
//     logs: true,
//     hijack: true
//   });

//   // Function to write input to the container
//   const writeInput = () => {
//     return new Promise((resolve) => {
//       stream.write(input + '\n');
//       stream.end(); // End the input stream
//       resolve();
//     });
//   };

//   // Function to capture container output
//   const outputPromise = new Promise((resolve) => {
//     stream.on('data', (chunk) => {
//       output += chunk.toString('utf8');
//       console.log('Stream output:', chunk.toString('utf8')); // Log stream output
//     });

//     stream.on('end', () => {
//       console.log('Stream ended');
//       resolve();
//     });
//   });

//   // Function to check strace log for input waiting status
//   const checkStraceLog = async () => {
//     while (true) {
//       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

//       const logContent = await execCommandInContainer(container, 'cat /tmp/strace.log');
//       if (logContent.includes('read(')) {
//         console.log('Process is waiting for input.');
//         waitingForInput = true;
//         return;
//       }
//     }
//   };

//   // Write input to the container and then check for input waiting status
//   await writeInput();
//   await Promise.race([outputPromise, checkStraceLog()]);

//   if (waitingForInput) {
//     // Process is waiting for more input; return output
//     console.log('Returning output as the process is waiting for more input.');
//     requiresInput = true;
//     return { output, requiresInput };
//   }

//   // If not waiting for input, final inspection
//   console.log('Final inspection...');
//   inspect = await container.inspect();
//   console.log('Final state:', inspect.State.Status);
//   requiresInput = true;

//   return { output, requiresInput };
// };

exports.runIsa = async (container, input) => {
  let output = '';
  let waitingForInput = false;
  let requiresInput = true;

  // Attach to the container to capture logs and send input
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  // Write input to the container and capture the timestamp
  const inputTimestamp = Date.now();
  await stream.write(input + '\n');
  await stream.end(); // End the input stream immediately

  // Function to capture container output
  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      const timestamp = Date.now();
      
      // Only add output that comes after the input was sent
      if (timestamp > inputTimestamp) {
        const formattedChunk = `${chunkString}`;
        output += formattedChunk;
        console.log('Stream output:', formattedChunk); // Log stream output
      }
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      resolve(); // Resolve even if there's an error to proceed
    });
  });

  // Function to monitor stack trace log
  const monitorStackTrace = async () => {
    while (!waitingForInput) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Check every 500ms
      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running.');
        return;
      } else {
        const logContent = await execCommandInContainer(container, 'cat /tmp/strace.log');
        if (logContent.includes('read(0, ') || logContent.includes('EAGAIN')) {
          console.log('Process is likely waiting for input.');
          waitingForInput = true;
          return;
        }
      }
    }
  };

  // Start capturing output and monitoring stack trace concurrently
  await Promise.all([captureOutput, monitorStackTrace()]);

  console.log('yo' + output + 'yo');

  stream.destroy();

  if (waitingForInput) {
    // Trim initialization message from output
    output = output.replace(INITIALIZATION_MESSAGE, '');
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
  } else {
    console.log('Final inspection...');
    const inspect = await container.inspect();
    console.log('Final state:', inspect.State.Status);
    requiresInput = false;
  }

  // Trim initialization message from output
  output = output.replace(INITIALIZATION_MESSAGE, '');

  return { output, requiresInput };
};

exports.runWithInput = async (container, input) => {

  let output = '';
  let waitingForInput = false;
  let requiresInput = true;
  var outputList = [];

  // Attach to the container to capture logs and send input
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  // Write input to the container
  await stream.write(input + '\n');
  await stream.end(); // End the input stream immediately

  let hey = await stream.pipe(process.stdout);
  console.log('no: ', hey)

  // Function to capture container output
  const captureOutput = new Promise((resolve) => {

    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      outputList.push(chunkString);
      console.log('Stream output:', chunkString); // Log stream output
      console.log ('list: ', outputList);
    });

    // stream.on('data', (chunk) => {
    //   output += chunk.toString('utf8');
    //   console.log('Stream output:', chunk.toString('utf8')); // Log stream output
    // });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      resolve(); // Resolve even if there's an error to proceed
    });
  });

  // Function to monitor stack trace log
  const monitorStackTrace = async () => {
    while (!waitingForInput) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Check every 100ms
      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running.');
        return;
      } else {
        const logContent = await execCommandInContainer(container, 'cat /tmp/strace.log');
        if (logContent.includes('read(0, ') || logContent.includes('EAGAIN')) {
          console.log('Process is likely waiting for input.');
          waitingForInput = true;
          return;
        }
      }
    }
  };

  // Start capturing output and monitoring stack trace concurrently
  await Promise.all([captureOutput, monitorStackTrace()]);

  if (waitingForInput) {

    stream.destroy();

    output = outputList[0];
    // Process is waiting for more input; return output
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
    // Trim initialization message from output
    console.log('yo' + output + 'yo');
    output = output.replace(INITIALIZATION_MESSAGE, '');
    return { output, requiresInput };
  }

  stream.destroy();

  output = outputList[0];
  // If not waiting for input, final inspection
  console.log('Final inspection...');
  const inspect = await container.inspect();
  console.log('Final state:', inspect.State.Status);
  requiresInput = true;
  console.log('yo' + output + 'yo');

  // Trim initialization message from output
  output = output.replace(INITIALIZATION_MESSAGE, '');

  return { output, requiresInput };
};

const execCommandInContainer = async (container, cmd) => {
  try {
    const exec = await container.exec({
      Cmd: ['bash', '-c', cmd],
      AttachStdout: true,
      AttachStderr: true,
    });

    return new Promise((resolve, reject) => {
      exec.start((err, stream) => {
        if (err) {
          return reject(err);
        }

        let output = '';
        stream.on('data', (chunk) => {
          output += chunk.toString('utf8');
        });

        stream.on('end', () => {
          resolve(output);
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    });
  } catch (error) {
    console.error('Error executing command in container:', error);
    // return '';
    throw error;
  }
};

exports.runCPU = async (container, input, clearLogs = false) => {
  let output = '';
  let requiresInput = true;

  // Clear logs if requested
  if (clearLogs) {
    try {
      const containerName = container.id;
      execSync(`docker logs ${containerName} --tail 0 > NUL 2>&1`);
      console.log('Logs cleared for container:', containerName);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  // Attach to the container to capture logs and send input
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let inspect = await container.inspect();
  console.log('Initial state:', inspect.State.Status);

  // Write input to the container and capture the timestamp
  const inputTimestamp = Date.now();
  await stream.write(input + '\n');
  await stream.end(); // End the input stream immediately

  // Function to capture container output
  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      const timestamp = Date.now();
      
      if (timestamp > inputTimestamp) {
        const formattedChunk = `${chunkString}`;
        output += formattedChunk;
        console.log('Stream output:', formattedChunk);
      }
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      resolve();
    });
  });

  // Function to monitor CPU usage
  const monitorCPUUsage = async () => {
    let stableCPUCount = 0;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
      const stats = await container.stats({ stream: false });
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
      
      console.log(`Current CPU usage: ${cpuPercent.toFixed(3)}%`);

      if (cpuPercent < 0.01) { // Consider CPU usage below 0.01% as idle
        requiresInput = true;
        return;
        stableCPUCount++;
        if (stableCPUCount >= 10) { // If CPU is stable for 1 second (10 * 100ms)
          console.log('CPU usage stable at near 0%. Assuming process is waiting for input.');
          requiresInput = true;
          return;
        }
      } else {
        stableCPUCount = 0;
      }

      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running. Process has likely completed.');
        requiresInput = false;
        return;
      }
    }
  };

  // Start capturing output and monitoring CPU usage concurrently
  await Promise.all([captureOutput, monitorCPUUsage()]);

  console.log('Final inspection...');
  const finalInspect = await container.inspect();
  console.log('Final state:', finalInspect.State.Status);

  // Trim initialization message from output
  output = output.replace(INITIALIZATION_MESSAGE, '');

  return { output, requiresInput };
};

exports.runNewIsa = async (container, input, clearLogs = false) => {
  let output = '';
  let requiresInput = false;

  // Clear logs if requested
  if (clearLogs) {
    try {
      const containerName = container.id;
      execSync(`docker logs ${containerName} --tail 0 > NUL 2>&1`);
      console.log('Logs cleared for container:', containerName);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  // Attach to the container to capture logs and send input
  const stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let inspect = await container.inspect();
  console.log('Initial state:', inspect.State.Status);

  // Write input to the container and capture the timestamp
  const inputTimestamp = Date.now();
  await stream.write(input + '\n');
  await stream.end(); // End the input stream immediately

  // Function to capture container output
  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      const timestamp = Date.now();
      
      if (timestamp > inputTimestamp) {
        const formattedChunk = `${chunkString}`;
        output += formattedChunk;
        console.log('Stream output:', formattedChunk);
      }
    });

    stream.on('end', () => {
      console.log('Stream ended');
      resolve();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      resolve();
    });
  });

  // Function to monitor process state
  const monitorProcessState = async () => {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms

      const processInfo = await execCommandInContainer(container, 'ps -o pid,state --no-headers');
      console.log('Process info:', processInfo);

      const lines = processInfo.trim().split('\n');
      if (lines.length > 1) {
        const [pid, state] = lines[1].trim().split(/\s+/);
        console.log(`PID: ${pid}, State: ${state}`);

        if (state === 'S' || state === 'D') {
          console.log('Process is in sleep state. Likely waiting for input.');
          requiresInput = true;
          return;
        } else if (state === 'Z' || state === 'X' || state === 'T') {
          console.log('Process has stopped or is a zombie. Execution likely complete.');
          requiresInput = false;
          return;
        }
        // If process state is 'R' (running), continue monitoring
      } else {
        console.log('No user processes found. Execution likely complete.');
        requiresInput = false;
        return;
      }

      const inspect = await container.inspect();
      if (inspect.State.Status !== 'running') {
        console.log('Container is not running. Process has completed.');
        requiresInput = false;
        return;
      }
    }
  };

  // Start capturing output and monitoring process state concurrently
  await Promise.all([captureOutput, monitorProcessState()]);

  console.log('Final inspection...');
  const finalInspect = await container.inspect();
  console.log('Final state:', finalInspect.State.Status);

  // Trim initialization message from output
  output = output.replace(INITIALIZATION_MESSAGE, '');

  return { output, requiresInput };
};

exports.runTrial = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let output = '';
  let isWaitingForInput = false;

  const outputPromise = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      output += chunk.toString('utf8');
    });

    stream.on('end', () => {
      resolve();
    });
  });

  // Function to check process state
  const checkProcessState = async () => {
    while (!isWaitingForInput) {
      try {
        const { stdout } = await execAsync(`docker exec ${container.id} ps -o stat= -p 1`);
        console.log(stdout);
        const state = stdout.trim();
        console.log(`Process state: ${state}`);

        // Check if the process is in a sleeping state (S or S+)
        if (state.startsWith('S')) {
          isWaitingForInput = true;
          console.log('Program is waiting for input.');
        } else {
          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error checking process state:', error);
        break;
      }
    }
  };

  // Start monitoring process state
  checkProcessState();

  // Wait for the process to be in the input-waiting state or for the stream to end
  await Promise.race([
    new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (isWaitingForInput) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }),
    outputPromise
  ]);

  // Final container inspection
  const inspect = await container.inspect();
  console.log('Final state:', inspect.State.Status);

  // Don't remove the container here, as it's still running and waiting for input
  // await container.remove({ force: true });

  return { output, container };
};

exports.runInteractiveContainerFullOutput = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let output = '';

  const outputPromise = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      output += chunk.toString('utf8');
    });

    stream.on('end', () => {
      resolve();
    });
  });

  // Ensure all output has been collected
  await outputPromise;

  return { output, container };
};

exports.runInteractiveContainerFirstOutput = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  let output = '';

  const dataPromise = new Promise((resolve) => {
    const dataHandler = (chunk) => {
      output += chunk.toString('utf8');
      if (output.trim() !== '') {
        stream.removeListener('data', dataHandler);
        resolve();
      }
    };
    stream.on('data', dataHandler);
  });

  await dataPromise;

  return { output, container };
};

exports.runInteractiveContainerContinuousOutput = async (container, input) => {

  // let output = '';
  let requiresInput = true;

  let stream = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true,
    logs: true,
    hijack: true
  });

  stream.write(`${input}\n`);

  // Collect all output
  const dataPromise = new Promise((resolve) => {
    let dataBuffer = '';

    const dataHandler = (chunk) => {
      dataBuffer += chunk.toString('utf8');
    };

    stream.on('data', dataHandler);

    // Define a function to check if the container has finished
    const checkContainerStatus = async () => {
      const containerInfo = await container.inspect();
      const containerState = containerInfo.State;
      const isStopped = containerState.Status === 'exited' || containerState.Status === 'dead';

      if (isStopped) {
        stream.removeListener('data', dataHandler);
        resolve(dataBuffer);
        await container.wait();
        console.log('Fetching logs...');
        const logs = await container.logs({
          stdout: true,
          stderr: true
        });
        output = logs.toString('utf8');
        // await container.remove({ force: true });
        requiresInput = false;
        container.remove({ force: true });
      } else {
        // Continue checking container status
        setTimeout(checkContainerStatus, 200);
      }
    };

    checkContainerStatus();
  });

  let output = await dataPromise;
  // stream.end();

  // const dataPromise = new Promise((resolve) => {
  //   const dataHandler = (chunk) => {
  //     output += chunk.toString('utf8');
  //     if (output.trim() !== '') {
  //       stream.removeListener('data', dataHandler);
  //       resolve();
  //     }
  //   };
  //   stream.on('data', dataHandler);
  // });

  // await dataPromise;

  // // await sleep(200);

  // const containerInfo = await container.inspect();
  // const containerState = containerInfo.State;
  // const isStopped = containerState.Status === 'exited' || containerState.Status === 'dead';

  // if(isStopped) {
  //   await container.wait();
  //   console.log('Fetching logs...');
  //   const logs = await container.logs({
  //     stdout: true,
  //     stderr: true
  //   });
  //   output = logs.toString('utf8');
  //   await container.remove({ force: true });
  //   requiresInput = false;
  //   container.remove({ force: true });
  // }

  return { output, requiresInput };
};

exports.runSexyContainer = async (code, input) => {
  const { tmpDir, filePath } = await createTempFile(code);
  const outputPath = path.join(tmpDir, 'output.txt');
  const partialOutputPath = path.join(tmpDir, 'partial_output.txt');

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['/bin/bash'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  const exec = await container.exec({
    Cmd: ['bash', '-c', 'g++ -o /usr/src/app/program /usr/src/app/main.cpp && /usr/src/app/program > /usr/src/app/output.txt'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true
  });

  await exec.start();
  await exec.inspect();

  const inputExec = await container.exec({
    Cmd: ['bash', '-c', `echo "${input}" > /usr/src/app/input.txt`],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true
  });

  await inputExec.start();
  await inputExec.inspect();

  const partialExec = await container.exec({
    Cmd: ['bash', '-c', 'tail -f /usr/src/app/output.txt > /usr/src/app/partial_output.txt'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true
  });

  await partialExec.start();
  await partialExec.inspect();

  // Ensure the file exists before trying to get it
  try {
    const getFileFromContainer = async (filePath) => {
      const archiveStream = await container.getArchive({ path: filePath });
      const extractStream = tar.extract({ cwd: tmpDir });
      archiveStream.pipe(extractStream);
      return new Promise((resolve, reject) => {
        extractStream.on('finish', () => resolve(path.join(tmpDir, path.basename(filePath))));
        extractStream.on('error', reject);
      });
    };

    // Wait for file creation and retrieval
    await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust time as needed

    await getFileFromContainer('/usr/src/app/output.txt');
    await getFileFromContainer('/usr/src/app/partial_output.txt');

    // Read and return the contents
    const outputContent = fsM.readFileSync(outputPath, 'utf8');
    const partialOutputContent = fsM.readFileSync(partialOutputPath, 'utf8');

    return { outputContent, partialOutputContent };
  } catch (error) {
    console.error('Error retrieving files:', error);
    throw error;
  } finally {
    await container.remove({ force: true }); // Cleanup
  }
};

exports.runContainer = async (code, input) => {
  // Use os.tmpdir() for a cross-platform temporary directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cpp-'));
  const filePath = path.join(tmpDir, 'main.cpp');
  await fs.writeFile(filePath, code);

  // Convert Windows path to Docker-compatible path
  const dockerPath = tmpDir.split(path.sep).join('/');

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    WorkingDir: '/usr/src/app',
    HostConfig: {
      Binds: [`${dockerPath}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false,
    Tty: false
  });

  await container.start();

  const stream = await container.attach({stream: true, stdin: true, stdout: true, stderr: true});

  // Write input to stdin
  stream.write(input);
  stream.end();

  // Collect output
  const output = await streamPromise(stream);

  await container.stop();
  await container.remove();

  return output.toString();
};

exports.runInteractiveeeContainer = async (code, input) => {
  const { tmpDir, filePath } = await createTempFile(code);
  const outputPath = path.join(tmpDir, 'output.txt');
  const partialOutputPath = path.join(tmpDir, 'partial_output.txt');

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: true,
    Cmd: ['/bin/bash'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    },
    OpenStdin: true,
    StdinOnce: false
  });

  await container.start();

  // Compile and run the code
  const exec = await container.exec({
    Cmd: ['bash', '-c', 'g++ -o /usr/src/app/program /usr/src/app/main.cpp && /usr/src/app/program > /usr/src/app/output.txt'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true
  });

  await exec.start();
  await exec.inspect();

  // Provide input directly to the container’s stdin
  const containerStdin = await container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true
  });

  containerStdin.write(input + '\n');
  containerStdin.end();

  // Capture output to partial_output.txt
  const partialExec = await container.exec({
    Cmd: ['bash', '-c', 'tail -f /usr/src/app/output.txt > /usr/src/app/partial_output.txt'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true
  });

  await partialExec.start();
  await partialExec.inspect();

  // Ensure the file exists before trying to get it
  try {
    const getFileFromContainer = async (filePath) => {
      const archiveStream = await container.getArchive({ path: filePath });
      const extractStream = tar.extract({ cwd: tmpDir });
      archiveStream.pipe(extractStream);
      return new Promise((resolve, reject) => {
        extractStream.on('finish', () => resolve(path.join(tmpDir, path.basename(filePath))));
        extractStream.on('error', reject);
      });
    };

    // Wait for file creation and retrieval
    await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust time as needed

    await getFileFromContainer('/usr/src/app/output.txt');
    await getFileFromContainer('/usr/src/app/partial_output.txt');

    // Read and return the contents
    const outputContent = fsM.readFileSync(outputPath, 'utf8');
    const partialOutputContent = fsM.readFileSync(partialOutputPath, 'utf8');

    return { outputContent, partialOutputContent };
  } catch (error) {
    console.error('Error retrieving files:', error);
    throw error;
  } finally {
    await container.remove({ force: true }); // Cleanup
  }
};


exports.runOneTimeContainer = async (code) => {
  const { tmpDir, filePath } = await createTempFile(code);

  console.log('Temporary files created:');
  console.log(`Temporary directory: ${tmpDir}`);
  console.log(`Temporary file: ${filePath}`);

  const outputPath = `${tmpDir}/output.txt`;

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: false,
    Cmd: ['bash', '-c', `g++ -o /usr/src/app/program /usr/src/app/main.cpp && /usr/src/app/program > /usr/src/app/output.txt`],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    }
  });

  console.log('Container created.');

  await container.start();
  console.log('Container started.');

  await container.wait();
  console.log('Container finished executing.');

  // Read the output file directly from the mounted volume
  const output = await fs.readFile(outputPath, 'utf8');
  console.log('Output content:', output);

  await container.remove({ force: true });
  console.log('Container removed.');

  await fs.unlink(filePath);
  console.log(`Temporary file removed: ${filePath}`);

  await fs.unlink(outputPath);
  console.log(`Output file removed: ${outputPath}`);

  return output;
};