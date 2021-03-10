let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const defaultUser = { username: 'nabe', password: 'abcdefgh' }
const bc = require('../utils/bcrypto');
const User = require('../user/userModel')
const Article = require('./articleModel')
chai.use(chaiHttp);

let token;
describe('article api', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        const user = await User.create({ username: defaultUser.username, password: bc.hashPassword(defaultUser.password) })
        await Article.create({ title: 'default title', url: 'https://yahoo.co.jp', user: user._id })
    });
    beforeEach((done) => {
        chai
            .request(app)
            .post("/api/v1/users/login")
            .send(defaultUser)
            .end((err, res) => {
                // if (err) { console.log('login error') }
                token = res.body.token;
                res.should.have.status(200);
                done();
            });
    });
    describe('create Article', () => {
        it('it should create article', (done) => {
            chai.request(app)
                .post('/api/v1/article')
                .send({ title: 'some title', url: "https://google.com" })
                .set({ Authorization: `Bearer ${token}` })
                .end((err, res) => {
                    console.log('response is', res)
                    res.should.have.status(StatusCodes.OK);
                    res.body.title.should.to.eql('some title')
                    res.body.url.should.to.eql('https://google.com')
                    done();
                });
        });
    });


});
