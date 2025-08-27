import React, { useRef, useEffect, useState } from 'react';

const TabComponent = ({ activeTab, setActiveTab, tabs }) => {
  const tabContainerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useEffect(() => {
    if (tabContainerRef.current) {
      const activeButton = tabContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        // 버튼의 위치를 부모 컨테이너 기준으로 정확히 계산
        const containerPadding = 3; // 컨테이너의 padding 값
        
        setIndicatorStyle({
          width: activeButton.offsetWidth,
          height: activeButton.offsetHeight,
          left: activeButton.offsetLeft,
          top: containerPadding // 위아래 간격을 컨테이너 패딩과 동일하게 설정
        });
      }
    }
  }, [activeTab, tabs]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 'var(--space-xl)',
      padding: 'var(--space-md)'
    }}>
      <div 
        ref={tabContainerRef}
        style={{
          position: 'relative',
          display: 'flex',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '9999px', // 완전히 둥근 형태
          padding: '3px', // 여백 줄임
          border: '1px solid var(--border-primary)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* 움직이는 선택 영역 */}
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '9999px', // 완전히 둥근 형태
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)',
            zIndex: 1,
            ...indicatorStyle
          }}
        />
        
        {/* 탭 버튼들 */}
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)', // 간격 줄임
              padding: '8px 16px', // 패딩 줄임
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              whiteSpace: 'nowrap',
              outline: 'none',
              borderRadius: '9999px', // 완전히 둥근 형태
              fontFamily: 'Pretendard, sans-serif',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              minHeight: '32px' // 높이 줄임
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                // 버튼 전체에 색상 적용
                e.currentTarget.style.color = 'var(--text-primary)';
                // 자식 요소들도 함께 색상 변경
                const icon = e.currentTarget.querySelector('i');
                const span = e.currentTarget.querySelector('span');
                if (icon) icon.style.color = 'var(--text-primary)';
                if (span) span.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                // 버튼 전체에 색상 복원
                e.currentTarget.style.color = 'var(--text-secondary)';
                // 자식 요소들도 함께 색상 복원
                const icon = e.currentTarget.querySelector('i');
                const span = e.currentTarget.querySelector('span');
                if (icon) icon.style.color = 'var(--text-secondary)';
                if (span) span.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <i 
              className={tab.icon}
              style={{
                fontSize: 'var(--font-size-sm)',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                transition: 'color 0.3s ease'
              }}
            />
            <span style={{
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              transition: 'color 0.3s ease'
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabComponent;
