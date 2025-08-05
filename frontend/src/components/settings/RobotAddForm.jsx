import React, { useState } from 'react';

const RobotAddForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '로봇 이름을 입력해주세요.';
    }

    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP 주소를 입력해주세요.';
    } else {
      // IP 주소 형식 검증
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(formData.ip_address)) {
        newErrors.ip_address = '올바른 IP 주소 형식을 입력해주세요.';
      }
    }

    if (!formData.port.trim()) {
      newErrors.port = '포트 번호를 입력해주세요.';
    } else {
      const port = parseInt(formData.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors.port = '포트 번호는 1-65535 범위의 숫자여야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // 포트를 숫자로 변환하여 전송
      const submissionData = {
        ...formData,
        port: parseInt(formData.port)
      };
      onSubmit(submissionData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-md)'
      }}>
        {/* 로봇 이름 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-xs)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500
          }}>
            로봇 이름 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 로봇 A"
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid ${errors.name ? 'var(--status-error)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.name ? 'var(--status-error)' : 'var(--border-primary)';
            }}
          />
          {errors.name && (
            <span style={{ color: 'var(--status-error)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-xs)', display: 'block' }}>
              {errors.name}
            </span>
          )}
        </div>

        {/* IP 주소 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-xs)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500
          }}>
            IP 주소 *
          </label>
          <input
            type="text"
            name="ip_address"
            value={formData.ip_address}
            onChange={handleChange}
            placeholder="예: 192.168.1.100"
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid ${errors.ip_address ? 'var(--status-error)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.ip_address ? 'var(--status-error)' : 'var(--border-primary)';
            }}
          />
          {errors.ip_address && (
            <span style={{ color: 'var(--status-error)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-xs)', display: 'block' }}>
              {errors.ip_address}
            </span>
          )}
        </div>

        {/* 포트 번호 */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: 'var(--space-xs)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500
          }}>
            포트 번호 *
          </label>
          <input
            type="number"
            name="port"
            value={formData.port}
            onChange={handleChange}
            placeholder="예: 8080"
            min="1"
            max="65535"
            style={{
              width: '100%',
              padding: 'var(--space-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid ${errors.port ? 'var(--status-error)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.port ? 'var(--status-error)' : 'var(--border-primary)';
            }}
          />
          {errors.port && (
            <span style={{ color: 'var(--status-error)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-xs)', display: 'block' }}>
              {errors.port}
            </span>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-lg)',
        justifyContent: 'flex-end'
      }}>
        <button
          type="button"
          onClick={onCancel}
          className="control-btn"
          style={{ minWidth: '80px' }}
        >
          취소
        </button>
        <button
          type="submit"
          className="control-btn primary"
          style={{ minWidth: '80px' }}
        >
          <i className="fas fa-plus"></i>
          추가
        </button>
      </div>
    </form>
  );
};

export default RobotAddForm; 