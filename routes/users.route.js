const express = require('express');
const router = express.Router();
const api = require('../apis/users.api.js');

// Middleware to protect paths that require login/authentication
const isAuth = (req, res, next) => {
    // Check if user has da cookie
    if (req.session.isAuth) 
        next()
    else {
        res.set('X-CSE356', '61fac4e6c3ba403a360580f3')
        res.json({error: true, message: "Not authorized!"})
    }
};

router.post('/login', async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    var email = req.body.email;
    var password = req.body.password;
    api.login(email, password, req, res);
});

router.post('/logout', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    api.logout(req, res);
});

router.post('/signup', async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    const username = req.body.name;
    const password = req.body.password;
    const email = req.body.email;
    api.addUser(username, password, email, res);
});

router.get('/verify', (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    const email = req.query.email;
    const key = req.query.key;
    api.verifyUser(email, key, res);
});

module.exports = router;
