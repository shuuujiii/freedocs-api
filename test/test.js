let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const httpCode = require('../utils/httpcode');
const User = require('../models/userModel')
chai.use(chaiHttp);

describe('User create', () => {
    beforeEach((done) => { //Before each test we empty the database
        User.deleteMany({}, (err) => {
            done();
        });
    });
    it('should create user', (done) => {
        chai.request(app)
            .put('/api/v1/users')
            .send({ username: 'nabeshi', password: "1234" })
            .end((err, res) => {
                res.should.have.status(httpCode.SuccessCreated)
                res.body.result.username.should.to.eql('nabeshi')
                done();
            })
    });
    it('it should read user', (done) => {
        chai.request(app)
            .get('/api/v1/users?username=nabeshi')
            .end((err, res) => {
                res.should.have.status(200);
                //res.body.should.to.eql({ name: 'john' })
                done();
            });
    });
});

// describe('User read', () => {
//     beforeEach((done) => { //Before each test we empty the database
//         User.deleteMany({}, (err) => {
//             done();
//         });
//     });
//     it('should create user', (done) => {
//         chai.request(app)
//             .put('/api/v1/users')
//             .send({ username: 'nabeshi', password: "1234" })
//             .end((err, res) => {
//                 res.should.have.status(httpCode.SuccessCreated)
//                 res.body.result.username.should.to.eql('nabeshi')
//                 done();
//             })
//     });
//     it('it should read user', (done) => {
//         chai.request(app)
//             .get('/api/v1/users?username=nabeshi')
//             .end((err, res) => {
//                 res.should.have.status(200);
//                 //res.body.should.to.eql({ name: 'john' })
//                 done();
//             });
//     });
// });
