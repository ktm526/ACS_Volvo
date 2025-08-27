import React from 'react';
import FilterSection from './FilterSection';
import StatsDashboard from './StatsDashboard';
import RobotWorkTimeChart from './RobotWorkTimeChart';
import RobotTaskCountChart from './RobotTaskCountChart';
import RobotTaskTimeline from './RobotTaskTimeline';

const DashboardTab = ({ 
  filters, 
  onFilterChange, 
  uniqueRobots, 
  stats, 
  formatDuration, 
  robotWorkTime, 
  robotTaskCount 
}) => {
  return (
    <div>
      {/* 1. 필터 섹션 - 최상단 */}
      <FilterSection 
        filters={filters}
        onFilterChange={onFilterChange}
        uniqueRobots={uniqueRobots}
      />

      {/* 2. 통계 섹션 - 2x2 통계 + 로봇별 통계 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '0.6fr 1.4fr', 
        gap: 'var(--space-xl)', 
        marginBottom: 'var(--space-xl)' 
      }}>
        {/* 왼쪽: 2x2 통계 대시보드 */}
        <StatsDashboard 
          stats={stats}
          formatDuration={formatDuration}
        />

        {/* 오른쪽: 로봇별 통계 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 'var(--space-md)' 
        }}>
          <RobotWorkTimeChart 
            robotWorkTime={robotWorkTime}
            formatDuration={formatDuration}
          />
          <RobotTaskCountChart 
            robotTaskCount={robotTaskCount}
          />
        </div>
      </div>

      {/* 3. 태스크 타임라인 - 별도 섹션 */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <RobotTaskTimeline />
      </div>
    </div>
  );
};

export default DashboardTab;
