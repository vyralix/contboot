const Docker = require('dockerode');
const winston = require('winston');
const docker = new Docker();

const DEFAULT_TIMEOUT = 60; // Default timeout in seconds
const CHECK_INTERVAL = 3000; // Default check interval in milliseconds (3 seconds)

// Configure winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss:SSS'
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

function formatDuration(duration) {
  return `${duration} ms`;
}

function shortId(id) {
  return id.substring(0, 12);
}

async function checkDockerAvailable() {
  while (true) {
    try {
      await docker.ping();
      logger.info('Docker is available.');
      return;
    } catch (error) {
      logger.warn('Docker is not available. Retrying in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }
}

async function getContainers() {
  try {
    const containers = await docker.listContainers({ all: true });
    const filteredContainers = [];
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      const data = await container.inspect();
      if (data.HostConfig.RestartPolicy.Name === 'always') {
        filteredContainers.push({
          id: shortId(containerInfo.Id),
          name: containerInfo.Names[0],
          status: data.State.Status
        });
      }
    }
    logger.info(`Found ${filteredContainers.length} containers with restart policy 'always'.`);
    return filteredContainers;
  } catch (error) {
    logger.error(`Error getting containers: ${error.message}`);
    throw error;
  }
}

async function startContainer(container) {
  try {
    const containerInstance = docker.getContainer(container.id);
    logger.info(`Attempting to start container: ${container.name} (${container.id})`);
    await containerInstance.start();
    logger.info(`Started container: ${container.name} (${container.id})`);
  } catch (error) {
    logger.error(`Failed to start container ${container.name} (${container.id}): ${error.message}`);
  }
}

async function monitorContainer(container, timeout) {
  const containerInstance = docker.getContainer(container.id);
  const endTime = Date.now() + timeout * 1000;

  while (Date.now() < endTime) {
    const data = await containerInstance.inspect();
    logger.info(`Container ${container.name} (${container.id}) status: ${data.State.Status}`);
    if (data.State.Running) {
      logger.info(`Container ${container.name} (${container.id}) is running.`);
      return;
    }
    logger.warn(`Container ${container.name} (${container.id}) is not running. Retrying in 10 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  logger.error(`Failed to start container ${container.name} (${container.id}) within ${timeout} seconds.`);
}

async function main() {
  const startTime = Date.now();
  logger.info('Starting docker-bootwatch...');

  const timeout = process.argv[2] ? parseInt(process.argv[2], 10) : DEFAULT_TIMEOUT;
  if (isNaN(timeout) || timeout <= 0) {
    logger.error('Invalid timeout value');
    return;
  }

  await checkDockerAvailable();

  const containers = await getContainers();
  let startedContainers = 0;
  let failedContainers = 0;

  for (const container of containers) {
    logger.info(`Inspecting container ${container.name} (${container.id})`);

    if (container.status !== 'running') {
      logger.info(`Container ${container.name} (${container.id}) is not running. Status: ${container.status}`);
      await startContainer(container);
      await monitorContainer(container, timeout);

      const data = await docker.getContainer(container.id).inspect();
      logger.info(`Post-start inspection for container ${container.name} (${container.id}) - Status: ${data.State.Status}`);
      if (data.State.Running) {
        startedContainers++;
      } else {
        failedContainers++;
      }
    } else {
      logger.info(`Container ${container.name} (${container.id}) is already running. Status: ${container.status}`);
    }
  }

  const endTime = Date.now();
  const duration = formatDuration(endTime - startTime);

  logger.info('Ending docker-bootwatch...');
  logger.info(`Summary:`);
  logger.info(`  Started containers: ${startedContainers}`);
  logger.info(`  Failed containers: ${failedContainers}`);
  logger.info(`  Execution time: ${duration}`);
}

main().catch(error => {
  logger.error(`Error: ${error.message}`);
});
