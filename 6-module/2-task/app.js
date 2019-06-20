const Koa = require('koa');
const Router = require('koa-router');
const User = require('./models/User');

const app = new Koa();

app.use(require('koa-static')('public'));
app.use(require('koa-bodyparser')());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.hasOwnProperty('errors')) {
      const errArr = Object.entries(err.errors);
      const errs = {};

      for (const [name, { message }] of errArr) {
        errs[name] = message;
      };

      ctx.status = 400;
      ctx.body = { errors: errs };
    } else if (err.kind === 'ObjectId') {
      ctx.status = 400;
      ctx.body = { error: err.message };
    } else {
      if (err.status) {
        ctx.status = err.status;
        ctx.body = { error: err.message };
      } else {
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
      }
    }
  }
});

const router = new Router();

router.get('/users', async (ctx) => {
  ctx.body = await User.find();
});

router.get('/users/:id', async (ctx) => {
  const user = await User.findOne({ _id: ctx.params.id });

  if (user) {
    ctx.body = user;
  } else {
    ctx.status = 404;
    ctx.body = { error: `No user with id: ${ctx.params.id}` };
  }
});

router.patch('/users/:id', async (ctx) => {
  const user = await User.findOneAndUpdate({ _id: ctx.params.id },
    ctx.request.body,
    { new: true, runValidators: true });

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: `No user with id: ${ctx.params.id}` };
  }

  ctx.body = user;
});

router.post('/users', async (ctx) => {
  const newUser = await User.create({ ...ctx.request.body });

  ctx.body = newUser;
});

router.delete('/users/:id', async (ctx) => {
  const removedUser = await User.deleteOne({ _id: ctx.params.id });

  if (removedUser.deletedCount === 1) {
    ctx.status = 200;
  } else {
    ctx.throw(404, 'Not Found');
  }
});

app.use(router.routes());

module.exports = app;
