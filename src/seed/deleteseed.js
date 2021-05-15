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

// const db = mongoose.connection
// db.on('error', console.error.bind(console, 'MongoDB connection error:'))
// db.once('open', () => console.log('MongoDB connection successful'))
// mongoose.connect(db)
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
            const seedUsers = await User.find({ username: 'seeduser' })
            console.log('seeduser', seedUsers)
            const articles = await Article.find({ user: { $in: seedUsers } })
            console.log('articles', articles)
            const deletelikeVote = async () => {
                for (article of articles) {
                    await Like.remove({ article: article._id })
                    await Vote.remove({ article: article._id })
                }
            }
            deletelikeVote()

            const deleteTags = await Tag.deleteMany({
                name: {
                    $in: ['testTag1', 'testTag2']
                }
            })


            const deleteComment = await Comment.updateMany({ user: seedUsers }, {
                user: null,
                comment: ""
            })
            const deleteLikes = await Like.updateMany({ users: { $in: seedUsers } },
                { $pull: { users: user._id } })

            const deleteVotes = await Vote.updateMany({ $or: [{ upvoteUsers: { $in: seedUsers } }, { downvoteUsers: { $in: seedUsers } }] },
                {
                    $pull: { upvoteUsers: user._id, downvoteUsers: user._id },
                })

            const deletedArticles = await Article.deleteMany({ user: { $in: seedUsers }, })
            console.log('deletedArticles', deletedArticles)
            // (async () => {
            //     for(article of deletedArticles)
            // })()
            const deletedUsers = await User.deleteMany({ username: 'seeduser' })
            console.log('deletedUsers', deletedUsers)
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