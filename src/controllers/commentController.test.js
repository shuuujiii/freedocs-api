let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
const sinon = require('sinon');
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');

const User = require('../models/userModel')
const Tag = require('../models/tagModel')
const Article = require('../models/articleModel')
const Comment = require('../models/commentModel')
const bc = require('../utils/bcrypto');
chai.use(chaiHttp);
const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}
const anotherUser = {
    username: 'anotheruser',
    password: 'anotheruser',
    email: 'another@gmail.com',
    authEmail: true,
}
describe('commentController', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        await Article.deleteMany({})
        await Tag.deleteMany({})
        await Comment.deleteMany({})
        const createdUsers = await User.insertMany([{
            username: defaultUser.username,
            password: bc.hashPassword(defaultUser.password),
            email: defaultUser.email,
            authEmail: defaultUser.authEmail
        }, {
            username: anotherUser.username,
            password: bc.hashPassword(anotherUser.password),
            email: anotherUser.email,
            authEmail: anotherUser.authEmail
        }])
        await Article.insertMany([
            {
                user: createdUsers[0]._id,
                url: 'http://yahoo.co.jp',
                description: 'loginUser created',
                tags: []
            },
            {
                user: createdUsers[1]._id,
                url: 'http://google.com',
                description: 'anotherUser created',
                tags: []
            }
        ])
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
        });
        afterEach(() => {
            agent.close()
            loginUser = null
        })
        describe('get /article/comment', () => {
            it('should get no comments', async () => {
                const anotherUserArticle = await Article.findOne(
                    { url: 'http://google.com' }
                )
                const res = await agent.get(`/api/v1/article/comment?article=${anotherUserArticle._id}`)
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.length(0)
            })
            it('should get two comments', async () => {
                const anotherUserArticle = await Article.findOne(
                    { url: 'http://google.com' }
                )
                const userA = await User.findOne({ username: anotherUser.username })
                await Comment.insertMany([{
                    article: anotherUserArticle._id,
                    comment: 'test comment 1',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }, {
                    article: anotherUserArticle._id,
                    comment: 'test comment 2',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }])
                const res = await agent.get(`/api/v1/article/comment?article=${anotherUserArticle._id}`)
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.length(2)
            })
            it('should get nested comments', async () => {
                const commentedArticle = await Article.findOne(
                    { url: 'http://google.com' }
                )
                const userA = await User.findOne({ username: anotherUser.username })
                const twoComments = await Comment.insertMany([{
                    article: commentedArticle._id,
                    comment: 'test comment 1',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }, {
                    article: commentedArticle._id,
                    comment: 'test comment 2',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }])
                const nestedComment = await Comment.create({
                    article: commentedArticle._id,
                    comment: 'reply to comment 2',
                    user: userA._id,
                    parent: twoComments[1]._id,
                    children: [],
                    depth: 2
                })
                await Comment.findByIdAndUpdate(twoComments[1]._id, {
                    $push: {
                        children: nestedComment._id.toString()
                    }
                }, { new: true })

                const res = await agent.get(`/api/v1/article/comment?article=${commentedArticle._id}`)
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.length(2)
                expect(res.body[1].children).to.have.length(1)
            })
        })
        describe('post /article/comment', () => {
            it('should post first comments', async () => {
                const anotherUserArticle = await Article.findOne(
                    { url: 'http://google.com' }
                )
                const res = await agent.post(`/api/v1/article/comment`)
                    .send({
                        article_id: anotherUserArticle._id,
                        parent_id: null,
                        comment: 'first comment',
                    })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.length(1)
            })
            it('should post reply', async () => {
                const commentedArticle = await Article.findOne(
                    { url: 'http://google.com' }
                )
                const userA = await User.findOne({ username: anotherUser.username })
                const twoComments = await Comment.insertMany([{
                    article: commentedArticle._id,
                    comment: 'test comment 1',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }, {
                    article: commentedArticle._id,
                    comment: 'test comment 2',
                    user: userA._id,
                    parent: null,
                    children: [],
                    depth: 1
                }])
                const nestedComment = await Comment.create({
                    article: commentedArticle._id,
                    comment: 'reply to comment 2',
                    user: userA._id,
                    parent: twoComments[1]._id,
                    children: [],
                    depth: 2
                })
                await Comment.findByIdAndUpdate(twoComments[1]._id, {
                    $push: {
                        children: nestedComment._id.toString()
                    }
                }, { new: true })
                const res = await agent.post(`/api/v1/article/comment`)
                    .send({
                        article_id: nestedComment.article,
                        parent_id: nestedComment._id,
                        comment: 'reply comment',
                    })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.length(2)
                expect(res.body[1].children).to.have.length(1)
                expect(res.body[1].children[0].children).to.have.length(1)
            })
        })
    })
})
