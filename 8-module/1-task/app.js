const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const uuid = require('uuid/v4');
const Router = require('koa-router');
const config = require('./config');
const passport = require('./libs/passport');
const handleMongooseValidationError = require('./libs/validationErrors');
const User = require('./models/User');
const sendMail = require('./libs/sendMail');

const app = new Koa();

app.use(require('koa-static')('public'));
app.use(require('koa-bodyparser')());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.status) {
      ctx.status = err.status;
      ctx.body = {error: err.message};
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = {error: 'Internal server error'};
    }
  }
});

const router = new Router({prefix: '/api'});

router.post('/login', async (ctx, next) => {
  await passport.authenticate('local', async (err, user, info) => {
    if (err) throw err;

    if (!user) {
      ctx.status = 400;
      ctx.body = {error: info};
      return;
    }

    if (user.isNotConfirmedEmail()) {
      ctx.status = 400;
      ctx.body = { error: 'Подтвердите email' };
      return;
    }

    const token = uuid();

    ctx.body = {token};
  })(ctx, next);
});

router.get('/oauth/:provider', async (ctx, next) => {
  const provider = ctx.params.provider;

  await passport.authenticate(
      provider,
      config.providers[provider].options,
  )(ctx, next);

  ctx.status = 200;
  ctx.body = {status: 'ok', location: ctx.response.get('location')};
});

router.post('/oauth_callback', handleMongooseValidationError, async (ctx, next) => {
  const provider = ctx.request.body.provider;

  await passport.authenticate(provider, async (err, user, info) => {
    if (err) throw err;

    if (!user) {
      ctx.status = 400;
      ctx.body = {error: info};
      return;
    }

    const token = uuid();

    ctx.body = {token};
  })(ctx, next);
});

router.post('/register', handleMongooseValidationError, async (ctx, next) => {
  const { email, displayName, password } = ctx.request.body;

  const user = await User.findOne({ email });
  if (user) {
    ctx.status = 400;
  }

  const verificationToken = uuid();

  const newUser = await new User({ email, displayName, verificationToken });
  await newUser.setPassword(password);
  await newUser.save();

  const transportResponse = await sendMail({
    to: email,
    subject: 'Приветствуем на сайте learn.javascript.ru',
    locals: { token: verificationToken },
    template: 'confirmation'
  });

  ctx.body = { status: 'ok' };
});

router.post('/confirm', async (ctx) => {
  const { verificationToken } = ctx.request.body;

  const user = await User.findOneAndUpdate({ verificationToken }, { $unset: { verificationToken } });

  if (!user) {
    ctx.throw(400, 'Ссылка подтверждения недействительна или устарела');
  }

  ctx.body = { token: user.verificationToken };
});

app.use(router.routes());

// this for HTML5 history in browser
const index = fs.readFileSync(path.join(__dirname, 'public/index.html'));
app.use(async (ctx, next) => {
  if (!ctx.url.startsWith('/api')) {
    ctx.set('content-type', 'text/html');
    ctx.body = index;
  }
});

module.exports = app;
