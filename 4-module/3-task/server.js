const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const filepath = path.join(__dirname, 'files', pathname);

  const dirs = url.parse(req.url).pathname.split('/');
  if (dirs.length > 2) {
    res.statusCode = 400;
    res.end('Nested paths not supported!');
  }

  switch (req.method) {
    case 'DELETE':
      fs.unlink(filepath, (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('file not found!');
          } else {
            res.statusCode = 500;
            res.end('other error');
          }
        } else {
          res.statusCode = 200;
          res.end('ok');
        }
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
