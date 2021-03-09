require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors');
const logger = require('morgan')
const mongoose = require('mongoose')
const fs = require('fs')
const join = require('path').join
const errorHandler = require('./errorhandler').handler
const models = join(__dirname, 'models')
const environment = process.env.NODE_ENV;
const stage = require('./config')[environment];

fs.readdirSync(models)
  .filter(file => ~file.search(/^[^.].*\.js$/))
  .forEach(file => require(join(models, file)))

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

if (environment !== 'production') {
  app.use(logger('dev'));
}

let router = require('./routes/v1/');
app.use('/api/v1/', router);

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