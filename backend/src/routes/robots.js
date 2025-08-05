const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');

// === 상태 수집 관련 API (더 구체적인 라우트들을 먼저 배치) ===

// 상태 수집 서비스 제어
router.get('/service/status', robotController.getServiceStatus);
router.post('/service/start', robotController.startService);
router.post('/service/stop', robotController.stopService);
router.put('/service/settings', robotController.updateServiceSettings);

// 상태 수집 실행
router.post('/collect/all', robotController.collectAllStatus);
router.post('/collect/:id', robotController.collectRobotStatus);

// 상태 통계
router.get('/stats/status', robotController.getStatusStats);
router.get('/stats/connected', robotController.getConnectedCount);

// === AMR 제어 API ===

// AMR 이동 요청
router.post('/move', robotController.requestMove);

// === 기본 로봇 CRUD API ===

// 모든 로봇 조회
router.get('/', robotController.getAllRobots);

// 새 로봇 생성
router.post('/', robotController.createRobot);

// 특정 로봇 조회 (가장 마지막에 배치)
router.get('/:id', robotController.getRobotById);

// 로봇 정보 업데이트
router.put('/:id', robotController.updateRobot);

// 로봇 삭제
router.delete('/:id', robotController.deleteRobot);

module.exports = router; 