const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// DB 디렉토리 확인 및 생성
const dbDir = path.dirname(dbConfig.database);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('DB 디렉토리를 생성했습니다:', dbDir);
}

let db = null;

const connect = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    db = new sqlite3.Database(dbConfig.database, (err) => {
      if (err) {
        console.error('데이터베이스 연결 에러:', err.message);
        reject(err);
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다');
        resolve(db);
      }
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('데이터베이스가 연결되지 않았습니다. connect()를 먼저 호출하세요.');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          db = null;
          console.log('데이터베이스 연결이 종료되었습니다');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

// 쿼리 실행 메서드 추가
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('데이터베이스가 연결되지 않았습니다.'));
      return;
    }

    // SELECT 쿼리는 all 메서드 사용
    if (sql.trim().toLowerCase().startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } 
    // INSERT, UPDATE, DELETE 쿼리는 run 메서드 사용
    else {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            insertId: this.lastID,
            changes: this.changes
          });
        }
      });
    }
  });
};

module.exports = {
  connect,
  getDatabase,
  close,
  query
}; 