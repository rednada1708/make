const express = require('express');
const router = express.Router();
const Challenge = require('../models/challenge');
const User = require('../models/user');
const Proofshot = require('../models/proofShot');
const authMiddleware = require('../middlewares/auth-middleware');
const calc = require('../modules/calcProperty');
const moment = require('moment');
// 추천 API
router.get('/main/recommendation', authMiddleware, async (req, res) => {
    try {
        let userId;
        if (!res.locals.user) {
            userId = '';
        } else {
            userId = res.locals.user.userId;
        }

        const { length } = req.query;
        let challenges;
        let today = new Date(moment().format('YYYY-MM-DD')); //2022-03-05 00:00:00

        challenges = await Challenge.aggregate([
            {
                $match: {
                    startAt: { $gt: new Date(moment(today).add(-9, 'hours')) },
                },
            },
            { $sample: { size: length ? Number(length) : 4 } },
        ]);

        calc.plusChallengeId(challenges);
        calc.calcParticipants(challenges);
        calc.calcPastDaysAndRound(challenges);
        calc.calcStatus(challenges);
        await calc.calcIsLike(challenges, userId);
        res.status(200).json({ challenges });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

//메인 - 검색기능 // isLike ++++++++++++++++++++++++++++++
router.get('/search', authMiddleware, async (req, res) => {
    try {
        let userId;
        if (!res.locals.user) {
            userId = '';
        } else {
            userId = res.locals.user.userId;
        }

        const { title } = req.query;
        let today = new Date(moment().format('YYYY-MM-DD')); //2022-03-05 00:00:00

        const existChallenges = await Challenge.find(
            {
                title: { $regex: `${title}` },
                startAt: { $gt: new Date(moment(today).add(-9, 'hours')) },
            },
            { _id: 1, category: 1, participants: 1, thumbnail: 1, title: 1, startAt: 1 }
        ).lean(); // populate.._doc..
        calc.plusChallengeId(existChallenges);
        calc.calcParticipants(existChallenges);
        calc.calcPastDaysAndRound(existChallenges);
        calc.calcStatus(existChallenges);
        await calc.calcIsLike(existChallenges, userId);
        const challenges = existChallenges.sort((a, b) => b.startAt - a.startAt); //날짜 내림차순 으로 정리
        res.status(200).json({ challenges });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

// 카테고리 페이지 목록조회 // 걱정됐죠 ㅜ.ㅜ
router.get('/category/:categoryId', authMiddleware, async (req, res) => {
    try {
        let userId;
        if (!res.locals.user) {
            userId = '';
        } else {
            userId = res.locals.user.userId;
        }
        const { categoryId } = req.params;
        const { length } = req.query;
        let existChallenges;
        if (categoryId === 'all') {
            existChallenges = await Challenge.find(
                {},
                { _id: 1, category: 1, participants: 1, thumbnail: 1, title: 1, startAt: 1 }
            ) // projection으로 대체가능  질문..5개 가져오는 기준?!
                .limit(length)
                .lean();
        } else if (categoryId === 'new') {
            existChallenges = await Challenge.find(
                {},
                { _id: 1, category: 1, participants: 1, thumbnail: 1, title: 1, startAt: 1 }
            )
                .sort({ startAt: -1 }) // projection으로 대체가능  질문..5개 가져오는 기준?!
                .limit(length)
                .lean();
        } else if (categoryId === 'popular') {
            existChallenges = await Challenge.find(
                {},
                { _id: 1, category: 1, participants: 1, thumbnail: 1, title: 1, startAt: 1 }
            )
                .sort({ startAt: -1 }) // projection으로 대체가능  질문..5개 가져오는 기준?!
                .limit(length)
                .lean();
        } else {
            existChallenges = await Challenge.find(
                { category: categoryId },
                { _id: 1, category: 1, participants: 1, thumbnail: 1, title: 1, startAt: 1 }
            ) // projection으로 대체가능  질문..5개 가져오는 기준?!
                .limit(length)
                .lean();
        }
        calc.plusChallengeId(existChallenges);
        calc.calcParticipants(existChallenges);
        calc.calcPastDaysAndRound(existChallenges);
        await calc.calcIsLike(existChallenges, userId);
        const challenges = existChallenges;
        res.status(200).json({ challenges });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});
// 상세조회 API
router.get('/challenges/:challengeId', authMiddleware, async (req, res) => {
    try {
        const { challengeId } = req.params;
        let userId;
        if (!res.locals.user) {
            userId = '';
        } else {
            userId = res.locals.user.userId;
        }
        const challenge = await Challenge.findById(challengeId).lean();
        await calc.calcIsLike([challenge], userId);
        await calc.calcIsParticipate([challenge], userId);
        calc.calcParticipants([challenge]);
        calc.plusChallengeId([challenge]);
        calc.calcPastDaysAndRound([challenge]);
        calc.calcStatus([challenge]);
        if (!userId) {
            challenge.proofCount = 0;
            challenge.isUpload = false;
        } else {
            console.log(userId);
            await calc.calcProofCnt([challenge], userId);
            await calc.calcUserIsUpload([challenge], userId);
        }
        res.status(200).send(challenge);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

//챌린지 작성 API 기능 구현 완료
router.post('/challenges', authMiddleware, async (req, res) => {
    try {
        if (!res.locals.user) {
            res.status(401).send({
                errorMessage: '로그인 후 사용하시오',
            });
            return;
        }
        const { userId } = res.locals.user;
        const { title, content, category, thumbnail, startAt, howtoContent } = req.body;
        console.log(startAt, 'startAt'); // ISO TIME 2022-03-08 00:00:00
        let toIsoTime = new Date(moment(startAt));
        console.log(toIsoTime, 'toIsoTime');
        // moment를 넣은 순간 한국시간으로 바뀜 moment(startAt) === 한국시간 2022-03-08 00:00:00(ISOTIME+9시가)
        const participants = [userId];
        const existUser = await User.findById(userId);
        const participate = existUser.participate;
        const createdChallenge = await Challenge.create({
            title,
            content,
            category,
            thumbnail,
            startAt: toIsoTime,
            howtoContent,
            participants,
        });
        console.log(createdChallenge);
        const challengeId = createdChallenge.challengeId;
        participate.push(challengeId);
        await User.updateOne({ _id: userId }, { $set: { participate } });
        res.status(201).json({ message: '챌린지 작성이 완료되었습니다.' }); // created : 201
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
});

// 챌린지 참여하기 기능 구현 완료
router.post('/challenges/:challengeId/join', authMiddleware, async (req, res) => {
    //일단 challengeId로 조회해야함

    if (!res.locals.user) {
        res.status(401).json({
            message: '로그인 후 사용하시오',
        });
        return;
    }

    try {
        const { userId } = res.locals.user;
        const { challengeId } = req.params;
        // 이 부분은 챌린지 시작 전에만 참가할 수 있도록 수정한 부분입니다.
        const statusChallenge = await Challenge.findById(challengeId).lean();
        calc.calcStatus([statusChallenge]);
        if (statusChallenge.status !== 1) {
            res.status(400).json({
                message: '현재 참여할 수 없는 챌린지 입니다.',
            });
            return;
        }
        const existChallenge = await Challenge.findById(challengeId);
        const participants = existChallenge.participants;
        const existUser = await User.findById(userId);
        const participate = existUser.participate;
        if (!participants.includes(userId)) {
            participants.push(userId);
            await Challenge.updateOne({ _id: challengeId }, { $set: { participants } });
            if (!participate.includes(challengeId)) {
                participate.push(challengeId);
                await User.updateOne({ _id: userId }, { $set: { participate } });
            }
            res.status(201).json({ message: '참여성공' });
        } else {
            res.status(400).json({ message: '참여실패' });
        }
    } catch (err) {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

// 챌린지 참여취소 기능 구현 완료
router.delete('/challenges/:challengeId/join', authMiddleware, async (req, res) => {
    if (!res.locals.user) {
        res.status(401).send({
            message: '로그인 후 사용하시오',
        });
        return;
    }
    try {
        const { userId } = res.locals.user;
        const { challengeId } = req.params;

        // 이 부분은 챌린지 시작 전에만 참가할 수 있도록 수정한 부분입니다.
        const statusChallenge = await Challenge.findById(challengeId).lean();
        calc.calcStatus([statusChallenge]);
        if (statusChallenge.status !== 1) {
            res.status(400).json({
                message: '이미 챌린지가 시작되어 참가 취소할 수 없습니다.',
            });
            return;
        }
        const existChallenge = await Challenge.findById(challengeId);
        const participants = existChallenge.participants;
        const existUser = await User.findById(userId);
        const participate = existUser.participate;
        if (participants.includes(userId)) {
            participants.splice(participants.indexOf(userId), 1);
            await Challenge.updateOne({ _id: challengeId }, { $set: { participants } });
            if (participate.includes(challengeId)) {
                participate.splice(participate.indexOf(challengeId), 1);
                await User.updateOne({ _id: userId }, { $set: { participate } });
            }
            res.status(200).json({ message: '참여 취소 성공' });
        } else {
            res.status(400).json({ message: '참여 취소 실패' });
        }
    } catch (err) {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

//찜하기 기능 구현 완료
router.post('/challenges/:challengeId/like', authMiddleware, async (req, res) => {
    if (!res.locals.user) {
        res.status(401).send({
            message: '로그인 후 사용하시오',
        });
        return;
    }
    try {
        const { userId } = res.locals.user;
        const { challengeId } = req.params;
        const existUser = await User.findById(userId);
        const existLikes = existUser.likes;
        if (!existLikes.includes(challengeId)) {
            existLikes.push(challengeId);
            await User.updateOne({ _id: userId }, { $set: { likes: existLikes } });
            res.status(201).json({ message: '찜하기 성공' });
        } else {
            res.status(400).json({ message: '찜하기 실패' });
        }
    } catch (err) {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

// 찜하기 취소 기능 구현 완료
router.delete('/challenges/:challengeId/like', authMiddleware, async (req, res) => {
    if (!res.locals.user) {
        res.status(401).send({
            message: '로그인 후 사용하시오',
        });
        return;
    }
    try {
        const { userId } = res.locals.user;
        const { challengeId } = req.params;
        const existUser = await User.findById(userId);
        const existLikes = existUser.likes;
        if (existLikes.includes(challengeId)) {
            existLikes.splice(existLikes.indexOf(challengeId), 1);
            await User.updateOne({ _id: userId }, { $set: { likes: existLikes } });
            res.status(200).json({ message: '찜하기 취소 성공' });
        } else {
            res.status(400).json({ message: '찜하기 취소 실패' });
        }
    } catch (err) {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }
});

module.exports = router;
