const { getDatabase } = require('./connection');

const initializeDatabase = () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 기존 테이블이 없으면 생성 (데이터 보존)
      
      // 로봇 정보 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS robots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          ip_address TEXT,
          status TEXT DEFAULT 'idle',
          battery INTEGER DEFAULT 100,
          location_x REAL DEFAULT 0,
          location_y REAL DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('로봇 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('로봇 테이블 확인 완료');
      });

      // 맵 정보 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS maps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image_path TEXT,
          metadata_path TEXT,
          nodes_path TEXT,
          resolution REAL,
          origin_x REAL,
          origin_y REAL,
          width INTEGER,
          height INTEGER,
          origin_yaw REAL DEFAULT 0,
          negate INTEGER DEFAULT 0,
          occupied_thresh REAL DEFAULT 0.65,
          free_thresh REAL DEFAULT 0.196,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('맵 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('맵 테이블 확인 완료');
      });

      // 맵 노드 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS map_nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          map_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          type INTEGER NOT NULL,
          node_index INTEGER NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          yaw REAL DEFAULT 0,
          data INTEGER DEFAULT 0,
          FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('맵 노드 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('맵 노드 테이블 확인 완료');
      });

      // 맵 연결 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS map_connections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          map_id INTEGER NOT NULL,
          from_node_index INTEGER NOT NULL,
          to_node_index INTEGER NOT NULL,
          FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('맵 연결 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('맵 연결 테이블 확인 완료');
      });

      // 맵 픽셀 데이터 테이블 (이미지의 검은 픽셀 좌표)
      db.run(`
        CREATE TABLE IF NOT EXISTS map_pixels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          map_id INTEGER NOT NULL,
          x INTEGER NOT NULL,
          y INTEGER NOT NULL,
          FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('맵 픽셀 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('맵 픽셀 테이블 확인 완료');
      });

      // 픽셀 데이터 조회 성능 향상을 위한 인덱스
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_map_pixels_map_id ON map_pixels(map_id);
      `, (err) => {
        if (err) {
          console.error('맵 픽셀 인덱스 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('맵 픽셀 인덱스 확인 완료');
      });

      // 임무 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS missions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          robot_id INTEGER,
          mission_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          start_x REAL,
          start_y REAL,
          target_x REAL,
          target_y REAL,
          FOREIGN KEY (robot_id) REFERENCES robots(id)
        )
      `, (err) => {
        if (err) {
          console.error('임무 테이블 생성 에러:', err.message);
          reject(err);
          return;
        }
        console.log('임무 테이블 확인 완료');
        console.log('데이터베이스 테이블 확인 완료');
        resolve();
      });
    });
  });
};

module.exports = {
  initializeDatabase
}; 