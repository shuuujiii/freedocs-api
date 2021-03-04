require('dotenv').config()

var express = require('express')
var app = express()
var cors = require('cors');
var logger = require('morgan')

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
app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

var port = process.env.PORT || 5000

var router = require('./routes/v1/');
app.use('/api/v1/', router);
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => console.log('MongoDB connection successful'))
app.listen(port)
console.log('listen on port ' + port)