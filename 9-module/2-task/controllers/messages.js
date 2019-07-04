const Message = require('../models/Message');

module.exports = async function messages(ctx, next) {
  const msgs = await Message.find({}).sort({ date: -1 }).limit(20).populate('user');
  const messages = [];

  msgs.forEach(msg => {
    messages.push({
      'id': msg._id,
      'date': msg.date,
      'text': msg.text,
      'user': msg.user.displayName
    });
  });

  if (messages) {
    ctx.body = { messages };
  }

  return [];
};
