const { getDatabase } = require('../database/connection');

class Robot {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.ip_address = data.ip_address;
    this.port = data.port;
    this.status = data.status || 'idle';
    this.battery = data.battery || 100;
    this.location_x = data.location_x || 0;
    this.location_y = data.location_y || 0;
    this.angle = data.angle || 0;
    
    // AMR 상태 정보 필드들
    this.robot_model = data.robot_model;
    this.hw_version = data.hw_version;
    this.sw_version = data.sw_version;
    this.driving_status = data.driving_status || 0;
    this.driving_mode = data.driving_mode || 0;
    this.position_theta = data.position_theta || 0;
    this.velocity_x = data.velocity_x || 0;
    this.velocity_y = data.velocity_y || 0;
    this.velocity_theta = data.velocity_theta || 0;
    this.connection_status = data.connection_status !== undefined ? data.connection_status : true;
    this.order_status = data.order_status || 0;
    this.path_status = data.path_status;
    this.battery_soc = data.battery_soc || 0;
    this.battery_voltage = data.battery_voltage || 0;
    this.battery_soh = data.battery_soh || 100;
    this.charging_status = data.charging_status || false;
    this.error_code = data.error_code || 0;
    this.error_msg = data.error_msg;
    this.amr_timestamp = data.amr_timestamp;
    
    // 태스크 관리 필드들
    this.current_task_id = data.current_task_id || null;
    this.current_waypoint_index = data.current_waypoint_index || 0;
    this.task_status = data.task_status || 'idle';
    this.destination_node_id = data.destination_node_id || null;
    this.last_command_sent = data.last_command_sent;
    
    this.last_updated = data.last_updated;
    this.last_status_check = data.last_status_check;
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
      const { name, ip_address, port = 80, status = 'idle', battery = 100, location_x = 0, location_y = 0, angle = 0 } = data;
      const currentTime = new Date().toISOString();
      
      db.run(
        `INSERT INTO robots (name, ip_address, port, status, battery, location_x, location_y, angle, connection_status, last_updated, last_status_check) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, ip_address, port, status, battery, location_x, location_y, angle, true, currentTime, currentTime],
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

  // AMR 상태 정보 업데이트 (상태 수집 시 사용)
  updateAmrStatus(statusData) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const amrStatusData = {
        robot_model: statusData.robot_model || null,
        hw_version: statusData.hw_version || null,
        sw_version: statusData.sw_version || null,
        driving_status: statusData.driving_status || 0,
        driving_mode: statusData.driving_mode || 0,
        position_theta: statusData.position_theta || 0,
        velocity_x: statusData.velocity_x || 0,
        velocity_y: statusData.velocity_y || 0,
        velocity_theta: statusData.velocity_theta || 0,
        connection_status: statusData.connection_status !== undefined ? statusData.connection_status : true,
        order_status: statusData.order_status || 0,
        path_status: Array.isArray(statusData.path_status) ? JSON.stringify(statusData.path_status) : statusData.path_status,
        battery_soc: statusData.battery_soc || 0,
        battery_voltage: statusData.battery_voltage || 0,
        battery_soh: statusData.battery_soh || 100,
        charging_status: statusData.charging_status || false,
        error_code: statusData.error_code || 0,
        error_msg: statusData.error_msg || null,
        amr_timestamp: statusData.timestamp || null,
        last_status_check: new Date().toISOString()
      };

      // 기본 로봇 정보도 함께 업데이트
      if (statusData.battery_soc !== undefined) {
        amrStatusData.battery = Math.round(statusData.battery_soc);
      }

      if (statusData.position_x !== undefined) {
        amrStatusData.location_x = statusData.position_x;
      }
      if (statusData.position_y !== undefined) {
        amrStatusData.location_y = statusData.position_y;
      }
      if (statusData.position_theta !== undefined) {
        amrStatusData.angle = statusData.position_theta;
      }

      // 상태 정보 업데이트 (robotStatusService에서 이미 매핑된 status 사용)
      if (statusData.status !== undefined) {
        amrStatusData.status = statusData.status;
        console.log(`💾 [DB 업데이트] 로봇 ID: ${this.id} | 상태 변경: ${this.status} → ${statusData.status}`);
      }

      // 충전 상태 확인
      if (statusData.charging_status === true) {
        amrStatusData.status = 'charging';
      }

      // 에러 상태 확인
      if (statusData.error_code && statusData.error_code !== 0) {
        amrStatusData.status = 'error';
      }

      // 연결 실패한 경우 상태 업데이트
      if (statusData.connection_status === false) {
        amrStatusData.status = 'disconnected';
        amrStatusData.connection_status = false;
      }

      this.update(amrStatusData)
        .then(resolve)
        .catch(reject);
    });
  }

  // 연결 실패 상태로 업데이트
  markAsDisconnected(errorMessage) {
    return this.updateAmrStatus({
      connection_status: false,
      error_code: -1,
      error_msg: errorMessage || '연결 실패'
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
    
    if (data.port !== undefined) {
      if (typeof data.port !== 'number' || data.port < 1 || data.port > 65535) {
        errors.push('포트 번호는 1-65535 사이의 숫자여야 합니다.');
      }
    }
    
    if (data.status) {
      const validStatuses = ['idle', 'moving', 'charging', 'error', 'disconnected'];
      if (!validStatuses.includes(data.status)) {
        errors.push('유효하지 않은 상태입니다. (idle, moving, charging, error, disconnected)');
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
    
    if (data.angle !== undefined) {
      if (typeof data.angle !== 'number' || data.angle < -Math.PI || data.angle > Math.PI) {
        errors.push('각도는 -π ~ π 라디안 범위의 숫자여야 합니다.');
      }
    }
    
    return errors;
  }
}

module.exports = Robot; 