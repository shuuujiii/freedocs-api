require('dotenv').config()

const express = require('express')
let app = express()
const cors = require('cors');
const logger = require('morgan')
const mongoose = require('mongoose')
const fs = require('fs')
const join = require('path').join

const models = join(__dirname, 'models')
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
//app.use(logger("dev"));
const environment = process.env.NODE_ENV; // development
const stage = require('./config')[environment];

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

if (environment !== 'production') {
  app.use(logger('dev'));
}
//var port = process.env.PORT || 5000

var router = require('./routes/v1/');
app.use('/api/v1/', router);
// app.get('/aaa', function (req, res) {
//   res.status(200).json({ name: 'john' });
// });
// console.log('aaaaaaaaa')
mongoose.connect(stage.dbUri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => console.log('MongoDB connection successful', environment))
//app.listen(`${stage.port}`)
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//app.listen(stage.port)
module.exports = app;
// console.log('listen on port ' + `${stage.port}`)