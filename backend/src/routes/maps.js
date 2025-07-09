const express = require('express');
const { mapController, upload } = require('../controllers/mapController');

const router = express.Router();

// 맵 목록 조회
router.get('/', mapController.getAllMaps);

// 맵 상세 조회
router.get('/:id', mapController.getMapById);

// 맵 픽셀 데이터 조회
router.get('/:id/pixels', mapController.getMapPixelData);

// 맵 데이터 (노드 + 픽셀) 조회
router.get('/:id/data', mapController.getMapData);

// 맵 생성 (파일 업로드 포함)
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'metadata', maxCount: 1 },
  { name: 'nodes', maxCount: 1 }
]), mapController.createMap);

// 맵 수정
router.put('/:id', mapController.updateMap);

// 맵 삭제
router.delete('/:id', mapController.deleteMap);

// 파일 다운로드
router.get('/:id/download/:fileType', mapController.downloadFile);

module.exports = router; 