const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    mediaid: {
        type: String,
        required: true,
    },
    mimetype: {
        type: String,
        required: true,
    },
    originalname: {
        type: String,
        required: true,
    }
});

const Image = mongoose.model('Image', ImageSchema);
module.exports = Image;