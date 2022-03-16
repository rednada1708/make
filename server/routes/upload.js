const express = require('express');
const router = express.Router();
const upload = require('../modules/multer');

//image upload to s3 사진 1개씩 저장, upload.single or
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        const file = await req.file;
        console.log(file);
        const result = await file.location;
        console.log(result);
        //사진 경로가 있는 주소를  imgurl이라는 이름으로 저장
        res.status(200).json({ imgUrl: result });
    } catch (e) {
        console.log(e);
    }
});

// // 이미지 저장 여러 개
// router.post('/image', upload.array('image', 5), async (req, res) => {
//     try {
//         let image_urls = new Array();
//         for (let i = 0; i < req.files.length; i++) {
//             console.log('location : ', req.files[i].location);
//             image_urls[i] = await req.files[i].location;
//             console.log(image_urls[i]);
//         }
//         // 이미지가 아무것도 없는 경우
//         if (image_urls.length === 0) {
//             return res.status(400).json({ message: '첨부된 이미지가 없습니다.' });
//         }
//         // res.status(200).send(util.success(200, '요청 성공', image));
//         res.status(200).json({ imgUrl: image_urls });
//     } catch (e) {
//         console.log(e);
//     }
// });

module.exports = router;
