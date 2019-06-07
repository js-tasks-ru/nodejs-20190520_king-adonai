const Koa = require('koa');
const app = new Koa();

app.use(require('koa-static')('public'));
app.use(require('koa-bodyparser')());

const Router = require('koa-router');
const router = new Router();

let users = [];

router.get('/subscribe', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    ctx.resolve = resolve;
    users.push(ctx);
  }).then(() => ctx.status = 200);
});

router.post('/publish', async (ctx, next) => {
  if (!ctx.request.body.message) {
    ctx.status = 400;

    return;
  }

  const message = ctx.request.body.message;

  users.forEach(user => {
    user.body = message;
    user.resolve();
  });

  ctx.status = 200;

  users = [];
});

app.use(router.routes());

module.exports = app;
