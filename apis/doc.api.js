const Mapping = require('../models/mapping.model.js')

async function getMapping(doc_id) {
    var mapping = await Mapping.findOne({document_id: doc_id});
    if (mapping)
        return mapping;
}

async function updateMappingTime(doc_id) {
    const this_date = new Date();
    console.log("Last modified:", this_date)
    await Mapping.findOneAndUpdate({document_id: doc_id}, {$set: {'modified': this_date}})
}

module.exports = { getMapping, updateMappingTime }
