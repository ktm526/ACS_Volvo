const Robot = require('../models/Robot');

const robotController = {
  // 모든 로봇 조회
  async getAllRobots(req, res) {
    try {
      const robots = await Robot.findAll();
      res.json({ data: robots });
    } catch (error) {
      console.error('로봇 목록 조회 에러:', error);
      res.status(500).json({ error: '로봇 목록 조회 중 오류가 발생했습니다.' });
    }
  },

  // 특정 로봇 조회
  async getRobotById(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
      }

      const robot = await Robot.findById(id);
      
      if (!robot) {
        return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
      }
      
      res.json({ data: robot });
    } catch (error) {
      console.error('로봇 조회 에러:', error);
      res.status(500).json({ error: '로봇 조회 중 오류가 발생했습니다.' });
    }
  },

  // 새 로봇 생성
  async createRobot(req, res) {
    try {
      // 데이터 validation
      const validationErrors = Robot.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors[0] });
      }

      // default 값 설정
      let { name, ip_address, status, battery, location_x, location_y } = req.body;
      status = status || 'idle';
      battery = battery !== undefined ? battery : 100;
      location_x = location_x !== undefined ? location_x : 0;
      location_y = location_y !== undefined ? location_y : 0;

      const robot = await Robot.create({
        name: name.trim(),
        ip_address: ip_address.trim(),
        status,
        battery,
        location_x,
        location_y
      });

      res.status(201).json({ 
        message: '로봇이 성공적으로 생성되었습니다.', 
        data: robot 
      });
    } catch (error) {
      console.error('로봇 생성 에러:', error);
      res.status(500).json({ error: '로봇 생성 중 오류가 발생했습니다.' });
    }
  },

  // 로봇 정보 업데이트
  async updateRobot(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
      }

      const robot = await Robot.findById(id);
      
      if (!robot) {
        return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
      }

      // 업데이트할 데이터 validation
      const validationErrors = Robot.validate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors[0] });
      }

      const updatedRobot = await robot.update(req.body);
      
      res.json({ 
        message: '로봇 정보가 성공적으로 업데이트되었습니다.', 
        data: updatedRobot 
      });
    } catch (error) {
      console.error('로봇 업데이트 에러:', error);
      res.status(500).json({ error: '로봇 업데이트 중 오류가 발생했습니다.' });
    }
  },

  // 로봇 삭제
  async deleteRobot(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
      }

      const robot = await Robot.findById(id);
      
      if (!robot) {
        return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
      }

      await robot.delete();
      
      res.json({ message: '로봇이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('로봇 삭제 에러:', error);
      res.status(500).json({ error: '로봇 삭제 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = robotController; 