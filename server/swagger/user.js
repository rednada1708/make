/**
 * @swagger
 * /api/users/signup:
 *   pots:
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
 *        description: 사용자가 서버로 전달하는 값에 따라 결과 값은 다릅니다.(회원가입)
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 */
