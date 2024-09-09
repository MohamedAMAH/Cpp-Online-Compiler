const Docker = require('dockerode');
const fsM = require('fs');
const docker = new Docker();
const path = require('path');
const { promisify } = require('util');
const { execSync } = require('child_process');
const sleep = promisify(setTimeout);
const INITIALIZATION_MESSAGE = '{"stream":true,"stdin":true,"stdout":true,"stderr":true,"logs":true,"hijack":true}';
const regex = new RegExp(INITIALIZATION_MESSAGE, 'g');

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

exports.startContainerExec = async (code) => {
  let output = '';
  let waitingForInput = false;

  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler11',
    Tty: true,
    Cmd: ['bash', '-c', `g++ -o program /usr/src/app/main.cpp && strace -o /tmp/strace.log ./program`],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`],
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
      }
    }
  };

  await Promise.race([outputPromise, checkStraceLog()]);

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
    await container.remove({ force: true });
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, container, stream };
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
    throw error;
  }
};

exports.ContinueContainerExec = async (container, input, stream, clearLogs = false) => {
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

  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      output += chunkString;
      console.log('Stream output:', chunkString);
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
      await new Promise(resolve => setTimeout(resolve, 500));
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
      }
    }
  };

  await stream.write(input);
  await stream.write('\n');
  await sleep(200);

  await Promise.race([captureOutput, monitorStackTrace()]);

  if (waitingForInput) {
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
  } else {
    await sleep(200);
    console.log('Fetching the logs.');
    const logs = await container.logs({
      stdout: true,
      stderr: true,
    });
    output = logs.toString('utf8');
    await container.remove({ force: true });
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, requiresInput };
};

exports.startContainerExec22 = async (code) => {
  let output = '';
  let waitingForInput = false;

  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler11',
    Tty: true,
    Cmd: ['bash', '-c', `g++ -o program /usr/src/app/main.cpp && strace -o /tmp/strace.log ./program`],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`],
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
      }
    }
  };

  await Promise.race([outputPromise, checkStraceLog()]);

  if (waitingForInput) {
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
    await container.pause();
  } else {
    await sleep(200);
    console.log('Fetching the logs.');
    const logs = await container.logs({
      stdout: true,
      stderr: true
    });
    output = logs.toString('utf8');
    await container.remove({ force: true });
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, container, stream };
};

exports.ContinueContainerExec22 = async (container, input, stream, clearLogs = false) => {
  let output = '';
  let waitingForInput = false;
  let requiresInput = true;

  await container.unpause();

  if (clearLogs) {
    try {
      const containerName = container.id;
      execSync(`docker logs ${containerName} --tail 0 > NUL 2>&1`);
      console.log('Logs cleared for container:', containerName);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  const captureOutput = new Promise((resolve) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString('utf8');
      output += chunkString;
      console.log('Stream output:', chunkString);
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
      await new Promise(resolve => setTimeout(resolve, 500));
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
      }
    }
  };

  await stream.write(input);
  await stream.write('\n');
  await sleep(200);

  await Promise.race([captureOutput, monitorStackTrace()]);

  if (waitingForInput) {
    console.log('Returning output as the process is waiting for more input.');
    requiresInput = true;
    await container.pause();
  } else {
    await sleep(200);
    console.log('Fetching the logs.');
    const logs = await container.logs({
      stdout: true,
      stderr: true,
    });
    output = logs.toString('utf8');
    await container.remove({ force: true });
    requiresInput = false;
  }

  output = output.replace(regex, '');

  return { output, requiresInput };
};