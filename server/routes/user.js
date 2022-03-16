const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const authMiddleware = require('../middlewares/auth-middleware');
const bcrypt = require('bcrypt');
/**
 * @swagger
 * /api/users/signup:
 *   post:
 *    summary: "회원 가입"
 *    description: "회원가입 api"
 *    tags: [Users]
 *    requestBody:
 *      description: 회원가입
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: "이메일"
 *              nickname:
 *                type: string
 *                description: "닉네임"
 *              password:
 *                type: string
 *                description: "패스워드"
 *              confirmPassword:
 *                type: string
 *                description: "패스워드 확인"
 *    responses:
 *      "200":
 *        description: 회원가입 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 */
// 회원가입시 각 입력 항목 유효성 검사
// 이메일, 닉네임 체크 api 에서도 사용하기 위해 각 validation(joi obj) 분리
const email_validation = joi.object({
    email: joi.string().email().trim(true).required(),
});

const nickname_validation = joi.object({
    //nickname은 3~15 영어,한자,숫자
    nickname: joi
        .string()
        .pattern(/^[A-Za-z0-9가-힣]{3,15}$/)
        .trim(true)
        .required(),
});
const password_validation = joi.object({
    //password는 최소 8 자, 최소 하나의 문자, 하나의 숫자 및 하나의 특수 문자 :
    password: joi
        .string()
        .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,16}$/)
        .required(),
});

// 회원가입 API
router.post('/signup', async (req, res) => {
    try {
        const { email, nickname, password, confirmPassword } = req.body;
        await email_validation.validateAsync({ email });
        await nickname_validation.validateAsync({ nickname });
        await password_validation.validateAsync({ password });

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: '비밀번호가 일치하지 않습니다.',
            });
        }
        const existEmail = await User.findOne({ email }).exec();
        if (existEmail) {
            return res.status(400).json({
                message: '이미 가입된 이메일입니다.',
            });
        }

        const existNickname = await User.findOne({ nickname }).exec();
        if (existNickname) {
            return res.status(400).json({
                message: '이미 사용중인 닉네임입니다.',
            });
        }

        const user = new User({ email, nickname, password });
        await user.save();
        return res.status(201).json({ message: '회원가입이 완료되었습니다!' });
    } catch (error) {
        let joiError = error.details[0].message;
        console.log(joiError);
        if (joiError.includes('email')) {
            res.status(400).json({
                message: '이메일 형식을 확인해주세요.',
            });
        }
        if (joiError.includes('nickname')) {
            res.status(400).json({
                message: '닉네임은 3자 이상, 15자 이하의 영어,한글,숫자로만 구성되어야 합니다.',
            });
        }
        if (joiError.includes('password')) {
            res.status(400).json({
                message:
                    '비밀번호는 8자 이상, 16자 이하로 구성되며, 문자와 숫자 및 특수 문자가 모두 포함 되어야 합니다.',
            });
        }
    }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *    summary: "로그인"
 *    description: "로그인 api"
 *    tags: [Users]
 *    requestBody:
 *      description: 로그인
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: "이메일"
 *              password:
 *                type: string
 *                description: "패스워드"
 *    responses:
 *      "200":
 *        description: 로그인 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                token:
 *                  type: string
 *                email:
 *                  type: string
 *                message:
 *                  type: string
 *
 */
// 로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).exec();

        //email에 해당하는 유저가 없는 경우
        if (!user) {
            return res.status(400).json({
                result: '이메일이나 비밀번호를 확인해주세요.',
            });
        }

        //password 해당하는 유저가 없는 경우
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (!isSamePassword) {
            return res.status(400).json({
                message: '이메일이나 비밀번호를 확인해주세요!',
            });
        }

        const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY);
        return res.status(201).json({
            token,
            nickname: user.nickname,
            message: '로그인 되었습니다.',
        });
    } catch (err) {
        res.status(400).json({
            message: '이메일과 비밀번호를 모두 입력해주세요.',
        });
    }
});

/**
 * @swagger
 * /api/users/checkEmail:
 *   post:
 *    summary: "이메일 양식체크, 중복체크"
 *    description: "이메일 양식체크, 중복체크"
 *    tags: [Users]
 *    requestBody:
 *      description: 이메일 양식체크, 중복체크
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *                description: "이메일"
 *    responses:
 *      "200":
 *        description: 양식체크 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 */
//checkEmail
router.post('/checkEmail', async (req, res) => {
    try {
        const { email } = await email_validation.validateAsync(req.body);
        const user = await User.findOne({ email }).exec();
        if (!user) {
            return res.status(200).json({ message: '사용 가능한 이메일 입니다.' });
        } else {
            return res.status(400).json({ message: '이미 가입된 이메일 입니다.' });
        }
    } catch (error) {
        let joiError = error.details[0].message;
        console.log(joiError);
        return res.status(400).json({
            message: '이메일 형식을 확인해주세요.',
        });
    }
});

/**
 * @swagger
 * /api/users/checkNickname:
 *   post:
 *    summary: "닉네임 양식체크, 중복체크"
 *    description: "닉네임 양식체크, 중복체크"
 *    tags: [Users]
 *    requestBody:
 *      description: 닉네임 양식체크, 중복체크
 *      required: true
 *      content:
 *        application/x-www-form-urlencoded:
 *          schema:
 *            type: object
 *            properties:
 *              nickname:
 *                type: string
 *                description: "닉네임"
 *    responses:
 *      "200":
 *        description: 양식체크 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 */
router.post('/checkNickname', async (req, res) => {
    try {
        const { nickname } = await nickname_validation.validateAsync(req.body);
        const user = await User.findOne({ nickname }).exec();
        if (!user) {
            return res.status(200).json({ message: '사용 가능한 닉네임 입니다.' });
        } else {
            return res.status(400).json({ message: '이미 가입된 닉네임 입니다.' });
        }
    } catch (error) {
        return res.status(400).json({
            message: '닉네임은 3자 이상, 15자 이하의 영어,한자,숫자로만 구성되어야 합니다.',
        });
    }
});

/**
 * @swagger
 * /api/users/checkLogin:
 *   get:
 *    summary: "로그인 유저 정보 받아오기"
 *    description: "로그인 유저 정보 받아오기"
 *    tags: [Users]
 *    responses:
 *      "200":
 *        description: 유저 정보 받아오기 성공 시
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                nickname:
 *                  type: string
 */
router.get('/checkLogin', authMiddleware, async (req, res) => {
    const { user } = res.locals; // user object
    if (user === undefined) {
        return res.status(400).json({ message: '로그인 후 사용하시오' });
    }
    res.status(200).json({
        email: user.email,
        nickname: user.nickname,
    });
});

module.exports = router;
