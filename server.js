const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();
const MongoDBSession = require('connect-mongodb-session')(session)
const mongoose = require('mongoose');
const User = require('./models/user.model.js');
const users = require('./routes/users.route.js');
const collection = require('./routes/collection.route.js');
const media = require('./routes/media.route.js');
const doc = require('./routes/doc.route.js');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(cors({
    origin: 'http://localhost:8080'
}));

// Connect to MongoDB
const uri = process.env.URI;
mongoose.connect(uri, {useNewUrlParser: true});
const mongodb_connection = mongoose.connection
mongodb_connection.once('open', () => {
    console.log('MongoDB Database connection established!');
});

// Session/Cookie stuff
const store = new MongoDBSession({
    uri: process.env.URI,
    collection: 'sessions',
});
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
}));

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

// Start server
app.listen(
    process.env.PORT,
    () => {
        console.log(`Server started on port ${process.env.PORT}`)
    }
);

// Login/Registration Screen
app.get('/',
    async (req, res) => {
        res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
        // Check if there's a user with this session ID
        var user = await User.findOne({_id: req.session.userID})
        // User exists, auto-login
        if (user)
            res.redirect('/home')
        // User doesn't exist
        else
            res.render('login.ejs')
});

// Routes
app.use('/users', users);
app.use('/collection', collection);
app.use('/media', media);
app.use('/doc', doc)

// Home Screen
app.get('/home', isAuth,
    async (req, res) => {
        res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
        res.render('home.ejs');
});

//test route for image upload
app.get('/image-upload', (req, res) => {
    res.render('image_test.ejs');
});
