const express = require('express');
const router = express.Router();
const api = require('../apis/doc.api.js');
const ShareDB = require('sharedb');
const richText = require('rich-text');
const Mapping = require('../models/mapping.model.js')
const db = require('sharedb-mongo')(process.env.URI);
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

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
ShareDB.types.register(richText.type);  // Enable doc presence
const backend = new ShareDB({'db': db, 'presence': true, doNotForwardSendPresenceErrorsToClient: true});
const sharedb_connection = backend.connect();

router.get('/edit/:DOCID', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    res.set("X-Accel-Buffering", "no");
    var doc_id = req.params.DOCID;
    // Check if document exists
    var mapping = await api.getMapping(doc_id);
    if (mapping == null)
        res.json({error: true, message: "Document does not exist!"});
    else                                                 // Trim ID from document name
        res.render('doc.ejs', {doc_id: doc_id, doc_name: mapping.document_name.slice(0, -10)});
    
});

clients = {} 
// Set of connections for each document
// {
//   document1: [connection1, connection2, ..., connectionN],
//   document2: [connection1, connection2, ..., connectionN],
//   ...,
//   documentN: [connection1, connection2, ..., connectionN]
// }
versions = {}
router.get('/connect/:DOCID/:UID', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    var doc_id = req.params.DOCID;
    var user_id = req.params.UID;
    // Get mapping for this document ID
    var mapping = null;
    while(!mapping)
        mapping = await api.getMapping(doc_id);
    var doc_name;
    if (mapping)
        doc_name = mapping.document_name;
    console.log(mapping)
    console.log(doc_name)
    // Get document from database
    var doc = sharedb_connection.get('documents', doc_name);
    doc.fetch(function(e) {
        console.log(`\n>Connection [${user_id}] joined document [${doc_id}]>`)
        // Set headers to initialize event-stream
        res.set({
            'X-Accel-Buffering': 'no',
            'X-CSE356': '61fac4e6c3ba403a360580f3',
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        // Start event-stream
        res.flushHeaders();
        // Add a new client {connectionID, response hook} to set
        if (clients[doc_id] == null)
            clients[doc_id] = []
        clients[doc_id].push({user_id, res});
        versions[doc_id] = doc.version;
        // First message containing most up-to-date document changes, and the 
        // latest version number
        var firstMessage = JSON.stringify({ content: doc.data.ops, version: doc.version})
        res.write("data:" + firstMessage + "\n\n")
        // Client leaves
        req.on('close', () => {
            console.log(`\n<Connection [${user_id}] left document [${doc_id}]<`);
            // Tell other clients that this client is no longer present
            clients[doc_id].forEach(function(client) {
                if (client.user_id != user_id) {
                    var payload = {presence: {id: user_id, cursor: null}}
                    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
                }
            });
            // Remove client from set
            clients[doc_id] = clients[doc_id].filter(c => { return c.user_id != user_id })
            // If the set is empty, remove it
            // if (clients[doc_id].length == 0)
            //     delete clients[doc_id]
        });
    });
});

router.post('/op/:DOCID/:UID', isAuth, async (req, res) => {
    // Operation from a client
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    res.set("X-Accel-Buffering", "no");
    var doc_id = req.params.DOCID;
    var user_id = req.params.UID;
    // Get mapping for this document ID
    var mapping = await api.getMapping(doc_id);
    var doc_name;
    if (mapping)
        doc_name = mapping.document_name;
    // Get document from database
    var doc = sharedb_connection.get('documents', doc_name);
    var doc_version = versions[doc_id]
    var local_version = req.body.version;
    var op = req.body.op;
    console.log(`\nNew change by [${user_id}] for Document [${doc_id}]:`)
    console.log(op);
    // Local version doesn't match, tell client to retry
    if (doc_version != local_version) {
        console.log(`Local version (${local_version}) does not match actual version (${doc_version}), retry`);
        res.json({status: 'retry'});
    }
    else {
        // Update the database through submitOp()
        doc.submitOp(op, {source: user_id})
        // Update version
        versions[doc_id] += 1
        // Update modified time
        await api.updateMappingTime(doc_id);
        // Send notification to all clients (except this one) about change
        notifyClients(op, user_id, doc_id);
        console.log(`[${local_version}=${doc_version}] Operations successfully submitted by [${user_id}] to Document [${doc_id}]`)
        res.json({status: 'ok'});
    }
});

var notifyClients = (op, user_id, doc_id) => {
    // Notify each client
    clients[doc_id].forEach(function(client) {
        // Skip the client who made the change
        if (client.user_id != user_id) {
            console.log(`Notifying [${client.user_id}] of changes`);
            // Write message through event-stream
            client.res.write(`data: ${JSON.stringify(op)}\n\n`);
        }
        // Send ACK to client who made change
        else {
            console.log(`Sending ACK to [${client.user_id}]`);
            client.res.write(`data: ${JSON.stringify({ack: op})}\n\n`)
        }
    });
}

router.post('/presence/:DOCID/:UID', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    res.set("X-Accel-Buffering", "no");
    var doc_id = req.params.DOCID;
    var user_id = req.params.UID;
    var index = req.body.index;
    var length = req.body.length;
    console.log(`\n[${user_id}] made a presence change on document [${doc_id}]`);
    console.log(`index: ${index}, length: ${length}`);
    // Notify all clients (besides this one) about presence change
    clients[doc_id].forEach(function(client) {
        // Skip the client who made the presence change
        if (client.user_id != user_id) {
            // Notify client
            console.log(`Notifying [${client.user_id}] of presence change`);
            var payload = {presence: {id: user_id, cursor: {index: index, length: length, name: user_id}}}
            client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    })
    res.json({});
});

router.get('/get/:DOCID/:UID', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    res.set("X-Accel-Buffering", "no");
    var doc_id = req.params.DOCID;
    // idk what this is used for
    var user_id = req.params.UID;
    var mapping = await api.getMapping(doc_id);
    var doc_name;
    if (mapping)
        doc_name = mapping.document_name;
    // Get document from database
    var doc = sharedb_connection.get('documents', doc_name);
    var converter = new QuillDeltaToHtmlConverter(doc.data.ops, {});
    var html = converter.convert();
    console.log(html)
    res.send(html);
});

router.get('/mapping/modified/:id', async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    res.set("X-Accel-Buffering", "no");
    var doc_id = req.params.id;
    var mapping = await api.getMapping(doc_id);
    res.json({map: mapping});
})


module.exports = router;
