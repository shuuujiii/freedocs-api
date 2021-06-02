let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
const sinon = require('sinon');
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');

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
describe('favoriteController', () => {
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
        describe('/article/likes', () => {
            it('should be favorite turned', async () => {
                const mypost = await Article.findOne({
                    url: 'http://yahoo.co.jp',
                    user: loginUser._id
                })
                const res = await agent.post('/api/v1/article/likes')
                    .send({ _id: mypost._id, })
                expect(res).to.have.status(StatusCodes.OK)
                expect(res.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                expect(res.body._id).to.equal(mypost._id.toString())
                expect(res.body.favoriteUsers).to.have.length(1)
                const resTurning = await agent.post('/api/v1/article/likes')
                    .send({ _id: mypost._id, })
                expect(resTurning).to.have.status(StatusCodes.OK)
                expect(resTurning.body).to.have.keys('__v', '_id', 'url', 'description', 'user', 'favoriteUsers', 'upvoteUsers', 'downvoteUsers', 'tags', 'createdAt', 'updatedAt')
                expect(resTurning.body._id).to.equal(mypost._id.toString())
                expect(resTurning.body.favoriteUsers).to.have.length(0)

            })
        })
    })
})
