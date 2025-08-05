const app = require('./app');
const { connect } = require('./src/database/connection');
const { initializeDatabase } = require('./src/database/init');
const { seedAll } = require('./src/database/seedData');
const robotStatusService = require('./src/services/robotStatusService');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 데이터베이스 연결
    await connect();
    
    // 데이터베이스 초기화
    await initializeDatabase();
    
    // 시드 데이터 삽입
    await seedAll();
    
    // 로봇 상태 수집 서비스 시작
    console.log('로봇 상태 수집 서비스를 초기화하는 중...');
    setTimeout(() => {
      robotStatusService.start();
    }, 2000); // 서버 완전 시작 후 2초 뒤에 시작
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
  console.log('\n서버를 종료하고 있습니다...');
  
  // 로봇 상태 수집 서비스 중지
  robotStatusService.stop();
  
  const { close } = require('./src/database/connection');
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n서버를 종료하고 있습니다...');
  
  // 로봇 상태 수집 서비스 중지
  robotStatusService.stop();
  
  const { close } = require('./src/database/connection');
  await close();
  process.exit(0);
});

startServer(); 