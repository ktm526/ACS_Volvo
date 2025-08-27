const express = require('express');
const router = express.Router();
const pcdController = require('../controllers/pcdController');

// PCD 파일 업로드 및 처리
router.post('/upload', pcdController.upload, pcdController.uploadAndProcess);

// 처리된 PCD 데이터 조회
router.get('/processed/:filename', pcdController.getProcessedData);

// 업로드 상태 확인
router.get('/status', pcdController.getUploadStatus);

// 처리된 파일 목록 조회
router.get('/files', pcdController.listProcessedFiles);

module.exports = router;
