const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// DB 디렉토리 확인 및 생성
const dbDir = path.resolve(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('DB 디렉토리를 생성했습니다:', dbDir);
}

// DB 초기화
const dbPath = path.resolve(__dirname, 'db/amr.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 에러:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다');
    initializeDatabase();
  }
});

// 데이터베이스 테이블 초기화
function initializeDatabase() {
  db.serialize(() => {
    // 기존 테이블이 스키마와 맞지 않을 수 있으므로 삭제하고 새로 생성
    db.run(`DROP TABLE IF EXISTS robots`);
    db.run(`DROP TABLE IF EXISTS missions`);
    
    // 로봇 정보 테이블
    db.run(`
      CREATE TABLE robots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip_address TEXT,
        status TEXT DEFAULT 'idle',
        battery INTEGER DEFAULT 100,
        location_x REAL DEFAULT 0,
        location_y REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 임무 테이블
    db.run(`
      CREATE TABLE missions (
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
    `);
    
    console.log('데이터베이스 테이블이 초기화되었습니다');
    
    // 초기 로봇 데이터 삽입
    db.get('SELECT COUNT(*) as count FROM robots', [], (err, row) => {
      if (err) {
        console.error('로봇 데이터 확인 에러:', err.message);
        return;
      }
      
      if (row.count === 0) {
        // 샘플 로봇 데이터 추가
        const robots = [
          { name: '로봇 A', ip_address: '192.168.1.101', status: 'idle', battery: 85, location_x: -2, location_y: 3 },
          { name: '로봇 B', ip_address: '192.168.1.102', status: 'idle', battery: 90, location_x: 2, location_y: -2 },
          { name: '로봇 C', ip_address: '192.168.1.103', status: 'moving', battery: 75, location_x: -8, location_y: 8 },
          { name: '로봇 D', ip_address: '192.168.1.104', status: 'moving', battery: 60, location_x: 8, location_y: -8 },
          { name: '로봇 E', ip_address: '192.168.1.105', status: 'charging', battery: 25, location_x: 0, location_y: 0 }
        ];
        
        robots.forEach(robot => {
          db.run(
            'INSERT INTO robots (name, ip_address, status, battery, location_x, location_y) VALUES (?, ?, ?, ?, ?, ?)',
            [robot.name, robot.ip_address, robot.status, robot.battery, robot.location_x, robot.location_y],
            function(err) {
              if (err) {
                console.error('로봇 데이터 추가 에러:', err.message);
              } else {
                console.log(`로봇 추가됨: ${robot.name} (ID: ${this.lastID})`);
              }
            }
          );
        });
      }
    });
  });
}

// Express 앱 설정
const app = express();

// 미들웨어 설정
app.use(helmet()); // 보안 강화
app.use(cors());   // CORS 활성화
app.use(bodyParser.json());
app.use(morgan('dev')); // 로깅

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'AMR 관제 시스템 API가 실행 중입니다.' });
});

// 로봇 관련 API
// 모든 로봇 조회
app.get('/api/robots', (req, res) => {
  db.all('SELECT * FROM robots', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 특정 로봇 조회
app.get('/api/robots/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
  }

  db.get('SELECT * FROM robots WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
    }
    
    res.json({ data: row });
  });
});

// 새 로봇 생성
app.post('/api/robots', (req, res) => {
  // destructuring으로 default 값 설정, undefined일 경우 default 값 사용
  let { name, ip_address, status, battery, location_x, location_y, angle } = req.body;
  
  // default 값 설정
  status = status || 'idle';
  battery = battery !== undefined ? battery : 100;
  location_x = location_x !== undefined ? location_x : 0;
  location_y = location_y !== undefined ? location_y : 0;
  angle = angle !== undefined ? angle : 0;
  
  // 필수 필드 검증
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '로봇 이름은 필수입니다.' });
  }
  
  if (!ip_address || ip_address.trim() === '') {
    return res.status(400).json({ error: 'IP 주소는 필수입니다.' });
  }
  
  // IP 주소 형식 검증
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(ip_address.trim())) {
    return res.status(400).json({ error: '올바른 IP 주소 형식을 입력해주세요.' });
  }
  
  // 상태 검증
  const validStatuses = ['idle', 'moving', 'charging', 'error'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '유효하지 않은 상태입니다. (idle, moving, charging, error)' });
  }
  
  // 배터리 레벨 검증
  if (typeof battery !== 'number' || battery < 0 || battery > 100) {
    return res.status(400).json({ error: '배터리 레벨은 0-100 사이의 숫자여야 합니다.' });
  }
  
  // 위치 검증
  if (typeof location_x !== 'number' || typeof location_y !== 'number') {
    return res.status(400).json({ error: '위치 좌표는 숫자여야 합니다.' });
  }
  
  // 각도 검증
  if (typeof angle !== 'number' || angle < -Math.PI || angle > Math.PI) {
    return res.status(400).json({ error: '각도는 -π ~ π 라디안 범위의 숫자여야 합니다.' });
  }
  
  db.run(
    'INSERT INTO robots (name, ip_address, status, battery, location_x, location_y, angle, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [name.trim(), ip_address.trim(), status, battery, location_x, location_y, angle],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 생성된 로봇 정보 반환
      db.get('SELECT * FROM robots WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ 
          message: '로봇이 성공적으로 생성되었습니다.', 
          data: row 
        });
      });
    }
  );
});

// 로봇 정보 업데이트
app.put('/api/robots/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, ip_address, status, battery, location_x, location_y, angle } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
  }
  
  // 먼저 로봇 존재 확인
  db.get('SELECT * FROM robots WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
    }
    
    // 업데이트할 필드들 검증
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: '로봇 이름은 비어있을 수 없습니다.' });
      }
      updates.push('name = ?');
      values.push(name.trim());
    }
    
    if (ip_address !== undefined) {
      if (!ip_address || ip_address.trim() === '') {
        return res.status(400).json({ error: 'IP 주소는 비어있을 수 없습니다.' });
      }
      // IP 주소 형식 검증
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(ip_address.trim())) {
        return res.status(400).json({ error: '올바른 IP 주소 형식을 입력해주세요.' });
      }
      updates.push('ip_address = ?');
      values.push(ip_address.trim());
    }
    
    if (status !== undefined) {
      const validStatuses = ['idle', 'moving', 'charging', 'error'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: '유효하지 않은 상태입니다. (idle, moving, charging, error)' });
      }
      updates.push('status = ?');
      values.push(status);
    }
    
    if (battery !== undefined) {
      if (battery < 0 || battery > 100) {
        return res.status(400).json({ error: '배터리 레벨은 0-100 사이여야 합니다.' });
      }
      updates.push('battery = ?');
      values.push(battery);
    }
    
    if (location_x !== undefined) {
      if (typeof location_x !== 'number') {
        return res.status(400).json({ error: 'X 좌표는 숫자여야 합니다.' });
      }
      updates.push('location_x = ?');
      values.push(location_x);
    }
    
    if (location_y !== undefined) {
      if (typeof location_y !== 'number') {
        return res.status(400).json({ error: 'Y 좌표는 숫자여야 합니다.' });
      }
      updates.push('location_y = ?');
      values.push(location_y);
    }
    
    if (angle !== undefined) {
      if (typeof angle !== 'number' || angle < -Math.PI || angle > Math.PI) {
        return res.status(400).json({ error: '각도는 -π ~ π 라디안 범위의 숫자여야 합니다.' });
      }
      updates.push('angle = ?');
      values.push(angle);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '업데이트할 필드가 없습니다.' });
    }
    
    // last_updated 항상 업데이트
    updates.push('last_updated = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE robots SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 업데이트된 로봇 정보 반환
      db.get('SELECT * FROM robots WHERE id = ?', [id], (err, updatedRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          message: '로봇 정보가 성공적으로 업데이트되었습니다.', 
          data: updatedRow 
        });
      });
    });
  });
});

// 로봇 삭제
app.delete('/api/robots/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
  }
  
  // 먼저 로봇 존재 확인
  db.get('SELECT * FROM robots WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
    }
    
    // 관련 임무들도 함께 삭제 (외래키 제약 조건 때문에)
    db.serialize(() => {
      db.run('DELETE FROM missions WHERE robot_id = ?', [id], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 로봇 삭제
        db.run('DELETE FROM robots WHERE id = ?', [id], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({ 
            message: '로봇이 성공적으로 삭제되었습니다.', 
            deletedRobot: row 
          });
        });
      });
    });
  });
});

// 로봇 위치 업데이트
app.patch('/api/robots/:id/location', (req, res) => {
  const id = parseInt(req.params.id);
  const { x, y, angle } = req.body;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: '유효하지 않은 로봇 ID입니다.' });
  }
  
  // 먼저 로봇 존재 확인
  db.get('SELECT * FROM robots WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      return res.status(404).json({ error: '로봇을 찾을 수 없습니다.' });
    }
    
    // 업데이트할 필드들 검증
    const updates = [];
    const values = [];
    
    if (x !== undefined) {
      if (typeof x !== 'number') {
        return res.status(400).json({ error: 'X 좌표는 숫자여야 합니다.' });
      }
      updates.push('location_x = ?');
      values.push(x);
    }
    
    if (y !== undefined) {
      if (typeof y !== 'number') {
        return res.status(400).json({ error: 'Y 좌표는 숫자여야 합니다.' });
      }
      updates.push('location_y = ?');
      values.push(y);
    }
    
    if (angle !== undefined) {
      if (typeof angle !== 'number' || angle < -Math.PI || angle > Math.PI) {
        return res.status(400).json({ error: '각도는 -π ~ π 라디안 범위의 숫자여야 합니다.' });
      }
      updates.push('angle = ?');
      values.push(angle);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '업데이트할 필드가 없습니다.' });
    }
    
    // last_updated 항상 업데이트
    updates.push('last_updated = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE robots SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, values, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 업데이트된 로봇 정보 반환
      db.get('SELECT * FROM robots WHERE id = ?', [id], (err, updatedRow) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          message: '로봇 위치가 성공적으로 업데이트되었습니다.', 
          data: updatedRow 
        });
      });
    });
  });
});

// 임무 관련 API
app.get('/api/missions', (req, res) => {
  db.all('SELECT * FROM missions ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // waypoints JSON 파싱 및 필드 매핑
    const processedMissions = rows.map(mission => {
      const processed = { ...mission };
      
      // waypoints JSON 파싱
      if (processed.waypoints) {
        try {
          processed.waypoints = JSON.parse(processed.waypoints);
        } catch (e) {
          console.warn('웨이포인트 JSON 파싱 실패:', e);
          processed.waypoints = [];
        }
      } else {
        processed.waypoints = [];
      }
      
      // MissionCard에서 사용하기 위한 필드 매핑
      processed.type = processed.mission_type;
      processed.assignedRobot = processed.robot_id ? `AMR-${processed.robot_id}` : 'N/A';
      processed.createdTime = processed.created_at;
      processed.startTime = processed.start_time;
      processed.endTime = processed.end_time;
      
      return processed;
    });
    
    res.json({ data: processedMissions });
  });
});

// 새 임무 생성
app.post('/api/missions', (req, res) => {
  const { 
    name, 
    robot_id, 
    mission_type, 
    status, 
    priority, 
    waypoints,
    description 
  } = req.body;
  
  // 필수 필드 검증
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: '미션 이름은 필수입니다.' });
  }
  
  if (!mission_type || mission_type.trim() === '') {
    return res.status(400).json({ error: '미션 타입은 필수입니다.' });
  }
  
  if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
    return res.status(400).json({ error: '최소 하나의 웨이포인트가 필요합니다.' });
  }
  
  // 기본값 설정
  const missionStatus = status || 'pending';
  const missionPriority = priority || 'medium';
  const waypointsJson = JSON.stringify(waypoints);
  
  db.run(
    `INSERT INTO missions (
      name, robot_id, mission_type, status, priority, waypoints, description, 
      start_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      name.trim(), 
      robot_id || null, 
      mission_type.trim(), 
      missionStatus, 
      missionPriority,
      waypointsJson,
      description || ''
    ],
    function(err) {
      if (err) {
        console.error('미션 생성 에러:', err.message);
        res.status(500).json({ error: '미션 생성 중 오류가 발생했습니다.' });
        return;
      }
      
      // 생성된 미션 정보 반환
      db.get('SELECT * FROM missions WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // waypoints JSON 파싱
        if (row.waypoints) {
          try {
            row.waypoints = JSON.parse(row.waypoints);
          } catch (e) {
            console.warn('웨이포인트 JSON 파싱 실패:', e);
          }
        }
        
        res.status(201).json({ 
          message: '미션이 성공적으로 생성되었습니다.', 
          data: row 
        });
      });
    }
  );
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
}); 