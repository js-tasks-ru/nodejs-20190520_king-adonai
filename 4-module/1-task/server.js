const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      const dirs = url.parse(req.url).pathname.split('/');

      if (dirs.length > 2) {
        res.statusCode = 400;
        res.end('Nested paths not supported!');
      }

      const readStream = fs.createReadStream(filepath);
      readStream.on('error', error => {
        if (error.code === 'ENOENT') {
          res.statusCode = 404;
          res.end('File not found!');
        }
      });
      readStream.pipe(res);
      
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
