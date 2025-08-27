const fs = require('fs-extra');
const path = require('path');

class PCDProcessingService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/pcd');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    await fs.ensureDir(this.uploadsDir);
  }

  // PCD 파일 헤더 파싱
  parsePCDHeader(data) {
    const lines = data.split('\n');
    const header = {};
    let dataStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('VERSION')) {
        header.version = line.split(' ')[1];
      } else if (line.startsWith('FIELDS')) {
        header.fields = line.split(' ').slice(1);
      } else if (line.startsWith('SIZE')) {
        header.sizes = line.split(' ').slice(1).map(Number);
      } else if (line.startsWith('TYPE')) {
        header.types = line.split(' ').slice(1);
      } else if (line.startsWith('COUNT')) {
        header.counts = line.split(' ').slice(1).map(Number);
      } else if (line.startsWith('WIDTH')) {
        header.width = parseInt(line.split(' ')[1]);
      } else if (line.startsWith('HEIGHT')) {
        header.height = parseInt(line.split(' ')[1]);
      } else if (line.startsWith('VIEWPOINT')) {
        header.viewpoint = line.split(' ').slice(1).map(Number);
      } else if (line.startsWith('POINTS')) {
        header.points = parseInt(line.split(' ')[1]);
      } else if (line.startsWith('DATA')) {
        header.dataFormat = line.split(' ')[1]; // ascii or binary
        dataStartIndex = i + 1;
        break;
      }
    }

    return { header, dataStartIndex, lines };
  }

  // ASCII PCD 데이터 파싱 및 다운샘플링 (스트리밍 방식)
  async processASCIIPCD(filePath, maxPoints = 500000) {
    console.log(`🔄 [PCD Service] ASCII PCD 처리 시작:`, {
      filePath: path.basename(filePath),
      maxPoints
    });
    
    // 헤더만 먼저 읽기 (처음 1KB만)
    const stream = fs.createReadStream(filePath, { start: 0, end: 1023 });
    const chunks = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const headerText = Buffer.concat(chunks).toString('utf8');
    const { header, dataStartIndex } = this.parsePCDHeader(headerText);
    
    if (!header.points) {
      throw new Error('유효하지 않은 PCD 파일: POINTS 정보가 없습니다.');
    }

    console.log(`📊 [PCD Service] 파일 분석 완료:`, {
      originalPoints: header.points.toLocaleString(),
      fields: header.fields,
      dataFormat: header.dataFormat,
      dataStartIndex
    });

    // 다운샘플링 비율 계산
    const samplingRatio = Math.min(1, maxPoints / header.points);
    const step = Math.max(1, Math.ceil(1 / samplingRatio));
    
    console.log(`⚙️ [PCD Service] 다운샘플링 설정:`, {
      samplingRatio: (samplingRatio * 100).toFixed(2) + '%',
      step,
      expectedPoints: Math.min(maxPoints, Math.ceil(header.points / step))
    });

    // 스트리밍으로 포인트 데이터 처리
    const sampledPoints = [];
    let lineCount = 0;
    let pointsProcessed = 0;
    
    return new Promise((resolve, reject) => {
      const readline = require('readline');
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
      });

      let headerSkipped = false;
      
      rl.on('line', (line) => {
        lineCount++;
        
        // 헤더 스킵
        if (!headerSkipped) {
          if (line.trim().startsWith('DATA')) {
            headerSkipped = true;
          }
          return;
        }
        
        // 샘플링 적용
        if (pointsProcessed % step === 0 && sampledPoints.length < maxPoints) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            const values = trimmedLine.split(/\s+/).map(Number);
            
            // x, y, z 좌표가 있는지 확인
            if (values.length >= 3 && !isNaN(values[0]) && !isNaN(values[1]) && !isNaN(values[2])) {
              // 좌표계 변환: 90도 회전 + Z축 기준 -45도 회전
              // 1단계: Y축과 Z축 교체 (90도 회전)
              let tempX = values[0];
              let tempY = values[2];
              let tempZ = values[1];
              
              // 2단계: Z축 기준 -45도 회전
              const cos45 = Math.cos(-Math.PI / 4);  // cos(-45°)
              const sin45 = Math.sin(-Math.PI / 4);  // sin(-45°)
              
              const finalX = tempX * cos45 - tempY * sin45;
              const finalY = tempX * sin45 + tempY * cos45;
              const finalZ = tempZ;  // Z축 기준 회전이므로 Z는 변하지 않음
              
              const point = {
                x: finalX,
                y: finalY,
                z: finalZ
              };
              
              // RGB 정보가 있다면 추가
              if (header.fields.includes('rgb') || header.fields.includes('rgba')) {
                const rgbIndex = header.fields.indexOf('rgb') !== -1 ? 
                  header.fields.indexOf('rgb') : header.fields.indexOf('rgba');
                if (values[rgbIndex] !== undefined) {
                  point.rgb = values[rgbIndex];
                }
              }
              
              // 별도 R, G, B 필드가 있다면
              if (header.fields.includes('r') && header.fields.includes('g') && header.fields.includes('b')) {
                const rIndex = header.fields.indexOf('r');
                const gIndex = header.fields.indexOf('g');
                const bIndex = header.fields.indexOf('b');
                
                if (values[rIndex] !== undefined && values[gIndex] !== undefined && values[bIndex] !== undefined) {
                  point.r = values[rIndex];
                  point.g = values[gIndex];
                  point.b = values[bIndex];
                }
              }
              
              sampledPoints.push(point);
            }
          }
        }
        
        pointsProcessed++;
        
        // 진행률 로그 (10만 포인트마다)
        if (pointsProcessed % 100000 === 0) {
          console.log(`📈 [PCD Service] 처리 진행: ${pointsProcessed.toLocaleString()} / ${header.points.toLocaleString()} (${(pointsProcessed / header.points * 100).toFixed(1)}%)`);
        }
        
        // 최대 포인트에 도달하면 중지
        if (sampledPoints.length >= maxPoints) {
          rl.close();
        }
      });

      rl.on('close', () => {
        console.log(`✅ [PCD Service] ASCII 처리 완료:`, {
          originalCount: header.points.toLocaleString(),
          processedCount: sampledPoints.length.toLocaleString(),
          compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2) + '%',
          hasColors: sampledPoints.some(p => p.r !== undefined || p.rgb !== undefined)
        });

        resolve({
          originalCount: header.points,
          processedCount: sampledPoints.length,
          compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2),
          points: sampledPoints,
          header: header
        });
      });

      rl.on('error', (error) => {
        console.error('💥 [PCD Service] 스트리밍 처리 오류:', error);
        reject(error);
      });

      stream.on('error', (error) => {
        console.error('💥 [PCD Service] 파일 스트림 오류:', error);
        reject(error);
      });
    });
  }

  // 바이너리 PCD 처리 (스트리밍 방식)
  async processBinaryPCD(filePath, maxPoints = 500000) {
    console.log(`🔄 [PCD Service] Binary PCD 처리 시작:`, {
      filePath: path.basename(filePath),
      maxPoints
    });
    
    // 헤더만 먼저 읽기 (ASCII 부분)
    const headerStream = fs.createReadStream(filePath, { start: 0, end: 2047 }); // 2KB까지 읽기
    const headerChunks = [];
    
    for await (const chunk of headerStream) {
      headerChunks.push(chunk);
    }
    
    const headerText = Buffer.concat(headerChunks).toString('utf8');
    const { header, dataStartIndex } = this.parsePCDHeader(headerText);
    
    if (!header.points) {
      throw new Error('유효하지 않은 PCD 파일: POINTS 정보가 없습니다.');
    }

    console.log(`📊 [PCD Service] Binary 파일 분석 완료:`, {
      originalPoints: header.points.toLocaleString(),
      fields: header.fields,
      dataFormat: header.dataFormat
    });

    // 다운샘플링 비율 계산
    const samplingRatio = Math.min(1, maxPoints / header.points);
    const step = Math.max(1, Math.ceil(1 / samplingRatio));
    
    console.log(`⚙️ [PCD Service] Binary 다운샘플링 설정:`, {
      samplingRatio: (samplingRatio * 100).toFixed(2) + '%',
      step,
      expectedPoints: Math.min(maxPoints, Math.ceil(header.points / step))
    });

    // 바이너리 데이터의 포인트 크기 계산
    const pointSize = this.calculateBinaryPointSize(header);
    console.log(`🔢 [PCD Service] 포인트 크기: ${pointSize} bytes`);

    // 바이너리 데이터 시작 위치 찾기
    const lines = headerText.split('\n');
    let binaryDataOffset = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('DATA binary')) {
        // 헤더 끝까지의 바이트 수 계산
        const headerEndIndex = headerText.indexOf('DATA binary') + 'DATA binary'.length + 1;
        binaryDataOffset = headerEndIndex;
        break;
      }
    }

    // 스트리밍으로 바이너리 데이터 처리
    const sampledPoints = [];
    let pointsProcessed = 0;
    
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, { start: binaryDataOffset });
      let buffer = Buffer.alloc(0);
      
      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        console.log(`⏰ [PCD Service] Binary 처리 타임아웃 (30초), 현재까지 처리된 결과 반환`);
        stream.destroy();
        resolve({
          originalCount: header.points,
          processedCount: sampledPoints.length,
          compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2),
          points: sampledPoints,
          header: header
        });
      }, 30000);
      
      stream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        
        // 완전한 포인트들을 처리
        while (buffer.length >= pointSize && sampledPoints.length < maxPoints && pointsProcessed < header.points) {
          // 샘플링 적용
          if (pointsProcessed % step === 0) {
            const pointBuffer = buffer.slice(0, pointSize);
            const point = this.parseBinaryPoint(pointBuffer, header);
            
            if (point) {
              sampledPoints.push(point);
              
              // 목표 포인트에 도달하면 즉시 중지
              if (sampledPoints.length >= maxPoints) {
                console.log(`🎯 [PCD Service] Binary 목표 포인트 ${maxPoints} 달성, 처리 중단`);
                clearTimeout(timeout);
                stream.destroy();
                
                // 즉시 결과 반환
                resolve({
                  originalCount: header.points,
                  processedCount: sampledPoints.length,
                  compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2),
                  points: sampledPoints,
                  header: header
                });
                return;
              }
            }
          }
          
          buffer = buffer.slice(pointSize);
          pointsProcessed++;
          
          // 진행률 로그 (10만 포인트마다)
          if (pointsProcessed % 100000 === 0) {
            console.log(`📈 [PCD Service] Binary 처리 진행: ${pointsProcessed.toLocaleString()} / ${header.points.toLocaleString()} (${(pointsProcessed / header.points * 100).toFixed(1)}%)`);
          }
          
          // 원본 포인트 수에 도달하면 중지
          if (pointsProcessed >= header.points) {
            console.log(`📋 [PCD Service] Binary 모든 포인트 처리 완료`);
            clearTimeout(timeout);
            stream.destroy();
            
            // 즉시 결과 반환
            resolve({
              originalCount: header.points,
              processedCount: sampledPoints.length,
              compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2),
              points: sampledPoints,
              header: header
            });
            return;
          }
        }
      });

      stream.on('end', () => {
        clearTimeout(timeout);
        console.log(`✅ [PCD Service] Binary 처리 완료:`, {
          originalCount: header.points.toLocaleString(),
          processedCount: sampledPoints.length.toLocaleString(),
          compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2) + '%',
          hasColors: sampledPoints.some(p => p.r !== undefined || p.rgb !== undefined)
        });

        resolve({
          originalCount: header.points,
          processedCount: sampledPoints.length,
          compressionRatio: ((1 - sampledPoints.length / header.points) * 100).toFixed(2),
          points: sampledPoints,
          header: header
        });
      });

      stream.on('error', (error) => {
        clearTimeout(timeout);
        console.error('💥 [PCD Service] Binary 스트림 오류:', error);
        reject(error);
      });

      stream.on('close', () => {
        clearTimeout(timeout);
        console.log(`🔒 [PCD Service] Binary 스트림 종료`);
      });
    });
  }

  // 바이너리 포인트 크기 계산
  calculateBinaryPointSize(header) {
    let size = 0;
    for (let i = 0; i < header.fields.length; i++) {
      const fieldSize = header.sizes[i];
      const fieldCount = header.counts[i];
      size += fieldSize * fieldCount;
    }
    return size;
  }

  // 바이너리 포인트 파싱
  parseBinaryPoint(buffer, header) {
    try {
      const point = {};
      let offset = 0;
      
      for (let i = 0; i < header.fields.length; i++) {
        const field = header.fields[i];
        const fieldSize = header.sizes[i];
        const fieldType = header.types[i];
        const fieldCount = header.counts[i];
        
        if (fieldCount === 1) {
          let value;
          if (fieldType === 'F') { // Float
            value = fieldSize === 4 ? buffer.readFloatLE(offset) : buffer.readDoubleLE(offset);
          } else if (fieldType === 'U') { // Unsigned int
            value = fieldSize === 1 ? buffer.readUInt8(offset) :
                   fieldSize === 2 ? buffer.readUInt16LE(offset) :
                   buffer.readUInt32LE(offset);
          } else if (fieldType === 'I') { // Signed int
            value = fieldSize === 1 ? buffer.readInt8(offset) :
                   fieldSize === 2 ? buffer.readInt16LE(offset) :
                   buffer.readInt32LE(offset);
          } else {
            value = 0; // 알 수 없는 타입
          }
          
          point[field] = value;
          offset += fieldSize;
        } else {
          // 다중 값 필드 (현재는 스킵)
          offset += fieldSize * fieldCount;
        }
      }
      
      // x, y, z가 있는지 확인
      if (point.x !== undefined && point.y !== undefined && point.z !== undefined &&
          !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)) {
        
        // 좌표계 변환: 90도 회전 + Z축 기준 -45도 회전
        // 1단계: Y축과 Z축 교체 (90도 회전)
        let tempX = point.x;
        let tempY = point.z;
        let tempZ = point.y;
        
        // 2단계: Z축 기준 -45도 회전 (cos(45°) = sin(45°) = √2/2 ≈ 0.7071)
        const cos45 = Math.cos(-Math.PI / 4);  // cos(-45°)
        const sin45 = Math.sin(-Math.PI / 4);  // sin(-45°)
        
        const finalX = tempX * cos45 - tempY * sin45;
        const finalY = tempX * sin45 + tempY * cos45;
        const finalZ = tempZ;  // Z축 기준 회전이므로 Z는 변하지 않음
        
        const transformedPoint = {
          x: finalX,
          y: finalY,
          z: finalZ,
          ...point // 다른 속성들 (intensity, rgb 등) 유지
        };
        
        // 변환된 좌표로 덮어쓰기
        transformedPoint.x = finalX;
        transformedPoint.y = finalY;
        transformedPoint.z = finalZ;
        
        return transformedPoint;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 메인 처리 함수
  async processPCDFile(filePath, options = {}) {
    const { maxPoints = 100000, format = 'auto' } = options;
    const startTime = Date.now();
    
    try {
      console.log(`🎯 [PCD Service] 메인 처리 시작:`, {
        filePath: path.basename(filePath),
        requestedMaxPoints: maxPoints,
        format
      });
      
      // 파일 크기 확인
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      console.log(`📏 [PCD Service] 파일 크기: ${fileSizeMB.toFixed(2)} MB`);
      
      // 파일 크기에 따른 최대 포인트 조정
      let adjustedMaxPoints = maxPoints;
      if (fileSizeMB > 1000) { // 1GB 이상
        adjustedMaxPoints = Math.min(maxPoints, 50000);
      } else if (fileSizeMB > 500) { // 500MB 이상
        adjustedMaxPoints = Math.min(maxPoints, 100000);
      } else if (fileSizeMB > 100) { // 100MB 이상
        adjustedMaxPoints = Math.min(maxPoints, 200000);
      }

      if (adjustedMaxPoints !== maxPoints) {
        console.log(`⚠️ [PCD Service] 최대 포인트 조정: ${maxPoints} → ${adjustedMaxPoints} (파일 크기 고려)`);
      }

      // 파일 포맷 감지 (헤더만 읽기)
      console.log(`🔍 [PCD Service] 파일 포맷 감지 중...`);
      const headerStream = fs.createReadStream(filePath, { start: 0, end: 1023 });
      const headerChunks = [];
      
      for await (const chunk of headerStream) {
        headerChunks.push(chunk);
      }
      
      const sampleData = Buffer.concat(headerChunks).toString('utf8');
      const isASCII = sampleData.includes('DATA ascii');
      
      console.log(`📋 [PCD Service] 파일 포맷: ${isASCII ? 'ASCII' : 'Binary'}`);
      
      let result;
      if (isASCII) {
        result = await this.processASCIIPCD(filePath, adjustedMaxPoints);
      } else {
        result = await this.processBinaryPCD(filePath, adjustedMaxPoints);
      }

      const processingTimeMs = Date.now() - startTime;
      
      console.log(`🎉 [PCD Service] 전체 처리 완료:`, {
        processingTimeMs,
        fileSizeMB: fileSizeMB.toFixed(2),
        originalCount: result.originalCount.toLocaleString(),
        processedCount: result.processedCount.toLocaleString(),
        compressionRatio: result.compressionRatio + '%'
      });

      return {
        ...result,
        fileSizeMB,
        processingTimeMs,
        processingMode: fileSizeMB > 1000 ? 'extreme' : 
                       fileSizeMB > 500 ? 'aggressive' : 
                       fileSizeMB > 100 ? 'normal' : 'high-quality'
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      console.error('💥 [PCD Service] 처리 오류:', {
        errorMessage: error.message,
        errorName: error.name,
        processingTimeMs,
        filePath: path.basename(filePath),
        errorStack: error.stack
      });
      throw error;
    }
  }

  // 처리된 파일 정리
  async cleanupFile(filePath) {
    try {
      await fs.remove(filePath);
      console.log(`🗑️ [PCD Service] 임시 파일 삭제 완료: ${path.basename(filePath)}`);
    } catch (error) {
      console.error('💥 [PCD Service] 파일 삭제 오류:', {
        filePath: path.basename(filePath),
        errorMessage: error.message
      });
    }
  }

  // 처리 결과를 JSON으로 저장
  async saveProcessedData(data, filename) {
    const outputPath = path.join(this.uploadsDir, `processed_${filename}.json`);
    
    console.log(`💾 [PCD Service] 처리된 데이터 저장 중:`, {
      filename: `processed_${filename}.json`,
      dataPoints: data.points ? data.points.length : 0,
      originalCount: data.originalCount,
      processedCount: data.processedCount
    });
    
    await fs.writeJSON(outputPath, data, { spaces: 2 });
    
    console.log(`✅ [PCD Service] 데이터 저장 완료: ${path.basename(outputPath)}`);
    
    return outputPath;
  }
}

module.exports = new PCDProcessingService();
