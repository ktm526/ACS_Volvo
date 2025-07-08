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
    // 로봇 정보 테이블
    db.run(`
      CREATE TABLE IF NOT EXISTS robots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'idle',
        battery INTEGER DEFAULT 100,
        location_x REAL DEFAULT 0,
        location_y REAL DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
          { name: '로봇 A', status: 'idle', battery: 85, location_x: -2, location_y: 3 },
          { name: '로봇 B', status: 'idle', battery: 90, location_x: 2, location_y: -2 },
          { name: '로봇 C', status: 'moving', battery: 75, location_x: -8, location_y: 8 },
          { name: '로봇 D', status: 'moving', battery: 60, location_x: 8, location_y: -8 },
          { name: '로봇 E', status: 'charging', battery: 25, location_x: 0, location_y: 0 }
        ];
        
        robots.forEach(robot => {
          db.run(
            'INSERT INTO robots (name, status, battery, location_x, location_y) VALUES (?, ?, ?, ?, ?)',
            [robot.name, robot.status, robot.battery, robot.location_x, robot.location_y],
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
app.get('/api/robots', (req, res) => {
  db.all('SELECT * FROM robots', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 임무 관련 API
app.get('/api/missions', (req, res) => {
  db.all('SELECT * FROM missions', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
}); 