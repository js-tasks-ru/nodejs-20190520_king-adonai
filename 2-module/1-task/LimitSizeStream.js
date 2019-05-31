const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);

    if (typeof options.limit !== 'undefined') {
      this.limit = options.limit;
    }
    this.total = 0;
  }

  _transform(chunk, encoding, callback) {
    this.total += chunk.length;
    
    if (this.total > this.limit) {
      callback(new LimitExceededError());
    } else {
      callback(null, chunk);
    }
  }
}

module.exports = LimitSizeStream;
