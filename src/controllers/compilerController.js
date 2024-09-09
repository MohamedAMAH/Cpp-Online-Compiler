const { codeRequiresInput } = require('../utils/codeChecker');
const { generateCodeHash } = require('../utils/codeHasher');
const { startContainerExec22, ContinueContainerExec22 } = require('../services/docker');

const activeContainers = {};

exports.run = async (req, res) => {
  const sessionID = req.headers['session-id'];
  const code = req.body.code;

  if (!code || !sessionID) {
    return res.status(400).json({ error: 'No code or session ID provided' });
  }

  try {
    const requiresInput = codeRequiresInput(code);
    const currentCodeHash = generateCodeHash(code);
    let output = ''
    if (requiresInput) {
      if (activeContainers[sessionID] && activeContainers[sessionID].codeHash === currentCodeHash) {
        cleanupSession(sessionID);
        const result = await startContainerExec22(code);
          output = result.output;
          activeContainers[sessionID] = { 
            container: result.container, 
            stream: result.stream,
            codeHash: currentCodeHash
          };
      } else if (activeContainers[sessionID] && activeContainers[sessionID].codeHash !== currentCodeHash) {
          cleanupSession(sessionID);
          const result = await startContainerExec22(code);
          output = result.output;
          activeContainers[sessionID] = { 
            container: result.container, 
            stream: result.stream,
            codeHash: currentCodeHash
          };
      } else {
          const result = await startContainerExec22(code);
          output = result.output;
          activeContainers[sessionID] = { 
            container: result.container, 
            stream: result.stream,
            codeHash: currentCodeHash
          };
      }
      res.json({ output, requiresInput: requiresInput });
    } else {
      const output = await startContainerExec22(code);
      res.json({ output: output.output, requiresInput: false });
    }
  } catch (error) {
    console.error('Error running the code:', error);
    res.status(500).json({ error: 'Error running the code' });
  }
};

exports.handleInput = async (req, res) => {
  const sessionID = req.headers['session-id'];
  const input = req.body.input;
  let requiresInput = false
  try {
    if (activeContainers[sessionID]) {
      const { container, stream } = activeContainers[sessionID];
      ({ output, requiresInput } = await ContinueContainerExec22(container, input, stream, false));
    } else {
      res.status(400).json({ error: 'Error processing input. Please refresh and try again.' });
    }
    res.json({ output, requiresInput });
    console.log(`Output sent to the client.`);
  } catch (error) {
    console.error(`Error processing input:`, error);
    res.status(500).json({ error: 'Error processing input' });
  }
};

exports.cleanup = async (req, res) => {
    const sessionID = req.headers['session-id'];
    if (activeContainers[sessionID]) {
      try {
        await activeContainers[sessionID].container.remove({ force: true });
        if (activeContainers[sessionID].stream) {
          console.log('hello niggas');
          activeContainers[sessionID].stream.destroy();
        }
        delete activeContainers[sessionID];
        res.json({ message: 'Container and stream removed successfully' });
      } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ error: 'Error during cleanup' });
      }
    } else {
      res.status(404).json({ message: 'No container found for this session' });
    }
};


async function cleanupSession(sessionID) {
  try {
    await activeContainers[sessionID].container.remove({ force: true });
    if (activeContainers[sessionID].stream) {
      activeContainers[sessionID].stream.destroy();
    }
    delete activeContainers[sessionID];
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}