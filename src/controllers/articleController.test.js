let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
const sinon = require('sinon');
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');

const ArticleService = require('../services/articleService')
const User = require('../models/userModel')
const Tag = require('../models/tagModel')
const Article = require('../models/articleModel')
const bc = require('../utils/bcrypto');
chai.use(chaiHttp);
const defaultUser = {
    username: 'defaultuser',
    password: 'defaultuser',
    email: 'freedocsfordev@gmail.com',
    authEmail: true
}
let tags
describe('ArticleController', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        await Article.deleteMany({})
        await Tag.deleteMany({})
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
    describe('/article/lists', () => {
        it('should return articles', (done) => {
            chai.request(app)
                .get("/api/v1/article/lists")
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body).to.have.contain.keys('docs', 'totalDocs', 'limit', 'page', 'totalPages', 'pagingCounter', 'hasPrevPage', 'hasNextPage', 'prevPage', 'nextPage')
                    done();
                });
        })
    })
    describe('/article/ranking', () => {
        it('should return ranking', (done) => {
            chai.request(app)
                .get("/api/v1/article/ranking")
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body).to.have.contain.keys('recentlyPosted', 'likesRanking', 'voteRanking')
                    done();
                });
        })
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
        describe('/article/create', () => {
            it('should login user create article', (done) => {
                const createArticle = sinon.spy(ArticleService, "createArticle")
                agent.post("/api/v1/article/create")
                    .send({
                        url: 'http://google.com',
                        description: 'description test',
                        tags: tags.map(tag => tag._id),
                    })
                    .end((err, res) => {
                        expect(res).to.have.status(StatusCodes.CREATED)
                        expect(createArticle.calledOnce).to.be.true
                        expect(res.body).to.have.keys(
                            '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'createdAt', 'updatedAt', 'tags', '__v')
                        expect(res.body.url).to.equal('http://google.com')
                        expect(res.body.description).to.equal('description test')
                        expect(res.body.tags).to.have.length(2)
                        done();
                    });
            })
            it('should not post duplicate url', (done) => {
                agent.post("/api/v1/article/create")
                    .send({
                        url: 'http://yahoo.co.jp',
                        description: 'description test',
                        tags: tags.map(tag => tag._id),
                    })
                    .end((err, res) => {
                        expect(res).to.have.status(StatusCodes.CONFLICT)
                        done()
                    });
            })
        })
        describe('/article/update', () => {
            it('should update article', async () => {
                const updateArticle = sinon.spy(ArticleService, 'updateArticle')
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                const addedTags = await Tag.insertMany([{ name: 'add1' }, { name: 'add2' }])
                const TagIds = [tags[0]._id, addedTags[0]._id, addedTags[1]._id]
                const res = await agent.put('/api/v1/article/update')
                    .send({
                        _id: mypost._id,
                        description: 'update description',
                        tags: TagIds
                    })
                expect(res).to.have.status(StatusCodes.OK)
                expect(updateArticle.calledOnce).to.be.true
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'tags', 'upvoteUsers', 'downvoteUsers', 'favoriteUsers', 'createdAt', 'updatedAt')
                expect(res.body._id).to.equal(mypost._id.toString())
                expect(res.body.url).to.equal('http://yahoo.co.jp')
                expect(res.body.description).to.equal('update description')
                expect(res.body.tags).to.have.length(3)
                expect(res.body.tags.map(tag => tag.name)).includes.members(['tag1', 'add1', 'add2'])
                // expect({ a: 1, b: 2 }).to.include({ a: 1 })
                // expect([{ a: 1 }, { a: 2 }]).to.deep.include({ a: 2 })
                // expect([{ a: 1, b: 2 }, { a: 2, b: 3 }]).to.deep.nested.include({ a: 2, b: 3 })
                // console.log(res.body.tags)
            })
            it('should not update with wrong parameter', async () => {
                const addedTags = await Tag.insertMany([{ name: 'add1' }, { name: 'add2' }])
                const TagIds = [tags[0]._id, addedTags[0]._id, addedTags[1]._id]
                const res = await agent.put('/api/v1/article/update')
                    .send({
                        _id: '609f7101f9b7d30546c7fc3d',
                        description: 'update description',
                        tags: 'aaa'
                    })
                expect(res).to.have.status(StatusCodes.BAD_REQUEST)
            })
            it('should not update with wrong article id', async () => {
                const addedTags = await Tag.insertMany([{ name: 'add1' }, { name: 'add2' }])
                const TagIds = [tags[0]._id, addedTags[0]._id, addedTags[1]._id]
                const res = await agent.put('/api/v1/article/update')
                    .send({
                        _id: '609f7101f9b7d30546c7fc3d',
                        description: 'update description',
                        tags: TagIds
                    })
                expect(res).to.have.status(StatusCodes.NO_CONTENT)
            })
            it("should not update other user's article", async () => {
                const otherUser = await User.create({
                    username: 'otheruser',
                    password: 'otheruser',
                    email: ''
                })
                const otherUsersArticle = await Article.create({
                    url: 'http://dev.to',
                    description: "other user's article",
                    user: otherUser._id,
                    tags: []
                })
                const addedTags = await Tag.insertMany([{ name: 'add1' }, { name: 'add2' }])
                const TagIds = [tags[0]._id, addedTags[0]._id, addedTags[1]._id]
                const res = await agent.put('/api/v1/article/update')
                    .send({
                        _id: otherUsersArticle._id,
                        description: 'update to other user s description',
                        tags: TagIds
                    })
                expect(res).to.have.status(StatusCodes.NO_CONTENT)
            })
        })
        describe('/article/delete', () => {
            it("should delete own article", async () => {
                const deleteArticle = sinon.spy(ArticleService, 'deleteArticle')
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                const res = await agent.delete('/api/v1/article/delete')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(deleteArticle.calledOnce).to.be.true
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                expect(res.body._id).to.equal(mypost._id.toString())
            })
            it("should not delete other user's article", async () => {
                const otherUser = await User.create({
                    username: 'otheruser',
                    password: 'otheruser',
                    email: ''
                })
                const otherUsersArticle = await Article.create({
                    url: 'http://dev.to',
                    description: "other user's article",
                    user: otherUser._id,
                    tags: []
                })
                const res = await agent.delete('/api/v1/article/delete')
                    .send({ _id: otherUsersArticle._id, })
                expect(res).to.have.status(StatusCodes.NO_CONTENT)
            })
        })
    })
})
