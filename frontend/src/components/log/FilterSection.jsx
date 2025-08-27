import React from 'react';

const FilterSection = ({ filters = {}, onFilterChange = () => {}, uniqueRobots = [] }) => {
  // 필터 초기화 함수
  const handleResetFilters = () => {
    onFilterChange('level', 'all');
    onFilterChange('category', 'all');
    onFilterChange('robot', 'all');
    onFilterChange('dateFrom', '');
    onFilterChange('dateTo', '');
  };

  // 활성 필터가 있는지 확인
  const hasActiveFilters = (filters.level && filters.level !== 'all') || 
                          (filters.category && filters.category !== 'all') || 
                          (filters.robot && filters.robot !== 'all') || 
                          filters.dateFrom || 
                          filters.dateTo;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-filter"></i>
          필터 및 검색
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: 'var(--space-xs) var(--space-sm)',
              backgroundColor: 'rgba(239, 71, 111, 0.1)',
              border: '1px solid rgba(239, 71, 111, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#ef476f',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 71, 111, 0.1)';
            }}
          >
            <i className="fas fa-times"></i>
            초기화
          </button>
        )}
      </div>
      <div className="card-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          {/* 레벨 필터 */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
              로그 레벨
            </label>
            <select
              value={filters.level || 'all'}
              onChange={(e) => onFilterChange('level', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="all">전체</option>
              <option value="success">성공</option>
              <option value="info">정보</option>
              <option value="warning">경고</option>
              <option value="error">오류</option>
            </select>
          </div>

          {/* 카테고리 필터 */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
              카테고리
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="all">전체</option>
              <option value="mission">임무</option>
              <option value="robot">로봇</option>
              <option value="system">시스템</option>
              <option value="navigation">네비게이션</option>
            </select>
          </div>

          {/* 로봇 필터 */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
              로봇
            </label>
            <select
              value={filters.robot || 'all'}
              onChange={(e) => onFilterChange('robot', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="all">전체</option>
              {(uniqueRobots || []).map(robot => (
                <option key={robot} value={robot}>{robot}</option>
              ))}
            </select>
          </div>

          {/* 시작 날짜 */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
              시작 날짜
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 2px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
              종료 날짜
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-sm)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 2px rgba(0, 212, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSection; 