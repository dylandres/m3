const express = require('express');
const router = express.Router();
const api = require('../apis/media.api.js');


const multer = require('multer');
const mediaUpload = multer({ dest: 'uploads/', fileFilter: (req, file, cb) => {
        console.log(file.mimetype);
        if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
            console.log('png or jpeg uploaded');
            cb(null, true);
            req.invalidFileType = false;
        }
        else {
            console.log('not png or jpeg')
            cb(null, false);
            req.invalidFileType = true;
        }
    },
    limits: { fileSize: 1048576 } //10 mb limit 
});

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

//return { mediaid }
router.post('/upload', isAuth, mediaUpload.single('file'), async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    if(req.invalidFileType) {
        res.json({error: true, message: "Invalid file type!"})
        return;
    }
    const mediaid = req.file.filename;
    const mimetype = req.file.mimetype;
    const originalname = req.file.originalname;
    api.upload(res, mediaid, mimetype, originalname);
});

//return file with mediaid
//use res.sendFile()
router.get('/access/:MEDIAID', isAuth, async (req, res) => {
    res.set('X-CSE356', '61fac4e6c3ba403a360580f3');
    var media_id = req.params.MEDIAID;
    api.access(res, media_id);
});

module.exports = router;
