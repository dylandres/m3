const express = require('express');
const router = express.Router();
const api = require('../apis/collection.api.js');
const ShareDB = require('sharedb');
const richText = require('rich-text');
const db = require('sharedb-mongo')(process.env.URI);

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

// Connect to ShareDB
ShareDB.types.register(richText.type);
const backend = new ShareDB({'db': db});
const sharedb_connection = backend.connect();

router.post('/create', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    var docname = req.body.name;
    console.log("We are going to create the document ", docname);
    await api.createDocument(docname, res, sharedb_connection);
});

router.post('/delete', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    var doc_id = req.body.doc_id;
    await api.deleteDocument(doc_id, res, sharedb_connection);
});

router.get('/list', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    await api.getTenDocuments(res, sharedb_connection);
});

module.exports = router;
