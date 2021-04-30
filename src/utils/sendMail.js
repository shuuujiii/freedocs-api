"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function main(username, email, token) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let gmail = process.env.MAIL_ADDRESS
    let pass = process.env.GMAIL_PASSWORD
    // let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        // host: "smtp.ethereal.email",
        // port: 587,
        // secure: false, // true for 465, false for other ports
        // auth: {
        //     user: testAccount.user, // generated ethereal user
        //     pass: testAccount.pass, // generated ethereal password
        // },
        service: 'gmail',
        auth: {
            user: gmail,
            pass: pass,
        },
    });

    // send mail with defined transport object
    let html = `<p>Please check your email address from the link below</p><br>
        < a href = "${process.env.WHITE_LIST}/auth/email/${token}">confirm email</> `
    let info = await transporter.sendMail({
        from: `"FreeDocs 👻" <${gmail}>`, // sender address
        to: email, // list of receivers
        subject: "Welcome to FreeDocs", // Subject line
        text: `Hi ${username}`, // plain text body
        html: html
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

exports.sendMail = main
// main().catch(console.error);
