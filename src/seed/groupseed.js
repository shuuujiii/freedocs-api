require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../configs/config')[environment];
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Tag = require('../models/tagModel');

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
            const isExistUser = await User.find({ username: 'groupSeedUser' })
            if (isExistUser.length !== 0) {
                console.log('Please delete groupseed');
                return;
            }
            const users = await User.insertMany([{
                username: 'groupSeedUser',
                password: bcrypt.hashSync('groupSeedUser', stage.saltingRounds),
            }, {
                username: 'groupSeedUser2',
                password: bcrypt.hashSync('groupSeedUser2', stage.saltingRounds),
            }, {
                username: 'groupSeedUser3',
                password: bcrypt.hashSync('groupSeedUser3', stage.saltingRounds),
            }, {
                username: 'groupSeedUser4',
                password: bcrypt.hashSync('groupSeedUser4', stage.saltingRounds),
            }])
            const tags = await Tag.insertMany([
                { name: 'grouptestTag1' },
                { name: 'grouptestTag2' },
                { name: 'grouptestTag3' },
                { name: 'grouptestTag4' }])

            //同一urlのデータを4userで作る
            // タグは、4,3,2,1個作る

            // const articles = await Articles.insertMany([{
            //     url: 'http://localhost/grouptest/1',
            //     description: 'user1',
            //     tags: [tags[0]._id],
            //     user: users[0]._id
            // }])
            let seedArtcles = []
            seedArtcles.push(
                {
                    url: 'http://localhost/grouptest/1',
                    description: 'user1',
                    tags: [tags[0]._id],
                    user: users[0]._id,
                })
            seedArtcles.push(
                {
                    url: 'http://localhost/grouptest/1',
                    description: 'user2',
                    tags: [tags[0]._id, tags[1]._id,],
                    user: users[1]._id,
                })
            seedArtcles.push(
                {
                    url: 'http://localhost/grouptest/1',
                    description: 'user3',
                    tags: [tags[0]._id, tags[1]._id, tags[2]._id],
                    user: users[2]._id,
                })
            seedArtcles.push(
                {
                    url: 'http://localhost/grouptest/1',
                    description: 'user4',
                    tags: [tags[0]._id, tags[1]._id, tags[2]._id, tags[3]._id],
                    user: users[3]._id,
                })
            const articles = await Article.insertMany(seedArtcles)
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