let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
const sinon = require('sinon');
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');

const ArticleService = require('../services/articleService')
const UserService = require('../services/userService')
const TokenService = require('../utils/token')
const User = require('../models/userModel')
const Tag = require('../models/tagModel')
const Likes = require('../models/likesModel')
const Vote = require('../models/voteModel')
const Article = require('../models/articleModel')
const bc = require('../utils/bcrypto');
const jwt = require('jsonwebtoken');
const mail = require('../utils/sendMail')
chai.use(chaiHttp);
const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}
let tags
describe('VoteController', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        await Article.deleteMany({})
        await Tag.deleteMany({})
        await Likes.deleteMany({})
        await Vote.deleteMany({})
        await User.create({
            username: defaultUser.username,
            password: bc.hashPassword(defaultUser.password),
            email: defaultUser.email,
            authEmail: defaultUser.authEmail
        })
        tags = await Tag.insertMany([{ name: 'tag1' }, { name: 'tag2' }])
    });
    afterEach((done) => {
        sinon.restore();
        done()
    })
    describe('login user', () => {
        let agent
        let loginUser = null
        beforeEach(async () => {
            agent = chai.request.agent(app)
            const res = await agent
                .post("/api/v1/user/login")
                .send(defaultUser)
            expect(res).to.have.cookie('connect.sid');
            expect(res).to.have.status(StatusCodes.OK)
            loginUser = res.body.user
            const article = await Article.create({
                user: loginUser._id,
                url: 'http://yahoo.co.jp',
                description: 'test',
                tags: []
            })
        });
        afterEach(() => {
            agent.close()
            loginUser = null
        })

        describe('/article/upvote', () => {
            it('should turn upvote', async () => {
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                const res = await agent.post('/api/v1/article/upvote')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                // expect(res.body).to.have.keys('article', 'downvoteUsers', 'upvoteUsers')
                expect(res.body.upvoteUsers).to.have.length(1)
                expect(res.body.downvoteUsers).to.have.length(0)
                expect(res.body._id).to.equal(mypost._id.toString())
                const resTurning = await agent.post('/api/v1/article/upvote')
                    .send({ _id: mypost._id, })
                expect(resTurning).to.have.status(StatusCodes.OK)
                expect(resTurning.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                // expect(resTurning.body).to.have.keys('article', 'downvoteUsers', 'upvoteUsers')
                expect(resTurning.body.upvoteUsers).to.have.length(0)
                expect(resTurning.body.downvoteUsers).to.have.length(0)
                expect(resTurning.body._id).to.equal(mypost._id.toString())
            })
            it('should upvote and delete downvote if it already downvoted', async () => {
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                await Article.updateOne({ _id: mypost._id }, {
                    $addToSet: {
                        downvoteUsers: loginUser._id
                    }
                })
                const res = await agent.post('/api/v1/article/upvote')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                // expect(res.body).to.have.keys('article', 'downvoteUsers', 'upvoteUsers')
                expect(res.body.upvoteUsers).to.have.length(1)
                expect(res.body.downvoteUsers).to.have.length(0)
                expect(res.body._id).to.equal(mypost._id.toString())
            })
        })
        describe('/article/downvote', () => {
            it('should turn downvote', async () => {
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                const res = await agent.post('/api/v1/article/downvote')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                // expect(res.body).to.have.keys('article', 'downvoteUsers', 'upvoteUsers')
                expect(res.body.upvoteUsers).to.have.length(0)
                expect(res.body.downvoteUsers).to.have.length(1)
                expect(res.body._id).to.equal(mypost._id.toString())
                const resTurning = await agent.post('/api/v1/article/downvote')
                    .send({ _id: mypost._id, })
                expect(resTurning).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                expect(resTurning.body.upvoteUsers).to.have.length(0)
                expect(resTurning.body.downvoteUsers).to.have.length(0)
                expect(resTurning.body._id).to.equal(mypost._id.toString())
            })
            it('should downvote and delete upvote if it already upvoted', async () => {
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                await Vote.updateOne({ article: mypost._id }, {
                    $addToSet: {
                        upvoteUsers: loginUser._id
                    }
                })
                const res = await agent.post('/api/v1/article/downvote')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                expect(res.body.upvoteUsers).to.have.length(0)
                expect(res.body.downvoteUsers).to.have.length(1)
                expect(res.body._id).to.equal(mypost._id.toString())
            })
        })
    })
})
