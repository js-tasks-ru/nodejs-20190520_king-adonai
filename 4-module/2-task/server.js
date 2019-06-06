const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');

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
    case 'POST':
      const limitStream = new LimitSizeStream({ limit: 1000000 });
      const writeStream = fs.createWriteStream(filepath, { flags: 'wx' });

      req
        .pipe(limitStream)
        .on('error', err => {
          if (err.code === 'LIMIT_EXCEEDED') {
            res.statusCode = 413;
            fs.unlink(filepath, (err) => {});
            res.end('size exceeded!');
          }
        })
        .pipe(writeStream)
        .on('error', err => {
          if (err.code === 'EEXIST') {
            res.statusCode = 409;
            res.end('file already exists!');
          } else {
            res.statusCode = 500;
            res.end('internal error');
          }
        })
        .on('close', () => {
          res.statusCode = 201;
          res.end();
        });

      res.on('close', () => {
        if (res.finished) return;
        fs.unlink(filepath, (err) => {});
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
