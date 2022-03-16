const moment = require('moment');
const Proofshot = require('../models/proofShot');
const User = require('../models/user');

module.exports = {
    //challegeId 추가하는 함수
    plusChallengeId: (challenges) => {
        for (const i of challenges) {
            i.challengeId = i._id;
        }
    },
    // isLike 계산해주는 함수
    calcIsLike: async (challenges, user) => {
        for (const i of challenges) {
            if (!user) {
                i.isLike = false;
            } else {
                let challengeId = i._id;
                let existUser = await User.findById(user);
                let userLikes = existUser.likes;
                if (userLikes.includes(challengeId)) {
                    i.isLike = true;
                } else {
                    i.isLike = false;
                }
            }
        }
    },
    //isParticipate 계산함수
    calcIsParticipate: async (challenges, user) => {
        for (const i of challenges) {
            if (!user) {
                i.isParticipate = false;
            } else {
                let challengeId = i._id;
                let existUser = await User.findById(user);
                let userParticipate = existUser.participate;
                if (userParticipate.includes(challengeId)) {
                    i.isParticipate = true;
                } else {
                    i.isParticipate = false;
                }
            }
        }
    },

    //status 계산
    calcStatus: (challenges) => {
        for (const i of challenges) {
            const start = i.startAt;
            const cur = new Date().toLocaleDateString();
            const end = new Date(cur); //    3/8:15:00

            const dateDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            if (dateDiff < 0) {
                i.status = 1; //시작 전
            } else if (dateDiff > 30) {
                i.status = 2; //완료
            } else {
                i.status = 0; //진행중
            }
        }
    },

    //참여자 수 계산
    calcParticipants: (challenges) => {
        for (const i of challenges) {
            i.participants = i.participants.length;
        }
    },

    //총 인증횟수 계산 await
    calcProofCnt: async (challenges, user) => {
        for (const i of challenges) {
            let challengeId = i._id;
            let proofCount = await Proofshot.count({ challengeId, userId: user.userId });
            i.proofCount = proofCount;
        }
    },

    //경과 날짜, round 계산
    calcPastDaysAndRound: (challenges) => {
        let today = moment().format('YYYY-MM-DD'); //2022-03-05 00:00:00
        for (const i of challenges) {
            let pastDays = (moment(today) - moment(i.startAt)) / (1000 * 60 * 60 * 24);
            pastDays += 1;
            i.pastDays = pastDays;
            i.round = Math.floor((pastDays - 1) / 3) + 1;
        }
    },

    // //금일 업로드 체크 await
    // calcIsUpload: async (challenges) => {
    //     let today = moment().format('YYYY-MM-DD'); //2022-03-05 00:00:00
    //     for (const i of challenges) {
    //         //금일 인증 여부
    //         if (
    //             await Proofshot.findOne({
    //                 challengeId: i._id,
    //                 createdAt: {
    //                     $gte: new Date(today).toISOString(),
    //                     $lt: new Date(moment(today).add(1, 'days')).toISOString(),
    //                 },
    //             })
    //         ) {
    //             i.isUpload = true;
    //         } else i.isUpload = false;
    //     }
    // },

    //유저 금일 업로드 체크 await
    calcUserIsUpload: async (challenges, userId) => {
        let today = new Date(moment().format('YYYY-MM-DD')); //2022-03-05 00:00:00Z     15:00Z
        for (const i of challenges) {
            const todayProofshot = await Proofshot.findOne({
                challengeId: i._id,
                userId: userId,
                createdAt: {
                    $gte: new Date(moment(today).add(-9, 'hours')),
                    $lt: new Date(moment(today).add(15, 'hours')),
                },
            });
            console.log(todayProofshot);
            if (!todayProofshot) {
                i.isUpload = false;
            } else {
                i.isUpload = true;
            }
        }
    },
};
