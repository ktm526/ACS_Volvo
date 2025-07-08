import { useState, useEffect } from 'react';
import { missionsAPI, mockData } from '../services/api';

export const useMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await missionsAPI.getAll();
      setMissions(response.data.data || []);
    } catch (err) {
      console.error('임무 데이터 로딩 실패:', err);
      setError('서버 연결에 실패했습니다. 테스트 데이터를 사용합니다.');
      setMissions(mockData.missions);
    } finally {
      setLoading(false);
    }
  };

  const createMission = async (missionData) => {
    try {
      const response = await missionsAPI.create(missionData);
      setMissions(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('임무 생성 실패:', err);
      throw err;
    }
  };

  const updateMissionStatus = async (id, status) => {
    try {
      await missionsAPI.updateStatus(id, status);
      setMissions(prev => 
        prev.map(mission => 
          mission.id === id ? { ...mission, status } : mission
        )
      );
    } catch (err) {
      console.error('임무 상태 업데이트 실패:', err);
      throw err;
    }
  };

  const deleteMission = async (id) => {
    try {
      await missionsAPI.delete(id);
      setMissions(prev => prev.filter(mission => mission.id !== id));
    } catch (err) {
      console.error('임무 삭제 실패:', err);
      throw err;
    }
  };

  const getMissionById = (id) => {
    return missions.find(mission => mission.id === id);
  };

  const getMissionsByRobot = (robotId) => {
    return missions.filter(mission => mission.robot_id === robotId);
  };

  const getMissionsByStatus = (status) => {
    return missions.filter(mission => mission.status === status);
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  return {
    missions,
    loading,
    error,
    fetchMissions,
    createMission,
    updateMissionStatus,
    deleteMission,
    getMissionById,
    getMissionsByRobot,
    getMissionsByStatus
  };
}; 