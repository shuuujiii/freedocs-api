require('dotenv').config()

const express = require('express')
const app = express()
const session = require('express-session')
const cors = require('cors');
const logger = require('morgan')
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo');
const errorHandler = require('./utils/errorhandler').handler
const environment = process.env.NODE_ENV;
const stage = require('./configs/config')[environment];
const basicAuth = require('./utils/basicAuth')

let whitelist = process.env.WHITE_LIST.split(' ')
app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS:' + origin))
    }
  }
}));

// basic auth
if (environment === 'staging') {
  app.use(basicAuth)
}

// cookie
app.use(cookieParser())

// session
app.set('trust proxy', 1)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: stage.dbUri }),
  cookie: {
    httpOnly: true,
    sameSite: stage.cookie.sameSite,
    secure: stage.cookie.secure,
    // sameSite: environment !== 'development' ? 'none' : 'lax',
    // secure: environment !== 'development' ? true : false,
    maxAge: 1000 * 60 * 60, //60 min
  }
}))
app.all('*', function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", whitelist);
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// api logger
if (environment === 'development') {
  app.use(logger('dev'));
}
// test
app.get('/api/v1/test', function (req, res) {
  console.log('[test] session', req.session)
  res.send('hello world')
})

// router
let router = require('./routes/v1/');
app.use('/api/v1/', router);

// db connection
mongoose.connect(stage.dbUri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)
const db = mongoose.connection
// db.on('error', console.error.bind(console, 'MongoDB connection error:'))
// db.once('open', () => console.log('MongoDB connection successful'))

// error handling
app.use(async (err, req, res, next) => {
  await errorHandler.handleError(err, res);//The error handler will send a response
});

module.exports = app;