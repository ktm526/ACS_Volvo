const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');

// 모든 로봇 조회
router.get('/', robotController.getAllRobots);

// 특정 로봇 조회
router.get('/:id', robotController.getRobotById);

// 새 로봇 생성
router.post('/', robotController.createRobot);

// 로봇 정보 업데이트
router.put('/:id', robotController.updateRobot);

// 로봇 삭제
router.delete('/:id', robotController.deleteRobot);

module.exports = router; 