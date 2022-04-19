const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MappingSchema = new Schema({
    document_name: {
        type: String,
        required: true,
    },
    document_id: {
        type: String,
        required: true,
    },
    modified: {
        type: Date,
        required: true
    }
});

const Mapping = mongoose.model('Mapping', MappingSchema);
module.exports = Mapping;
