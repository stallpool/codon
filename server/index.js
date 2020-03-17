const i_utils = require('./utils');
const i_worker = require('./worker');
const i_ws = require('./websocket');
const i_api = require('./api');

// to enable https server:
// openssl req -newkey rsa:2048 -new -nodes -x509 -days 365 -keyout ca.key -out ca.crt
// CODON_HTTPS=./ node index.js
const server = i_utils.WebServer.create(
   { api: i_api },
   { httpsDir: process.env.CODON_HTTPS }
);

i_worker.cronCleanAuthToken();
i_ws.init(server, '/ws');

const server_port = 20190;
const server_host = '127.0.0.1';

const _ = server.listen(server_port, server_host, () => {
   console.log(`Codon is listening at ${server_host}:${server_port}`);
})
