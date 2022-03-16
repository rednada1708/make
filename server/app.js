require('dotenv').config();
const express = require('express');
const { swaggerUi, specs } = require('./modules/swagger');
const connect = require('./models/index');
const cors = require('cors');

const port = 3000;
const app = express();
const challengeRouter = require('./routes/challenge');
const userRouter = require('./routes/user');
const mypageRouter = require('./routes/mypage');
const proofshotRouter = require('./routes/proofshot');
const uploadRouter = require('./routes/upload');
connect();

//body 읽기
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 라우터 배치
app.use('/api', [challengeRouter, userRouter, uploadRouter]);

app.use('/api/users', userRouter);
app.use('/api/mypage', mypageRouter);
app.use('/api/proofshot', proofshotRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/', (req, res) => {
    res.status(200).send('hello world');
});

app.listen(port, () => {
    console.log('running on port', port);
});
