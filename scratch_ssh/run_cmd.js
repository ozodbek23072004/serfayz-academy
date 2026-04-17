const { Client } = require('ssh2');

const conn = new Client();

const host = '31.220.95.38';
const user = 'root';
const password = 'Azimbek2302$';
const cmd = process.argv.slice(2).join(' ') || 'whoami';

conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({
    host: host,
    port: 22,
    username: user,
    password: password,
    readyTimeout: 10000
});
