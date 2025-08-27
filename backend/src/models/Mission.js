const { getDatabase } = require('../database/connection');

class Mission {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.robot_id = data.robot_id;
    this.mission_type = data.mission_type;
    this.status = data.status || 'pending';
    this.priority = data.priority || 'medium';
    this.waypoints = data.waypoints ? (typeof data.waypoints === 'string' ? JSON.parse(data.waypoints) : data.waypoints) : [];
    this.description = data.description || '';
    this.progress = data.progress || 0;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // MissionCard에서 사용하기 위한 매핑 필드들
    this.type = this.mission_type;
    this.assignedRobot = this.robot_id ? `AMR-${this.robot_id}` : 'N/A';
    this.createdTime = this.created_at;
    this.startTime = this.start_time;
    this.endTime = this.end_time;
  }

  static findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM missions ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Mission(row)));
        }
      });
    });
  }

  static findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM missions WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? new Mission(row) : null);
        }
      });
    });
  }

  static findByRobotId(robotId) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM missions WHERE robot_id = ? ORDER BY created_at DESC', [robotId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Mission(row)));
        }
      });
    });
  }

  static findByStatus(status) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM missions WHERE status = ? ORDER BY created_at DESC', [status], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Mission(row)));
        }
      });
    });
  }

  // 완료/취소된 작업 중 지정된 시간 이전에 업데이트된 것들 조회
  static findCompletedBefore(beforeTime) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM missions 
        WHERE status IN ('completed', 'cancelled') 
        AND updated_at < ? 
        ORDER BY updated_at ASC
      `;
      
      db.all(query, [beforeTime], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Mission(row)));
        }
      });
    });
  }

  static create(data) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const { 
        name, 
        robot_id, 
        mission_type, 
        status = 'pending', 
        priority = 'medium', 
        waypoints = [], 
        description = '' 
      } = data;
      
      const waypointsJson = JSON.stringify(waypoints);
      const currentTime = new Date().toISOString();
      
      db.run(
        `INSERT INTO missions (
          name, robot_id, mission_type, status, priority, waypoints, description, 
          progress, start_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, 
          robot_id, 
          mission_type, 
          status, 
          priority, 
          waypointsJson, 
          description,
          0,
          currentTime,
          currentTime,
          currentTime
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            Mission.findById(this.lastID)
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
          if (key === 'waypoints' && typeof data[key] === 'object') {
            updates.push(`${key} = ?`);
            values.push(JSON.stringify(data[key]));
          } else {
            updates.push(`${key} = ?`);
            values.push(data[key]);
          }
        }
      });
      
      if (updates.length === 0) {
        return resolve(this);
      }
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(this.id);
      
      const sql = `UPDATE missions SET ${updates.join(', ')} WHERE id = ?`;
      
      db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        } else {
          // 업데이트된 데이터로 현재 인스턴스 갱신
          Object.assign(this, data);
          this.updated_at = new Date().toISOString();
          resolve(this);
        }
      });
    });
  }

  updateStatus(newStatus) {
    return this.update({ 
      status: newStatus,
      ...(newStatus === 'in_progress' && !this.start_time && { start_time: new Date().toISOString() }),
      ...(newStatus === 'completed' && { end_time: new Date().toISOString(), progress: 100 })
    });
  }

  updateProgress(progress) {
    return this.update({ progress: Math.min(100, Math.max(0, progress)) });
  }

  delete() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM missions WHERE id = ?', [this.id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  static validate(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('미션 이름은 필수입니다.');
    }
    
    if (!data.mission_type || typeof data.mission_type !== 'string' || data.mission_type.trim() === '') {
      errors.push('미션 타입은 필수입니다.');
    }
    
    if (!data.waypoints || !Array.isArray(data.waypoints) || data.waypoints.length === 0) {
      errors.push('최소 하나의 웨이포인트가 필요합니다.');
    }
    
    if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
      errors.push('우선순위는 low, medium, high 중 하나여야 합니다.');
    }
    
    if (data.status && !['pending', 'in_progress', 'completed', 'failed', 'cancelled'].includes(data.status)) {
      errors.push('상태는 pending, in_progress, completed, failed, cancelled 중 하나여야 합니다.');
    }
    
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      robot_id: this.robot_id,
      mission_type: this.mission_type,
      status: this.status,
      priority: this.priority,
      waypoints: this.waypoints,
      description: this.description,
      progress: this.progress,
      start_time: this.start_time,
      end_time: this.end_time,
      created_at: this.created_at,
      updated_at: this.updated_at,
      // 매핑 필드들
      type: this.type,
      assignedRobot: this.assignedRobot,
      createdTime: this.createdTime,
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
}

module.exports = Mission; 