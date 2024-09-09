const Docker = require('dockerode');
const docker = new Docker();

async function cleanupInactiveContainers(pauseThreshold = 3 * 60 * 1000) { // 30 minutes by default
    try {
      const containers = await docker.listContainers({ 
        all: true, 
        filters: { status: ['paused', 'exited'] } 
      });
      
      for (const containerInfo of containers) {
        const container = docker.getContainer(containerInfo.Id);
        const inspectInfo = await container.inspect();
        
        // Get the container's state change time
        const stateChangeTime = new Date(inspectInfo.State.StartedAt).getTime();
        
        // Check if the container has been paused for longer than the threshold
        if (Date.now() - stateChangeTime > pauseThreshold) {
          console.log(`Removing long-paused container: ${containerInfo.Id}`);
          await container.remove({ force: true });
        }
      }
    } catch (error) {
      console.error('Error during paused container cleanup:', error);
    }
  }

const CLEANUP_INTERVAL = 2 * 60 * 1000;
setInterval(cleanupInactiveContainers, CLEANUP_INTERVAL);

module.exports = {
  cleanupInactiveContainers
};