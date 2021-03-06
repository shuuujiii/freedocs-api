require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../configs/config')[environment];
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Tag = require('../models/tagModel')

mongoose.connect(stage.dbUri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }
)
console.log('mongoose')
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => console.log('MongoDB connection successful'))
try {

    (async function () {
        try {
            console.log('async function')
            const users = await User.find({
                username: {
                    $in: ['groupSeedUser', 'groupSeedUser2', 'groupSeedUser3', 'groupSeedUser4']
                }
            })
            console.log('users', users)
            const deletedUsers = await User.deleteMany({
                username:
                    { $in: ['groupSeedUser', 'groupSeedUser2', 'groupSeedUser3', 'groupSeedUser4'] }
            })
            console.log('deletedUsers', deletedUsers)
            const deletedArticles = await Article.deleteMany({ user: { $in: users }, })
            const deleteTags = await Tag.deleteMany({
                name: {
                    $in: ['grouptestTag1', 'grouptestTag2', 'grouptestTag3', 'grouptestTag4']
                }

            })
            console.log('deleteTags', deleteTags)

        } catch (e) {
            console.log(e)
        }
    })()
} catch (e) {
    console.log(e)
} finally {
    // mongoose.disconnect()
    //     .then(() => console.log("saved succesfully and mongodb   disconnected"))
    //     .catch(error => console.log(error));
    // process.exit()
}
// mongoose.connect(db)
//     .then(() => console.log("mongodb connection success"))
//     .catch(error => console.log(error));