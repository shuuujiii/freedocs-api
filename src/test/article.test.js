let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let expect = chai.expect;
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const defaultUser = { username: 'nabe', password: 'abcdefgh' }
const otherUser = { username: 'nabe2', password: 'asdfasdf' }
const bc = require('../utils/bcrypto');
const User = require('../models/userModel')
const Article = require('../models/articleModel')
const Tag = require('../models/tagModel')
chai.use(chaiHttp);

let token;
let otherUserToken;
let articles;
let tags;
describe('article api', () => {
    // create test data
    beforeEach(async () => {
        await User.deleteMany({})
        await Article.deleteMany({})
        await Tag.deleteMany({})
        const user = await User.create({ username: defaultUser.username, password: bc.hashPassword(defaultUser.password) })
        const user2 = await User.create({ username: otherUser.username, password: bc.hashPassword(otherUser.password) })
        articles = await Article.create(
            { title: 'default title', url: 'https://yahoo.co.jp', user: user._id },
            { title: 'default title2', url: 'https://qiita.com', user: user._id },
            { title: 'other user', url: 'https://dev.to', user: user2.tag_ids })
        tags = await Tag.create({ name: 'javascript' }, { name: 'node' })
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
    // get other user s token
    beforeEach((done) => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send(otherUser)
            .end((err, res) => {
                otherUserToken = res.body.token;
                res.should.have.status(200);
                done();
            });
    });
    describe('create Article (empty tags array)', () => {
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
            const tag_ids = tags.map(tag => tag._id)
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com", tags: tag_ids })
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
                    res.body.tags[0]._id.should.to.eql(tag_ids[0].toString())
                    res.body.tags[1]._id.should.to.eql(tag_ids[1].toString())
                    done();
                });
        });
        it('it should not create article with lack of title param', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: '', url: "https://google.com" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST);
                    // res.body.title.should.to.eql('some title')
                    // res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
        it('it should not create article with lack of url param', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'title', url: "" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST);
                    // res.body.title.should.to.eql('some title')
                    // res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
        it('it should not create article with lack of tags param', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.BAD_REQUEST);
                    // res.body.title.should.to.eql('some title')
                    // res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
    });
    describe('read Article', () => {
        it('it should only read own article', (done) => {
            chai.request(app)
                .get('/api/v1/article')
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK);
                    res.body.should.have.to.length(2)
                    done();
                });
        });
    });
    describe('update Article', () => {
        it('it should only update own article', (done) => {
            chai.request(app)
                .put('/api/v1/article')
                .send({ _id: articles[0]._id, title: 'updated title', url: 'https://update.com', tags: [tags[0]._id.toString()] })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    should.not.exist(err)
                    res.should.have.status(StatusCodes.OK);
                    res.body.title.should.to.eql('updated title')
                    res.body.url.should.to.eql('https://update.com')
                    // tags
                    expect(res.body.tags).to.length(1)
                    expect(res.body.tags[0]._id).to.eql(tags[0]._id.toString())
                    done();
                });
        });
        it('it should not update other users article', (done) => {
            chai.request(app)
                .put('/api/v1/article')
                .send({ _id: articles[0]._id, title: 'updated title', url: 'https://update.com', tags: [tags[0]._id.toString()] })
                .set({ Authorization: `Bearer ${otherUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.NO_CONTENT);
                    done();
                });
        });
    });
    describe('delete Article', () => {
        it('it should only delete own article', (done) => {
            chai.request(app)
                .delete('/api/v1/article')
                .send({ _id: articles[0]._id })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    should.not.exist(err)
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body.deletedCount).to.eql(1)
                    done();
                });
        });
        it('it should not delete other users article', (done) => {
            chai.request(app)
                .delete('/api/v1/article')
                .send({ _id: articles[0]._id })
                .set({ Authorization: `Bearer ${otherUserToken}` })
                .end((err, res) => {
                    should.not.exist(err)
                    res.should.have.status(StatusCodes.OK);
                    expect(res.body.deletedCount).to.eql(0)
                    done();
                });
        });
    });
});
