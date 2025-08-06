const express = require('express');
const router = express.Router();
const Mission = require('../models/Mission');

// 모든 미션 조회
router.get('/', async (req, res) => {
  try {
    const missions = await Mission.findAll();
    res.json({ data: missions.map(mission => mission.toJSON()) });
  } catch (error) {
    console.error('미션 조회 실패:', error);
    res.status(500).json({ error: '미션 조회 중 오류가 발생했습니다.' });
  }
});

// 새 미션 생성
router.post('/', async (req, res) => {
  try {
    console.log('미션 생성 요청:', req.body);
    
    // 데이터 유효성 검증
    const validationErrors = Mission.validate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }
    
    // 미션 생성
    const mission = await Mission.create(req.body);
    
    console.log('미션 생성 성공:', mission.toJSON());
    res.status(201).json({ 
      message: '미션이 성공적으로 생성되었습니다.', 
      data: mission.toJSON() 
    });
  } catch (error) {
    console.error('미션 생성 실패:', error);
    res.status(500).json({ error: '미션 생성 중 오류가 발생했습니다.' });
  }
});

// 특정 미션 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await Mission.findById(id);
    
    if (!mission) {
      return res.status(404).json({ error: '미션을 찾을 수 없습니다.' });
    }
    
    res.json({ data: mission.toJSON() });
  } catch (error) {
    console.error('미션 조회 실패:', error);
    res.status(500).json({ error: '미션 조회 중 오류가 발생했습니다.' });
  }
});

// 미션 상태 업데이트
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: '상태는 필수입니다.' });
    }
    
    const mission = await Mission.findById(id);
    if (!mission) {
      return res.status(404).json({ error: '미션을 찾을 수 없습니다.' });
    }
    
    await mission.updateStatus(status);
    
    res.json({ 
      message: '미션 상태가 업데이트되었습니다.',
      data: mission.toJSON() 
    });
  } catch (error) {
    console.error('미션 상태 업데이트 실패:', error);
    res.status(500).json({ error: '미션 상태 업데이트 중 오류가 발생했습니다.' });
  }
});

// 미션 진행률 업데이트
router.patch('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (progress === undefined || progress === null) {
      return res.status(400).json({ error: '진행률은 필수입니다.' });
    }
    
    const mission = await Mission.findById(id);
    if (!mission) {
      return res.status(404).json({ error: '미션을 찾을 수 없습니다.' });
    }
    
    await mission.updateProgress(progress);
    
    res.json({ 
      message: '미션 진행률이 업데이트되었습니다.',
      data: mission.toJSON() 
    });
  } catch (error) {
    console.error('미션 진행률 업데이트 실패:', error);
    res.status(500).json({ error: '미션 진행률 업데이트 중 오류가 발생했습니다.' });
  }
});

// 미션 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await Mission.findById(id);
    
    if (!mission) {
      return res.status(404).json({ error: '미션을 찾을 수 없습니다.' });
    }
    
    await mission.delete();
    
    res.json({ message: '미션이 삭제되었습니다.' });
  } catch (error) {
    console.error('미션 삭제 실패:', error);
    res.status(500).json({ error: '미션 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 