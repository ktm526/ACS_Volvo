const Robot = require('../models/Robot');
const robotStatusService = require('../services/robotStatusService');
const axios = require('axios');

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
      let { name, ip_address, port, status, battery, location_x, location_y } = req.body;
      status = status || 'idle';
      battery = battery !== undefined ? battery : 100;
      location_x = location_x !== undefined ? location_x : 0;
      location_y = location_y !== undefined ? location_y : 0;
      port = port !== undefined ? port : 80;

      const robot = await Robot.create({
        name: name.trim(),
        ip_address: ip_address.trim(),
        port,
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
  },

  // === 상태 수집 관련 메서드들 ===

  // 로봇 상태 수집 서비스 상태 조회
  async getServiceStatus(req, res) {
    try {
      const status = robotStatusService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('서비스 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '서비스 상태 조회에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 상태 수집 서비스 시작
  async startService(req, res) {
    try {
      robotStatusService.start();
      res.json({
        success: true,
        message: '로봇 상태 수집 서비스가 시작되었습니다.'
      });
    } catch (error) {
      console.error('서비스 시작 실패:', error);
      res.status(500).json({
        success: false,
        error: '서비스 시작에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 상태 수집 서비스 중지
  async stopService(req, res) {
    try {
      robotStatusService.stop();
      res.json({
        success: true,
        message: '로봇 상태 수집 서비스가 중지되었습니다.'
      });
    } catch (error) {
      console.error('서비스 중지 실패:', error);
      res.status(500).json({
        success: false,
        error: '서비스 중지에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 서비스 설정 변경
  async updateServiceSettings(req, res) {
    try {
      const { pollInterval, httpTimeout } = req.body;

      if (pollInterval && pollInterval >= 1000) {
        robotStatusService.setPollInterval(pollInterval);
      }

      if (httpTimeout && httpTimeout >= 1000) {
        robotStatusService.setHttpTimeout(httpTimeout);
      }

      res.json({
        success: true,
        message: '서비스 설정이 업데이트되었습니다.',
        data: robotStatusService.getStatus()
      });
    } catch (error) {
      console.error('서비스 설정 업데이트 실패:', error);
      res.status(500).json({
        success: false,
        error: '서비스 설정 업데이트에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 수동 상태 수집 실행 (모든 로봇)
  async collectAllStatus(req, res) {
    try {
      await robotStatusService.collectAllRobotStatus();
      res.json({
        success: true,
        message: '모든 로봇의 상태 수집이 실행되었습니다.'
      });
    } catch (error) {
      console.error('전체 상태 수집 실패:', error);
      res.status(500).json({
        success: false,
        error: '상태 수집 실행에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 특정 로봇 상태 수집
  async collectRobotStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: '유효하지 않은 로봇 ID입니다.' 
        });
      }

      await robotStatusService.collectSingleRobotStatus(id);
      res.json({
        success: true,
        message: `로봇 ID ${id}의 상태 수집이 실행되었습니다.`
      });
    } catch (error) {
      console.error('개별 로봇 상태 수집 실패:', error);
      res.status(500).json({
        success: false,
        error: '로봇 상태 수집에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 로봇 상태 통계 조회
  async getStatusStats(req, res) {
    try {
      const stats = await robotStatusService.getRobotStatusStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('상태 통계 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '상태 통계 조회에 실패했습니다.',
        details: error.message
      });
    }
  },

  // 연결된 로봇 수 조회
  async getConnectedCount(req, res) {
    try {
      const count = await robotStatusService.getConnectedRobotsCount();
      res.json({
        success: true,
        data: { connectedCount: count }
      });
    } catch (error) {
      console.error('연결된 로봇 수 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: '연결된 로봇 수 조회에 실패했습니다.',
        details: error.message
      });
    }
  },

  // AMR 이동 요청
  async requestMove(req, res) {
    try {
      const { robotId, nodeId, timestamp } = req.body;

      // 입력값 검증
      if (!robotId || !nodeId) {
        return res.status(400).json({
          success: false,
          error: '로봇 ID와 노드 ID는 필수입니다.',
          message: '로봇 ID와 노드 ID를 모두 제공해주세요.'
        });
      }

      // 로봇 존재 여부 확인
      const robot = await Robot.findById(parseInt(robotId));
      if (!robot) {
        return res.status(404).json({
          success: false,
          error: '로봇을 찾을 수 없습니다.',
          message: `ID ${robotId}인 로봇이 존재하지 않습니다.`
        });
      }

      // 로봇 IP 주소 확인
      if (!robot.ip_address) {
        return res.status(400).json({
          success: false,
          error: '로봇 IP 주소가 설정되지 않았습니다.',
          message: `로봇 ${robot.name}의 IP 주소가 설정되지 않았습니다.`
        });
      }

      // 로봇 상태 확인 (이동 가능한 상태인지)
      if (robot.status === 'error' || robot.status === 'disconnected') {
        return res.status(400).json({
          success: false,
          error: '로봇이 이동 불가능한 상태입니다.',
          message: `로봇 ${robot.name}은 현재 ${robot.status} 상태로 이동할 수 없습니다.`
        });
      }

      console.log(`🚀 AMR 이동 요청 수신:`, {
        robotId,
        nodeId,
        robotName: robot.name,
        robotIP: robot.ip_address,
        robotPort: robot.port || 80,
        robotStatus: robot.status,
        timestamp: timestamp || new Date().toISOString()
      });

      // 실제 로봇에 이동 명령 전송
      try {
        const port = robot.port || 80;
        const robotCommandUrl = `http://${robot.ip_address}:${port}/api/v1/amr/command`;
        
        const commandPayload = {
          action: "execute",
          type: "navigate",
          params: {
            goto_node_id: nodeId
          }
        };

        console.log(`📡 로봇에 명령 전송: ${robotCommandUrl}`, commandPayload);

        const robotResponse = await axios.post(robotCommandUrl, commandPayload, {
          timeout: 10000, // 10초 타임아웃
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log(`✅ 로봇 응답 성공:`, {
          status: robotResponse.status,
          data: robotResponse.data
        });

        // 로봇 응답이 성공적이면 데이터베이스 상태 업데이트
        await robot.update({
          status: 'moving',
          currentMission: `노드 ${nodeId}로 이동 중`,
          destination_node_id: nodeId,
          last_command_sent: new Date().toISOString()
        });

        // 성공 응답
        res.json({
          success: true,
          message: 'AMR 이동 요청이 성공적으로 처리되었습니다.',
          data: {
            robotId: robot.id,
            robotName: robot.name,
            nodeId,
            previousStatus: robot.status,
            newStatus: 'moving',
            timestamp: timestamp || new Date().toISOString(),
            robotResponse: robotResponse.data
          }
        });

        console.log(`🎯 AMR 이동 요청 완료: 로봇 ${robot.name} (ID: ${robot.id}) -> 노드 ${nodeId}`);

      } catch (robotError) {
        // 로봇 통신 실패
        console.error(`❌ 로봇 통신 실패 (${robot.ip_address}:${robot.port || 80}):`, robotError.message);

        // 로봇을 disconnected 상태로 마킹
        await robot.markAsDisconnected(`이동 명령 전송 실패: ${robotError.message}`);

        return res.status(503).json({
          success: false,
          error: '로봇과 통신할 수 없습니다.',
          message: `로봇 ${robot.name}에 이동 명령을 전송하는데 실패했습니다: ${robotError.message}`,
          details: {
            robotIP: robot.ip_address,
            robotPort: robot.port || 80,
            errorType: robotError.code || 'UNKNOWN_ERROR'
          }
        });
      }

    } catch (error) {
      console.error('AMR 이동 요청 실패:', error);
      res.status(500).json({
        success: false,
        error: 'AMR 이동 요청 처리 중 오류가 발생했습니다.',
        message: error.message,
        details: error.stack
      });
    }
  }
};

module.exports = robotController; 