import { useState, useEffect } from 'react';
import { robotsAPI, mockData } from '../services/api';

export const useRobots = () => {
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRobots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await robotsAPI.getAll();
      console.log('API 응답 전체:', response);
      console.log('API 응답 데이터:', response.data);
      console.log('로봇 데이터 타입:', typeof response.data);
      console.log('로봇 데이터 배열 여부:', Array.isArray(response.data));
      setRobots(response.data.data || []);
    } catch (err) {
      console.error('로봇 데이터 로딩 실패:', err);
      setError('서버 연결에 실패했습니다. 테스트 데이터를 사용합니다.');
      setRobots(mockData.robots);
    } finally {
      setLoading(false);
    }
  };

  const updateRobotStatus = async (id, status) => {
    try {
      await robotsAPI.updateStatus(id, status);
      setRobots(prev => 
        prev.map(robot => 
          robot.id === id ? { ...robot, status } : robot
        )
      );
    } catch (err) {
      console.error('로봇 상태 업데이트 실패:', err);
      throw err;
    }
  };

  const updateRobotLocation = async (id, location) => {
    try {
      await robotsAPI.updateLocation(id, location);
      setRobots(prev => 
        prev.map(robot => 
          robot.id === id 
            ? { ...robot, location_x: location.x, location_y: location.y } 
            : robot
        )
      );
    } catch (err) {
      console.error('로봇 위치 업데이트 실패:', err);
      throw err;
    }
  };

  const getRobotById = (id) => {
    return robots.find(robot => robot.id === id);
  };

  const getRobotsByStatus = (status) => {
    return robots.filter(robot => robot.status === status);
  };

  useEffect(() => {
    fetchRobots();
  }, []);

  return {
    robots,
    loading,
    error,
    fetchRobots,
    updateRobotStatus,
    updateRobotLocation,
    getRobotById,
    getRobotsByStatus
  };
}; 