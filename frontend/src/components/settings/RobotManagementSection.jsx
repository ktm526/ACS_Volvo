import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext.jsx';
import RobotList from './RobotList.jsx';
import RobotAddForm from './RobotAddForm.jsx';
import Modal from './Modal.jsx';

const RobotManagementSection = ({ 
  robots, 
  loading, 
  onLoadRobots, 
  onAddRobot, 
  onDeleteRobot 
}) => {
  const { actions } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRobot = async (robotData) => {
    await onAddRobot(robotData);
    setShowAddForm(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-robot"></i>
          로봇 관리
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={onLoadRobots}
            className="control-btn"
            style={{ 
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              minWidth: 'auto'
            }}
          >
            <i className="fas fa-refresh"></i>
            새로고침
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="control-btn primary"
            style={{ 
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              minWidth: 'auto'
            }}
          >
            <i className="fas fa-plus"></i>
            로봇 추가
          </button>
        </div>
      </div>

      <div className="card-content">
        <RobotList
          robots={robots}
          loading={loading}
          onDelete={onDeleteRobot}
          onRefresh={onLoadRobots}
        />
      </div>

      {/* 로봇 추가 모달 */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="새 로봇 추가"
      >
        <RobotAddForm
          onSubmit={handleAddRobot}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>
    </div>
  );
};

export default RobotManagementSection; 