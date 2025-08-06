const express = require('express');
const router = express.Router();

// 라우트 파일들 import
const robotRoutes = require('./robots');
const mapRoutes = require('./maps');
const missionRoutes = require('./missions');

// 기본 라우트
router.get('/', (req, res) => {
  res.json({ 
    message: 'AMR 관제 시스템 API가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      robots: '/api/robots',
      maps: '/api/maps',
      missions: '/api/missions'
    }
  });
});

// API 라우트 등록
router.use('/robots', robotRoutes);
router.use('/maps', mapRoutes);
router.use('/missions', missionRoutes);

module.exports = router; 