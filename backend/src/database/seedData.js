const { getDatabase } = require('./connection');

const seedRobots = () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // 초기 로봇 데이터 삽입
    db.get('SELECT COUNT(*) as count FROM robots', [], (err, row) => {
      if (err) {
        console.error('로봇 데이터 확인 에러:', err.message);
        reject(err);
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
        
        let completed = 0;
        let hasError = false;
        
        robots.forEach(robot => {
          db.run(
            'INSERT INTO robots (name, ip_address, status, battery, location_x, location_y) VALUES (?, ?, ?, ?, ?, ?)',
            [robot.name, robot.ip_address, robot.status, robot.battery, robot.location_x, robot.location_y],
            function(err) {
              if (err && !hasError) {
                console.error('로봇 데이터 추가 에러:', err.message);
                hasError = true;
                reject(err);
                return;
              }
              
              if (!hasError) {
                console.log(`로봇 추가됨: ${robot.name} (ID: ${this.lastID})`);
                completed++;
                
                if (completed === robots.length) {
                  console.log('초기 로봇 데이터 삽입 완료');
                  resolve();
                }
              }
            }
          );
        });
      } else {
        console.log('로봇 데이터가 이미 존재합니다');
        resolve();
      }
    });
  });
};

const seedAll = async () => {
  try {
    await seedRobots();
    console.log('모든 시드 데이터 삽입 완료');
  } catch (error) {
    console.error('시드 데이터 삽입 실패:', error);
    throw error;
  }
};

module.exports = {
  seedRobots,
  seedAll
}; 