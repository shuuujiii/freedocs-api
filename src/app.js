require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors');
const logger = require('morgan')
const mongoose = require('mongoose')
const errorHandler = require('./utils/errorhandler').handler
const environment = process.env.NODE_ENV;
const stage = require('./configs/config')[environment];

let whitelist = process.env.WHITE_LIST.split(' ')
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}));

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// api logger
if (environment === 'development') {
  app.use(logger('dev'));
}

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
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => console.log('MongoDB connection successful'))

// error handling
app.use(async (err, req, res, next) => {
  await errorHandler.handleError(err, res);//The error handler will send a response
});

module.exports = app;