const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, callback) {
    let data = chunk.toString();

    if (this.lastLine) {
      data = this.lastLine + data;
    }

    const lines = data.split(os.EOL);
    this.lastLine = lines.pop();

    for (let line of lines) {
      this.push(line);
    }

    callback();
  }

  _flush(callback) {
    if (this.lastLine) {
      this.push(this.lastLine);
    }

    callback();
  }
}

module.exports = LineSplitStream;
