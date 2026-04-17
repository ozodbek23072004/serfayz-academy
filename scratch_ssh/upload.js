const { Client } = require('ssh2');
const fs = require('fs');

const host = '31.220.95.38';
const user = 'root';
const password = 'Azimbek2302$';
const localPath = process.argv[2];
const remotePath = process.argv[3];

if (!localPath || !remotePath) {
    console.error('Usage: node upload.js <localPath> <remotePath>');
    process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log(`Successfully uploaded ${localPath} to ${remotePath}`);
            conn.end();
        });
    });
}).connect({
    host: host,
    port: 22,
    username: user,
    password: password,
    readyTimeout: 10000
});
