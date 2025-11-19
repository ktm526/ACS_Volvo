const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const requestMonitor = require('./src/middleware/requestMonitor');

// 라우트 import
const routes = require('./src/routes');

// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(helmet()); // 보안 강화
app.use(cors());   // CORS 활성화
app.use(express.json());
app.use(requestMonitor());
//app.use(morgan('dev')); // 로깅

// 라우트 설정
app.use('/api', routes);

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl 
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 에러:', err);
  res.status(500).json({ 
    error: '내부 서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app; 