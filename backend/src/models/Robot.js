const { getDatabase } = require('../database/connection');

class Robot {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.ip_address = data.ip_address;
    this.status = data.status || 'idle';
    this.battery = data.battery || 100;
    this.location_x = data.location_x || 0;
    this.location_y = data.location_y || 0;
    this.last_updated = data.last_updated;
  }

  static findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM robots', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Robot(row)));
        }
      });
    });
  }

  static findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM robots WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? new Robot(row) : null);
        }
      });
    });
  }

  static create(data) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const { name, ip_address, status = 'idle', battery = 100, location_x = 0, location_y = 0 } = data;
      
      db.run(
        'INSERT INTO robots (name, ip_address, status, battery, location_x, location_y, last_updated) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [name, ip_address, status, battery, location_x, location_y],
        function(err) {
          if (err) {
            reject(err);
          } else {
            Robot.findById(this.lastID)
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  }

  update(data) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && key !== 'id') {
          updates.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      if (updates.length === 0) {
        resolve(this);
        return;
      }
      
      updates.push('last_updated = CURRENT_TIMESTAMP');
      values.push(this.id);
      
      const query = `UPDATE robots SET ${updates.join(', ')} WHERE id = ?`;
      
      db.run(query, values, (err) => {
        if (err) {
          reject(err);
        } else {
          Robot.findById(this.id)
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  delete() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      // 관련 임무들도 함께 삭제
      db.serialize(() => {
        db.run('DELETE FROM missions WHERE robot_id = ?', [this.id], (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          db.run('DELETE FROM robots WHERE id = ?', [this.id], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  static validate(data) {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('로봇 이름은 필수입니다.');
    }
    
    if (!data.ip_address || data.ip_address.trim() === '') {
      errors.push('IP 주소는 필수입니다.');
    } else {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(data.ip_address.trim())) {
        errors.push('올바른 IP 주소 형식을 입력해주세요.');
      }
    }
    
    if (data.status) {
      const validStatuses = ['idle', 'moving', 'charging', 'error'];
      if (!validStatuses.includes(data.status)) {
        errors.push('유효하지 않은 상태입니다. (idle, moving, charging, error)');
      }
    }
    
    if (data.battery !== undefined) {
      if (typeof data.battery !== 'number' || data.battery < 0 || data.battery > 100) {
        errors.push('배터리 레벨은 0-100 사이의 숫자여야 합니다.');
      }
    }
    
    if (data.location_x !== undefined && typeof data.location_x !== 'number') {
      errors.push('X 좌표는 숫자여야 합니다.');
    }
    
    if (data.location_y !== undefined && typeof data.location_y !== 'number') {
      errors.push('Y 좌표는 숫자여야 합니다.');
    }
    
    return errors;
  }
}

module.exports = Robot; 