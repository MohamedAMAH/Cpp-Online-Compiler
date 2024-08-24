const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const docker = new Docker();
const pattern = /01000000000000.{2}/g;

const createTempFile = async (code) => {
  const tmpDir = path.join(__dirname, '../temp');
  await fs.mkdir(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'main.cpp');
  await fs.writeFile(filePath, code);
  return { tmpDir, filePath };
};

exports.runOneTimeContainer = async (code) => {
    const { tmpDir, filePath } = await createTempFile(code);

    const container = await docker.createContainer({
        Image: 'cpp-compiler',
        Tty: false,
        Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
        HostConfig: {
            Binds: [`${tmpDir}:/usr/src/app`]
        }
    });

    await container.start();
    await container.wait();

    const logs = await container.logs({
        stdout: true,
        stderr: true
    });

    let output = logs.toString('hex');
    output = output.replace(pattern, '');
    const cleanOutput = Buffer.from(output, 'hex').toString('utf8');
    
    await container.remove({ force: true });
    await fs.unlink(filePath);
    
    return cleanOutput;
};


exports.runPersistentContainer = async (code, sessionID) => {
  const { tmpDir, filePath } = await createTempFile(code);

  const container = await docker.createContainer({
    Image: 'cpp-compiler',
    Tty: false,
    Cmd: ['bash', '-c', 'g++ -o program main.cpp && ./program'],
    HostConfig: {
      Binds: [`${tmpDir}:/usr/src/app`]
    }
  });

  await container.start();
  await container.wait();

  const logs = await container.logs({
    stdout: true,
    stderr: true,
  });

  let output = logs.toString('hex');
  output = output.replace(pattern, '');
  const cleanOutput = Buffer.from(output, 'hex').toString('utf8');

  return { container, cleanOutput, filePath };
};

async function getContainerLogs(container) {
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true
  });

  return new Promise((resolve, reject) => {
    let output = '';
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });
    stream.on('end', () => {
      resolve(output.trim());
    });
    stream.on('error', reject);
  });
}