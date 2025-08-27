const { getDatabase } = require('./connection');

const initializeDatabase = () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 기존 테이블이 없으면 생성 (데이터 보존)
      
      // 로봇 정보 테이블 (AMR 상태 정보 통합)
      db.run(`
        CREATE TABLE IF NOT EXISTS robots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          ip_address TEXT,
          port INTEGER DEFAULT 80,
          status TEXT DEFAULT 'idle',
          battery INTEGER DEFAULT 100,
          location_x REAL DEFAULT 0,
          location_y REAL DEFAULT 0,
          angle REAL DEFAULT 0,
          
          -- AMR 상태 정보 필드들
          robot_model TEXT,
          hw_version TEXT,
          sw_version TEXT,
          driving_status INTEGER DEFAULT 0,
          driving_mode INTEGER DEFAULT 0,
          position_theta REAL DEFAULT 0,
          velocity_x REAL DEFAULT 0,
          velocity_y REAL DEFAULT 0,
          velocity_theta REAL DEFAULT 0,
          connection_status BOOLEAN DEFAULT true,
          order_status INTEGER DEFAULT 0,
          path_status TEXT,
          battery_soc REAL DEFAULT 0,
          battery_voltage REAL DEFAULT 0,
          battery_soh INTEGER DEFAULT 100,
          charging_status BOOLEAN DEFAULT false,
          error_code INTEGER DEFAULT 0,
          error_msg TEXT,
          amr_timestamp TEXT,
          
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_status_check DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          -- 태스크 관리 관련 필드들
          current_waypoint_index INTEGER DEFAULT 0,
          task_status TEXT DEFAULT 'idle',
          destination_node_id TEXT,
          last_command_sent DATETIME
        )
      `, (err) => {
        if (err) {
          
          reject(err);
          return;
        }
        
      });

      // 기존 robots 테이블에 새 컬럼들 추가 (이미 테이블이 존재하는 경우)
      const newColumns = [
        'ALTER TABLE robots ADD COLUMN port INTEGER DEFAULT 80',
        'ALTER TABLE robots ADD COLUMN robot_model TEXT',
        'ALTER TABLE robots ADD COLUMN hw_version TEXT', 
        'ALTER TABLE robots ADD COLUMN sw_version TEXT',
        'ALTER TABLE robots ADD COLUMN driving_status INTEGER DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN driving_mode INTEGER DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN position_theta REAL DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN velocity_x REAL DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN velocity_y REAL DEFAULT 0', 
        'ALTER TABLE robots ADD COLUMN velocity_theta REAL DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN connection_status BOOLEAN DEFAULT true',
        'ALTER TABLE robots ADD COLUMN order_status INTEGER DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN path_status TEXT',
        'ALTER TABLE robots ADD COLUMN battery_soc REAL DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN battery_voltage REAL DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN battery_soh INTEGER DEFAULT 100',
        'ALTER TABLE robots ADD COLUMN charging_status BOOLEAN DEFAULT false',
        'ALTER TABLE robots ADD COLUMN error_code INTEGER DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN error_msg TEXT',
        'ALTER TABLE robots ADD COLUMN amr_timestamp TEXT',
        'ALTER TABLE robots ADD COLUMN last_status_check DATETIME DEFAULT CURRENT_TIMESTAMP',
        // 태스크 관리 관련 컬럼들
        'ALTER TABLE robots ADD COLUMN current_waypoint_index INTEGER DEFAULT 0',
        'ALTER TABLE robots ADD COLUMN task_status TEXT DEFAULT \'idle\'',
        'ALTER TABLE robots ADD COLUMN destination_node_id TEXT',
        'ALTER TABLE robots ADD COLUMN last_command_sent DATETIME'
      ];

      // 각 컬럼을 순차적으로 추가 (이미 존재하면 에러 무시)
      newColumns.forEach(sql => {
        db.run(sql, (err) => {
          if (err && !err.message.includes('duplicate column name')) {

          }
        });
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
          
          reject(err);
          return;
        }
        
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
          
          reject(err);
          return;
        }
        
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
          
          reject(err);
          return;
        }
        
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
          
          reject(err);
          return;
        }
        
      });

      // 픽셀 데이터 조회 성능 향상을 위한 인덱스
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_map_pixels_map_id ON map_pixels(map_id);
      `, (err) => {
        if (err) {
          
          reject(err);
          return;
        }
        
      });

      // 임무 테이블
      db.run(`
        CREATE TABLE IF NOT EXISTS missions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          robot_id INTEGER,
          mission_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          waypoints TEXT,
          description TEXT,
          progress REAL DEFAULT 0,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (robot_id) REFERENCES robots(id)
        )
      `, (err) => {
        if (err) {
          
          reject(err);
          return;
        }
        
        
        resolve();
      });
    });
  });
};

module.exports = {
  initializeDatabase
}; 