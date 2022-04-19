const Image = require('../models/image.model.js');
const path = require('path');

async function upload(res, mediaid, mimetype, originalname) {
    await Image.create({
        mediaid: mediaid,
        mimetype: mimetype,
        originalname: originalname
    });
    console.log("MEDIA ID:" + mediaid);
    res.json({error: false, mediaid: mediaid});
}

//first look for media_id in 
//use res.sendFile()
async function access(res, media_id) {
    const image = await Image.findOne({mediaid: media_id});
    if(image) {
        //get file extension
        
        //const ext = path.extname(image.originalname);

        //append to the media_id
        const filename = media_id;

        const uploadsDir = path.join(__dirname, '../uploads/');
        const finalPath = uploadsDir + filename;
        console.log(finalPath, image.mimetype);
        return res.type(image.mimetype).sendFile(finalPath);
    }
    res.json({error: true, message: 'MEDIAID not found!'});
}

module.exports = { upload, access }
