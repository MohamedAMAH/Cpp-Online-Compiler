const { codeRequiresInput } = require('../utils/codeChecker');
const { runOneTimeContainer, runPersistentContainer, runn00b, runCodeWithInput, runInteractiveContainerContinuousOutput, runContainerWithInput, runOneTimeContainerWithInput, sendInputToContainer, runOneTimeContainerPartialOutput, runContainerWithInputList, runOneTimeContainerWithMultipleInputs, runInteractiveContainer, run7oda, runInteractiveContainerFirstOutput, runSexyContainer, runInteractiveeeContainer, runContainer, runlolContainer, runNewContainer, runInteractiveContainerFullOutput, runInteractiveContainerFullOutputInspect, runTrial, runWithInput } = require('../services/docker');
const fs = require('fs').promises;
const stream = require('stream');
const pattern = /01000000000000.{2}/g;

const activeContainers = {}; // This can be replaced with a more persistent storage if needed

exports.run = async (req, res) => {
  const sessionID = req.headers['session-id'];
  const code = req.body.code;

  if (!code || !sessionID) {
    return res.status(400).json({ error: 'No code or session ID provided' });
  }

  try {
    let requiresInput = codeRequiresInput(code);
    const input = 'Hey'
    if (requiresInput) {
      if (activeContainers[sessionID]) {
        // container = activeContainers[sessionID];
        // ({ output, requiresInput } = await runWithInput(container, input));
      } else {
          ({ output, container } = await runn00b(code));
          activeContainers[sessionID] = container;
      }
      res.json({ output, requiresInput: requiresInput });
    } else {
      const output = await runOneTimeContainer(code);
      // const output = await runInteractiveContainerFullOutput(code);
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
      container = activeContainers[sessionID];
      ({ output, requiresInput } = await runWithInput(container, input));
    } else {
      res.status(400).json({ error: 'Error processing input. Please refresh and try again.' });
      // ({ output, container } = await runInteractiveContainerFirstOutput(code));
      // activeContainers[sessionID] = container;
    }
      res.json({ output, requiresInput });
      console.log(`Output sent to the client.`);
  } catch (error) {
    console.error(`Error processing input:`, error);
    res.status(500).json({ error: 'Error processing input' });
  }
};

// exports.cleanup = async (req, res) => {
//     const sessionID = req.headers['session-id'];
//     if (activeContainers[sessionID]) {
//       try {
//         await activeContainers[sessionID].remove({ force: true });
//         delete activeContainers[sessionID];
  
//         if (userFiles[sessionID]) {
//           await fs.unlink(userFiles[sessionID]);
//           delete userFiles[sessionID];
//         }
  
//         res.json({ message: 'Container and associated files removed successfully' });
//       } catch (error) {
//         console.error('Error during cleanup:', error);
//         res.status(500).json({ error: 'Error during cleanup' });
//       }
//     } else {
//       res.status(404).json({ message: 'No container found for this session' });
//     }
// };

// exports.clear = (req, res) => {
//     console.log('Clear function called');
//     res.json({ message: 'Output cleared', output: '' });
// };