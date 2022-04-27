const User = require('../models/user.model.js');
const nodemailer = require('nodemailer');

async function addUser(username, password, email, res) {
    // Check if username or email is taken
    await User.findOne({$or: [
        {username: username},
        {email: email}
    ]}).then( async (user) => {
        // Username or email taken
        if (user) 
            res.json({error: true, message: 'Username or email taken!'})
        // Otherwise, create user and put in database
        else {
            await User.create({
                username: username,
                email: email,
                password: password,
                verified: false,
            })
            // Send verification link to email
            sendVerificationEmail(email);
            // Success
            console.log(`[${username}] registered with email ${email}`);
            res.json({error: false, message: 'Registration complete! Check your email to verify.'})
        }
    })
}

function sendVerificationEmail(email) {
    // Create transporter object
    let transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail',
   })
   // Send email
   const encoded_email = encodeURIComponent(email);
   transporter.sendMail({
       from: '"Hot Pink" <team.hotpink.inc@gmail.com>',
       to: email,
       subject: "Verify Email Address",
       html: `<a href=http://hotpink.cse356.compas.cs.stonybrook.edu/users/verify?email=${encoded_email}&key=abracadabra></a>`,
   })
}

async function login(email, password, req, res) {
    // Verify credentials
    await User.findOne({$and: [
        {email: email},
        {password: password},
    ]}).then( (user) => {
        // Wrong credentials
        if (!user) {
            res.json({error: true, message: 'Incorrect username or email!'})
        }
        else {
            // Check if user is verified
            if (user.verified) {
                // Associate session with user
                req.session.userID = user.id;
                req.session.username = user.username;
                // Allow user to access /dashboard
                req.session.isAuth = true;
                // Success
                console.log(`>[${user.username}] logged in>`);
                res.json({name: user.username, error: false, message: 'Login success!'})
            }
            else
                res.json({error: true, message: 'User not verified!'})
        }
    })
}

async function logout(req, res) {
    var user = await User.findOne({_id: req.session.userID})
    // User not logged in
    if (!user)
        res.json({error: true, message: 'User not logged in!'})
    else {
        // Destroy session
        req.session.destroy((err) => {
            if (err)
                res.json({error: true, message: 'Session could not be destroyed!'})
            else
                // Success
                console.log(`<[${user.username}] logged out<`);
                res.json({error: false, message: 'Logout success!'})
        })
    }
}

async function verifyUser(email, key, res) {
    // Verify key
    if (key == "abracadabra") {
        // Check if email exists
        await User.findOne({email: email})
        .then( async (user) => {
            // Doesn't exist
            if (!user) {
                res.json({error: true, message: 'User does not exist!'})
            }
            // Exists
            else {
                // Change verification status
                await User.findOneAndUpdate({email: email}, {verified: true});
                console.log(`[${user.username}] has been verified`);
                res.json({error: false, message: `[${user.username}] has been verified`})
            }
        })

    }
    // Wrong key
    else {
        res.json({error: true, message: 'Incorrect key!'})
    }
}

module.exports = { addUser, login, logout, verifyUser }
