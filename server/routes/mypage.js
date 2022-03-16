const express = require('express');
const router = express.Router();
const Proofshot = require('../models/proofShot');
const authMiddleware = require('../middlewares/auth-middleware');
const calc = require('../modules/calcProperty');
const User = require('../models/user');
/**
 * @swagger
 * /api/mypage/challenge:
 *   get:
 *    summary: "mypage challenge list 불러오기 (하단 인증 탭)"
 *    description: "mypage challenge list 불러오기 (하단 인증 탭)"
 *    tags: [MyPage]
 *    parameters:
 *     - name: status
 *       in: query
 *       description: status of item
 *       schema:
 *         type: integer
 *    responses:
 *      "200":
 *        description: list 불러오기 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                challenges:
 *                  type: array
 *                  items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       startAt:
 *                         type: string
 *                       participants:
 *                         type: integer
 *                       isUpload:
 *                         type: boolean
 *                       round:
 *                         type: integer
 *                       challengeId:
 *                         type: string
 */

router.get('/challenge', authMiddleware, async (req, res) => {
    let { user } = res.locals;
    let { status } = req.query;

    if (user === undefined) {
        return res.status(401).json({ message: '로그인 후 사용하시오' });
    }

    try {
        console.log(user);
        user = await User.findOne({ _id: user._id })
            .lean()
            .populate('participate', 'title _id participants thumbnail startAt');

        let challenges = user.participate;
        calc.calcParticipants(challenges);
        await calc.calcUserIsUpload(challenges, user.userId);
        calc.calcPastDaysAndRound(challenges);
        calc.calcStatus(challenges);
        for (const i of challenges) i.challengeId = i._id;

        //status가 undefined 인 경우
        if (!status) return res.status(200).json({ challenges });
        else
            return res
                .status(200)
                .json({ challenges: challenges.filter((x) => x.status === +status) });
    } catch (err) {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

/**
 * @swagger
 * /api/mypage/proofShot:
 *   get:
 *    summary: "mypage proofShot list 불러오기"
 *    description: "mypage proofShot list 불러오기"
 *    tags: [MyPage]
 *    responses:
 *      "200":
 *        description: list 불러오기 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                proofShots:
 *                  type: array
 *                  items:
 *                     type: object
 *                     properties:
 *                       imgUrl:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       proofShotId:
 *                         type: string
 */
router.get('/proofShot', authMiddleware, async (req, res) => {
    // await Proofshot.create({ChallengeId})
    let { user } = res.locals;
    if (user === undefined) {
        return res.status(401).json({ message: '로그인 후 사용하시오' });
    }

    try {
        let proofShots = await Proofshot.find({ userId: user._id })
            .select({
                _id: 1,
                imgUrl: 1,
                createdAt: 1,
            })
            .lean();
        for (const i of proofShots) i.proofShotId = i._id;
        console.log(proofShots);
        return res.status(200).json({ proofShots });
    } catch (err) {
        return res.status(401).json({ message: '잘못된 요청입니다.' });
    }
});

/**
 * @swagger
 * /api/mypage/proofShot/{proofShotId}:
 *   get:
 *    summary: "mypage proofShot 상세보기 path 방식"
 *    description: "parameter에 proofShotId 담아서 서버로 보낸다."
 *    tags: [MyPage]
 *    parameters:
 *      - name: proofShotId
 *        in: path
 *        required: true
 *        description: proofShotId from parameter
 *        schema:
 *          type: string
 *    responses:
 *      "200":
 *        description: proofShot 상세보기 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                proofShot:
 *                  type: object
 *                  properties:
 *                    challengeId:
 *                      type: string
 *                    userId:
 *                      type: string
 *                    imgUrl:
 *                      type: string
 *                    comment:
 *                      type: string
 *                    challengeTitle:
 *                      type: string
 *                    createdAt:
 *                      type: string
 *                    proofShotId:
 *                      type: string
 */
router.get('/proofShot/:proofShotId', authMiddleware, async (req, res) => {
    let { user } = res.locals;
    if (user === undefined) {
        return res.status(401).json({ message: '로그인 후 사용하시오' });
    }

    try {
        const { proofShotId } = req.params;
        let proofShot = await Proofshot.findOne({
            _id: proofShotId,
            //userId: user.userId,
        }).lean();
        console.log(proofShot);
        proofShot.proofShotId = proofShot._id;
        return res.status(200).json({ proofShot });
    } catch (err) {
        //console.log(err);
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

module.exports = router;
