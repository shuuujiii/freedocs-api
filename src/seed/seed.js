require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const environment = process.env.NODE_ENV;
const stage = require('../configs/config')[environment];
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Tag = require('../models/tagModel')
const Like = require('../models/likesModel')
const Vote = require('../models/voteModel')

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
try {
    (async function () {
        try {
            const isExistUser = await User.find({ username: 'seeduser' })
            if (isExistUser.length !== 0) {
                console.log('Please delete seed');
                return;
            }
            const user = await User.create({
                username: 'seeduser',
                password: bcrypt.hashSync('seeduser', stage.saltingRounds),
            })
            const tags = await Tag.insertMany([{ name: 'testTag1' }, { name: 'testTag2' }])
            // console.log(tags)
            let seedArtcles = []
            for (let i = 1; i <= 100; i++) {
                seedArtcles.push(
                    {
                        url: 'http://localhost/' + i,
                        tags: tags.map(tag => tag._id),
                        description: 'description' + i,
                        user: user._id
                    })
            }
            const articles = await Article.insertMany(seedArtcles)

            const addlikeVote = async () => {
                for (article of articles) {
                    await Like.create({ article: article._id, users: [] })
                    await Vote.create({ article: article._id, upvoteUsers: [], downvoteUsers: [] })
                }
            }
            addlikeVote()
            // articles.forEach(async article => {
            //     await Like.create({ article: article._id, users: [] })
            //     await Vote.create({ article: article._id, upvoteUsers: [], downvoteUsers: [] })
            // });
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