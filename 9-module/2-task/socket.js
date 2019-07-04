const socketIO = require('socket.io');

const Session = require('./models/Session');
const Message = require('./models/Message');

function socket(server) {
  const io = socketIO(server);

  io.use(async function(socket, next) {
    const { token } = socket.handshake.query;
    if (!token) {
      next(new Error('anonymous sessions are not allowed'));
      return;
    }

    const session = await Session.findOne({ token }).populate('user');
    if (!session) {
      next(new Error('wrong or expired session token'));
      return;
    }

    socket.user = session.user;

    next();
  });

  io.on('connection', function(socket) {
    socket.on('message', async (msg) => {
      const date = new Date();
      socket.emit('user_message', {
        user: socket.user.displayName,
        text: msg,
        date
      });

      await Message.create({
        user: socket.user,
        text: msg,
        date
      });
    });
  });

  return io;
}

module.exports = socket;
