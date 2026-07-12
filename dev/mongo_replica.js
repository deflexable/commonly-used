import { exec } from 'child_process';

// execute this file in ubuntu as: "sudo bash -c node mongo_replica.js"
const isMac = process.platform === 'darwin';
const isUbuntu = process.platform === 'linux';

const MONGODB_CONF_MAC = `
systemLog:
  destination: file
  path: /usr/local/var/log/mongodb/mongo.log
  logAppend: true
storage:
  dbPath: /usr/local/var/mongodb
net:
  bindIp: 127.0.0.1
replication:
  replSetName: rs0
`;

const MONGODB_CONF_UBUNTU = `
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
storage:
  dbPath: /var/lib/mongodb
net:
  bindIp: 127.0.0.1
replication:
  replSetName: rs0
`;

const execCommand = (command, description) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${description}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${description}: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr from ${description}: ${stderr}`);
        // We resolve here as some commands might produce stderr output but still succeed
      }
      console.log(`stdout from ${description}: ${stdout}`);
      resolve(stdout);
    });
  });
};

const startMongoDBReplicaSet = async () => {
  const configPath = isMac ? '/usr/local/etc/mongod.conf' : '/etc/mongod.conf';
  const configContent = isMac ? MONGODB_CONF_MAC : MONGODB_CONF_UBUNTU;

  const commands = [
    {
      command: isMac ? 'brew services stop mongodb-community' : 'sudo systemctl stop mongod',
      description: 'Stopping MongoDB service'
    },
    {
      command: `sudo echo "${configContent}" > ${configPath}`,
      description: 'Writing MongoDB config file'
    },
    {
      command: isMac ? 'brew services start mongodb-community' : 'sudo systemctl start mongod',
      description: 'Starting MongoDB service'
    },
    {
      command: 'sleep 10',
      description: 'Waiting for MongoDB to start'
    },
    {
      command: 'mongosh --eval "rs.initiate()"',
      description: 'Initiating replica set'
    }
  ];

  try {
    for (const { command, description } of commands) {
      await execCommand(command, description);
    }
    console.log('MongoDB replica set started successfully.');
  } catch (error) {
    console.error('Failed to start MongoDB replica set.');
  }
};

startMongoDBReplicaSet();
