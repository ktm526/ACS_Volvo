import React, { createContext, useContext, useReducer } from 'react';
import { ROBOT_STATUS, MISSION_STATUS } from '../constants';

const AppContext = createContext();

// localStorage에서 테마 설정 로드
const loadThemeFromStorage = () => {
  try {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error);
    return 'dark';
  }
};

// localStorage에 테마 설정 저장
const saveThemeToStorage = (theme) => {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
};

// 초기 상태
const initialState = {
  currentPage: 'main',
  selectedRobot: null,
  hoveredRobot: null,
  connectionStatus: 'connected', // connected, disconnected, connecting
  systemStatus: 'normal', // normal, warning, error
  notifications: [],
  robots: [], // 로봇 목록
  filters: {
    robotStatus: null,
    missionStatus: null
  },
  ui: {
    showTooltips: true,
    theme: loadThemeFromStorage(),
    language: 'ko'
  }
};

// 액션 타입
const ACTION_TYPES = {
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_SELECTED_ROBOT: 'SET_SELECTED_ROBOT',
  SET_HOVERED_ROBOT: 'SET_HOVERED_ROBOT',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_SYSTEM_STATUS: 'SET_SYSTEM_STATUS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ROBOTS: 'SET_ROBOTS',
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  UPDATE_UI_SETTING: 'UPDATE_UI_SETTING'
};

// 리듀서
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload
      };

    case ACTION_TYPES.SET_SELECTED_ROBOT:
      return {
        ...state,
        selectedRobot: action.payload
      };

    case ACTION_TYPES.SET_HOVERED_ROBOT:
      return {
        ...state,
        hoveredRobot: action.payload
      };

    case ACTION_TYPES.SET_CONNECTION_STATUS:
      return {
        ...state,
        connectionStatus: action.payload
      };

    case ACTION_TYPES.SET_SYSTEM_STATUS:
      return {
        ...state,
        systemStatus: action.payload
      };

    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          ...action.payload,
          timestamp: new Date()
        }]
      };

    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    case ACTION_TYPES.SET_ROBOTS:
      return {
        ...state,
        robots: action.payload
      };

    case ACTION_TYPES.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.type]: action.payload.value
        }
      };

    case ACTION_TYPES.CLEAR_FILTERS:
      return {
        ...state,
        filters: {
          robotStatus: null,
          missionStatus: null
        }
      };

    case ACTION_TYPES.UPDATE_UI_SETTING:
      // 테마가 변경될 때 localStorage에 저장
      if (action.payload.setting === 'theme') {
        saveThemeToStorage(action.payload.value);
      }
      
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.payload.setting]: action.payload.value
        }
      };

    default:
      return state;
  }
};

// Provider 컴포넌트
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 액션 생성자들
  const actions = {
    setCurrentPage: (page) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_PAGE, payload: page });
    },

    setSelectedRobot: (robot) => {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_ROBOT, payload: robot });
    },

    setHoveredRobot: (robot) => {
      dispatch({ type: ACTION_TYPES.SET_HOVERED_ROBOT, payload: robot });
    },

    setConnectionStatus: (status) => {
      dispatch({ type: ACTION_TYPES.SET_CONNECTION_STATUS, payload: status });
    },

    setSystemStatus: (status) => {
      dispatch({ type: ACTION_TYPES.SET_SYSTEM_STATUS, payload: status });
    },

    addNotification: (notification) => {
      dispatch({ type: ACTION_TYPES.ADD_NOTIFICATION, payload: notification });
    },

    removeNotification: (id) => {
      dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
    },

    setRobots: (robots) => {
      dispatch({ type: ACTION_TYPES.SET_ROBOTS, payload: robots });
    },

    setFilter: (type, value) => {
      dispatch({ type: ACTION_TYPES.SET_FILTER, payload: { type, value } });
    },

    clearFilters: () => {
      dispatch({ type: ACTION_TYPES.CLEAR_FILTERS });
    },

    updateUISetting: (setting, value) => {
      dispatch({ type: ACTION_TYPES.UPDATE_UI_SETTING, payload: { setting, value } });
    }
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// 커스텀 훅
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 