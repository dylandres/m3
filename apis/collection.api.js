const Mapping = require('../models/mapping.model.js')

async function createDocument(doc_name, res, connection) {
    const random_id = Math.random().toString(20).substr(2, 10);
    var doc = connection.get('documents', doc_name + random_id);
    doc.create([{insert: 'Hello!'}], 'rich-text', {}, async (err) => {
        console.log(err);
        await setMapping(doc_name, random_id);
    });
    // Create a mapping for retrieving the document
    console.log(`\nDocument '${doc_name}' created! The ID is ${random_id}`);
    console.log(doc.data)
    res.json({docid: random_id, error: false})
}

async function deleteDocument(doc_id, res, connection) {
    // Delete document
    await Mapping.findOne({document_id: doc_id}).then(async (mapping) => {
        if (mapping) {
            console.log(`\nDeleting document [${doc_id}] from ShareDB`)
            var doc = connection.get('documents', mapping.document_name);
            doc.del(async function(){
                // Delete Mapping
                console.log(`Deleting document [${doc_id}] mapping`);
                await Mapping.findOneAndDelete({document_id: doc_id});
                res.json({error: false});
            });
        }
    })
}

async function getTenDocuments(res) {
    // Get all docs
    var all_docs = [];
    // Sort by last modified time-stamp
    all_docs = await Mapping.find().sort({'modified': -1})
    all_docs = all_docs.slice(0, 10)
    // Get top ten
    var top_ten = [];
    all_docs.forEach(function(doc) {
        top_ten.push({id: doc.document_id, name: doc.document_name.slice(0,-10)})
    });
    res.json(top_ten);
}

async function setMapping(doc_name, random_id) {
    await Mapping.create({
        document_name: doc_name + random_id,
        document_id: random_id,
        modified: new Date()
    });
    console.log(`Creating mapping: ${random_id} -> ${doc_name}`)
}

module.exports = { createDocument, deleteDocument, getTenDocuments };
