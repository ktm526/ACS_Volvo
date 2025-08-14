import axios from 'axios';
import { API_ENDPOINTS } from '../constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 로봇 관련 API
export const robotsAPI = {
  // 모든 로봇 조회
  getAll: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ROBOTS);
      return response.data;
    } catch (error) {
      throw new Error('로봇 데이터를 불러오는데 실패했습니다.');
    }
  },

  // 특정 로봇 조회
  getById: async (id) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.ROBOTS}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('로봇 정보를 불러오는데 실패했습니다.');
    }
  },

  // 로봇 상태 업데이트
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`${API_ENDPOINTS.ROBOTS}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error('로봇 상태 업데이트에 실패했습니다.');
    }
  },

  // 로봇 위치 업데이트
  updateLocation: async (id, location) => {
    try {
      const response = await apiClient.patch(`${API_ENDPOINTS.ROBOTS}/${id}/location`, location);
      return response.data;
    } catch (error) {
      throw new Error('로봇 위치 업데이트에 실패했습니다.');
    }
  },

  // 로봇 방향 업데이트
  updateAngle: async (id, angle) => {
    try {
      const response = await apiClient.patch(`${API_ENDPOINTS.ROBOTS}/${id}/location`, { angle });
      return response.data;
    } catch (error) {
      throw new Error('로봇 방향 업데이트에 실패했습니다.');
    }
  },

  // AMR 이동 요청
  requestMove: async (robotId, nodeId) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.MOVE_REQUEST, {
        robotId,
        nodeId,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('AMR 이동 요청 API 에러:', error);
      throw new Error(error.response?.data?.message || 'AMR 이동 요청에 실패했습니다.');
    }
  }
};

// 임무 관련 API
export const missionsAPI = {
  // 모든 임무 조회
  getAll: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MISSIONS);
      return response.data;
    } catch (error) {
      throw new Error('임무 데이터를 불러오는데 실패했습니다.');
    }
  },

  // 특정 임무 조회
  getById: async (id) => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.MISSIONS}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('임무 정보를 불러오는데 실패했습니다.');
    }
  },

  // 새 임무 생성
  create: async (missionData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.MISSIONS, missionData);
      return response.data;
    } catch (error) {
      throw new Error('임무 생성에 실패했습니다.');
    }
  },

  // 임무 상태 업데이트
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`${API_ENDPOINTS.MISSIONS}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error('임무 상태 업데이트에 실패했습니다.');
    }
  },

  // 임무 삭제
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.MISSIONS}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('임무 삭제에 실패했습니다.');
    }
  }
};

// 테스트 데이터 (서버 연결 실패 시 사용)
// 통합 API 객체 (Sidebar에서 사용)
export const api = {
  getRobots: () => robotsAPI.getAll(),
  getMissions: () => missionsAPI.getAll(),
  createMission: (data) => missionsAPI.create(data),
  updateMissionStatus: (id, status) => missionsAPI.updateStatus(id, status),
  deleteMission: (id) => missionsAPI.delete(id),
  updateRobotStatus: (id, status) => robotsAPI.updateStatus(id, status),
  updateRobotLocation: (id, location) => robotsAPI.updateLocation(id, location)
};

export const mockData = {
  robots: [
    { 
      id: 1, 
      name: '로봇 Alpha', 
      status: 'moving', 
      battery: 75, 
      location_x: -2, 
      location_y: 3,
      current_mission: '부품 운반'
    },
    { 
      id: 2, 
      name: '로봇 Beta', 
      status: 'idle', 
      battery: 90, 
      location_x: 2, 
      location_y: -2,
      current_mission: null
    },
    { 
      id: 3, 
      name: '로봇 Gamma', 
      status: 'charging', 
      battery: 25, 
      location_x: -8, 
      location_y: 8,
      current_mission: null
    },
    { 
      id: 4, 
      name: '로봇 Delta', 
      status: 'moving', 
      battery: 60, 
      location_x: 5, 
      location_y: 5,
      current_mission: '창고 정리'
    },
    { 
      id: 5, 
      name: '로봇 Echo', 
      status: 'error', 
      battery: 45, 
      location_x: -5, 
      location_y: -5,
      current_mission: null
    }
  ],
  missions: [
    { 
      id: 1, 
      robot_id: 1, 
      mission_type: '운반', 
      status: 'in_progress', 
      start_x: -2, 
      start_y: 3, 
      target_x: -8, 
      target_y: 8,
      priority: 'high'
    },
    { 
      id: 2, 
      robot_id: 4, 
      mission_type: '정리', 
      status: 'in_progress', 
      start_x: 5, 
      start_y: 5, 
      target_x: 8, 
      target_y: 8,
      priority: 'medium'
    },
    { 
      id: 3, 
      robot_id: null, 
      mission_type: '청소', 
      status: 'pending', 
      start_x: 0, 
      start_y: 0, 
      target_x: -8, 
      target_y: -8,
      priority: 'low'
    }
  ]
};

export default apiClient; 