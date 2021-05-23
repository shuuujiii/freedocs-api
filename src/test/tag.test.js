let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
const app = require('../app.js')
const { StatusCodes } = require('http-status-codes');
const defaultUser = { username: 'nabe', password: 'abcdefgh' }
const anotherUser = { username: 'notNabe', password: 'abcdefgh' }
const bc = require('../utils/bcrypto');
const Tag = require('../models/tagModel')
const User = require('../models/userModel');
const { assert } = require('joi');
chai.use(chaiHttp);

let normalUserToken;
let adminUserToken;
let tag;
describe('tag api', () => {
    beforeEach(async () => { //Before each test we empty the database
        await User.deleteMany({})
        await Tag.deleteMany({})
        const normalUser = await User.create(
            {
                username: defaultUser.username,
                password: bc.hashPassword(defaultUser.password)
            })
        const adminUser = await User.create({
            username: anotherUser.username,
            password: bc.hashPassword(anotherUser.password),
            admin: true
        })
        tag = await Tag.create([{
            name: 'javascript',
        }, {
            name: 'nodejs',
        }])
    });
    beforeEach((done) => {
        chai
            .request(app)
            .post("/api/v1/user/login")
            .send(defaultUser)
            .end((err, res) => {
                normalUserToken = res.body.token;
                res.should.have.status(StatusCodes.OK);
                done();
            });
    });

    beforeEach((done) => {
        chai
            .request(app)
            .post("/api/v1/user/login")
            .send(anotherUser)
            .end((err, res) => {
                adminUserToken = res.body.token;
                res.should.have.status(StatusCodes.OK);
                done();
            });
    });

    describe('create tag', () => {
        it('it should be created a tag by normal user', (done) => {
            chai.request(app)
                .post('/api/v1/tag')
                .send({ name: 'react' })
                .set({ Authorization: `Bearer ${normalUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.CREATED);
                    res.body.name.should.to.eql('react')
                    done();
                });
        });
    });

    describe('read tags', () => {
        it('should be read tags', (done) => {
            chai.request(app)
                .get('/api/v1/tag')
                .set({ Authorization: `Bearer ${normalUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK)
                    res.body.should.have.to.length(2)
                    done()
                })
        });
        // it('should not read tags from other user', (done) => {
        //     chai.request(app)
        //         .get('/api/v1/tag')
        //         .set({ Authorization: `Bearer ${anothertoken}` })
        //         .end((err, res) => {
        //             res.should.have.status(StatusCodes.OK)
        //             res.body.should.have.to.length(0)
        //             done()
        //         })
        // });
    })

    describe('update tag', () => {
        it('should update tags by admin user', (done) => {
            chai.request(app)
                .put('/api/v1/tag')
                .send({ _id: tag[0]._id, name: 'vue' })
                .set({ Authorization: `Bearer ${adminUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK)
                    res.body.should.have.property('_id')
                    res.body.should.have.property('name')
                    res.body.name.should.to.eql('vue')
                    done()
                })
        });
        it('should not update tags from normal user', (done) => {
            chai.request(app)
                .put('/api/v1/tag')
                .send({ _id: tag[0]._id, name: 'vue' })
                .set({ Authorization: `Bearer ${normalUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.UNAUTHORIZED)
                    done()
                })
        });
    })

    describe('delete tag', () => {
        it('should delete tag by admin user', (done) => {
            chai.request(app)
                .delete('/api/v1/tag')
                .send({ _id: tag[0]._id })
                .set({ Authorization: `Bearer ${adminUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.OK)
                    res.body.deletedCount.should.to.eql(1)
                    done()
                })
        });
        it('should not delete tags from normal user', (done) => {
            chai.request(app)
                .delete('/api/v1/tag')
                .send({ _id: tag[0]._id })
                .set({ Authorization: `Bearer ${normalUserToken}` })
                .end((err, res) => {
                    res.should.have.status(StatusCodes.UNAUTHORIZED)
                    // res.body.deletedCount.should.to.eql(0)
                    done()
                })
        });
    })
});
