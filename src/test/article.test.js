let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const defaultUser = { username: 'nabe', password: 'abcdefgh' }
const bc = require('../utils/bcrypto');
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Tag = require('../models/tagModel')
chai.use(chaiHttp);

let token;
let tags
describe('article api', () => {
    // create test data
    beforeEach(async () => {
        await User.deleteMany({})
        await Article.deleteMany({})
        await Tag.deleteMany({})
        const user = await User.create({ username: defaultUser.username, password: bc.hashPassword(defaultUser.password) })
        await Article.create({ title: 'default title', url: 'https://yahoo.co.jp', user: user._id })
        tags = await Tag.create({ name: 'javascript', user: user._id }, { name: 'node', user: user._id })
    });
    // get token
    beforeEach((done) => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send(defaultUser)
            .end((err, res) => {
                token = res.body.token;
                res.should.have.status(200);
                done();
            });
    });
    describe('create Article (no tags)', () => {
        it('it should create article', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com", tags: [] })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    res.body.should.have.property('title')
                    res.body.should.have.property('url')
                    res.body.should.have.property('tags')
                    res.body.title.should.to.eql('some title')
                    res.body.url.should.to.eql('https://google.com')
                    res.body.tags.should.to.eql([])
                    done();
                });
        });
        it('it should create article(with tags)', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com", tags: tags })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    if (err) {
                        console.log(err);
                        done();
                    }
                    res.should.have.status(StatusCodes.OK);
                    res.body.should.have.property('title');
                    res.body.should.have.property('url');
                    res.body.should.have.property('tags');
                    res.body.title.should.to.eql('some title');
                    res.body.url.should.to.eql('https://google.com');
                    tag_ids = tags.map(tag => tag._id)
                    res.body.tags[0].should.to.eql(tag_ids[0].toString())
                    done();
                });
        });
        it('it should not create article with invalid param', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    res.body.title.should.to.eql('some title')
                    res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
    });
    describe('read Article', () => {
        it('it should create article', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    res.body.title.should.to.eql('some title')
                    res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
    });
});
