import React from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESC 키로 모달 닫기
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari 지원
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: 'var(--space-md)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-primary)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-primary)',
          transform: 'translateY(0) scale(1)',
          transition: 'all 0.2s ease-out',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-lg)',
            borderBottom: '1px solid var(--border-primary)'
          }}
        >
          <h2
            style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-lg)',
              cursor: 'pointer',
              padding: 'var(--space-xs)',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 모달 콘텐츠 */}
        <div style={{ padding: 'var(--space-lg)' }}>
          {children}
        </div>
              </div>
    </div>
  );

  // Portal을 사용해서 document.body에 직접 렌더링
  return createPortal(modalContent, document.body);
};

export default Modal; 