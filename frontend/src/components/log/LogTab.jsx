import React from 'react';
import FilterSection from './FilterSection';
import ActivityLogList from './ActivityLogList';

const LogTab = ({ 
  filteredLogs, 
  expandedLogs, 
  onToggleExpansion, 
  getLevelColor, 
  getLevelIcon, 
  formatDuration,
  filters,
  onFilterChange,
  uniqueRobots
}) => {
  return (
    <div>
      {/* 통합 필터 섹션 */}
      <FilterSection 
        filters={filters}
        onFilterChange={onFilterChange}
        uniqueRobots={uniqueRobots}
      />
      
      {/* 활동 로그 리스트 */}
      <ActivityLogList 
        filteredLogs={filteredLogs}
        expandedLogs={expandedLogs}
        onToggleExpansion={onToggleExpansion}
        getLevelColor={getLevelColor}
        getLevelIcon={getLevelIcon}
        formatDuration={formatDuration}
      />
    </div>
  );
};

export default LogTab;
