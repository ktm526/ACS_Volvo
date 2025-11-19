const multer = require('multer');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const sharp = require('sharp');
const { query } = require('../database/connection');

// 파일 업로드 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}_${timestamp}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // 파일 타입 확인
    const allowedTypes = {
      'image': ['.jpg', '.jpeg', '.png', '.pgm'],
      'metadata': ['.yaml', '.yml'],
      'nodes': ['.yaml', '.yml']
    };
    
    const ext = path.extname(file.originalname).toLowerCase();
    const fieldAllowed = allowedTypes[file.fieldname];
    
    if (fieldAllowed && fieldAllowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`${file.fieldname} 파일은 ${fieldAllowed.join(', ')} 형식만 허용됩니다.`));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 메타데이터에서 맵 이름 추출
function extractMapNameFromMetadata(metadataPath) {
  try {
    const metadataContent = fs.readFileSync(metadataPath, 'utf8');
    const metadata = yaml.load(metadataContent);
    
    if (metadata && metadata.image) {
      // 파일 확장자 제거
      const imageName = metadata.image.replace(/\.(pgm|jpg|jpeg|png)$/i, '');
      return imageName;
    }
    
    return null;
  } catch (error) {

    return null;
  }
}

// PGM 파일을 직접 파싱하는 함수
function parsePGMFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 0;
  
  // P5 매직 넘버 확인
  if (buffer[0] !== 0x50 || buffer[1] !== 0x35) { // 'P5'
    throw new Error('유효하지 않은 PGM 파일입니다.');
  }
  offset += 2;
  
  // 개행 문자 스킵
  if (buffer[offset] === 0x0A) offset++;
  
  // 너비와 높이 파싱
  let dimensionStr = '';
  while (buffer[offset] !== 0x0A) {
    dimensionStr += String.fromCharCode(buffer[offset]);
    offset++;
  }
  offset++; // 개행 문자 스킵
  
  const [width, height] = dimensionStr.split(' ').map(Number);
  
  // 최대값 파싱
  let maxValStr = '';
  while (buffer[offset] !== 0x0A) {
    maxValStr += String.fromCharCode(buffer[offset]);
    offset++;
  }
  offset++; // 개행 문자 스킵
  
  const maxVal = parseInt(maxValStr);
  
  // 픽셀 데이터 추출
  const pixelData = buffer.slice(offset);
  
  return {
    width,
    height,
    maxVal,
    pixelData
  };
}

// 이미지 색상 변환 함수 (흰색 -> 투명, 검은색 -> 흰색)
async function processMapImage(inputPath, outputPath) {
  try {
    console.log('processMapImage: 시작', { inputPath, outputPath });
    
    // 먼저 입력 파일 존재 확인
    if (!fs.existsSync(inputPath)) {
      console.error('processMapImage: 입력 파일이 존재하지 않습니다:', inputPath);
      return false;
    }
    
    let width, height, data;
    
    // PGM 파일인 경우 직접 파싱
    if (inputPath.toLowerCase().endsWith('.pgm')) {
      console.log('processMapImage: PGM 파일 직접 파싱');
      const pgmData = parsePGMFile(inputPath);
      width = pgmData.width;
      height = pgmData.height;
      
      console.log('processMapImage: PGM 파일 정보', { width, height, maxVal: pgmData.maxVal, dataLength: pgmData.pixelData.length });
      
      // 그레이스케일을 RGBA로 변환
      const pixelCount = width * height;
      data = Buffer.alloc(pixelCount * 4); // RGBA
      
      for (let i = 0; i < pixelCount; i++) {
        const grayValue = pgmData.pixelData[i];
        const outputIndex = i * 4;
        
        // 밝기에 따른 변환
        if (grayValue > 200) {
          // 흰색 계열 → 투명
          data[outputIndex] = 0;     // R
          data[outputIndex + 1] = 0; // G
          data[outputIndex + 2] = 0; // B
          data[outputIndex + 3] = 0; // A (투명)
        } else if (grayValue < 100) {
          // 검은색 계열 → 흰색
          data[outputIndex] = 255;     // R
          data[outputIndex + 1] = 255; // G
          data[outputIndex + 2] = 255; // B
          data[outputIndex + 3] = 255; // A (불투명)
        } else {
          // 중간 회색 → 회색
          data[outputIndex] = 128;     // R
          data[outputIndex + 1] = 128; // G
          data[outputIndex + 2] = 128; // B
          data[outputIndex + 3] = 200; // A (반투명)
        }
      }
    } else {
      // 다른 이미지 포맷은 Sharp로 처리
      console.log('processMapImage: Sharp로 이미지 처리');
      const { data: sharpData, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      width = info.width;
      height = info.height;
      data = sharpData;
      
      console.log('processMapImage: Sharp 처리 완료', { width, height, channels: info.channels, dataLength: data.length });
      
      // 이미 RGBA가 아닌 경우 변환 로직 적용
      if (info.channels !== 4) {
        const pixelCount = width * height;
        const outputData = Buffer.alloc(pixelCount * 4);
        
        for (let i = 0; i < pixelCount; i++) {
          const inputIndex = i * info.channels;
          const outputIndex = i * 4;
          
          const r = data[inputIndex];
          const g = info.channels > 1 ? data[inputIndex + 1] : r;
          const b = info.channels > 2 ? data[inputIndex + 2] : r;
          
          const brightness = (r + g + b) / 3;
          
          if (brightness > 200) {
            outputData[outputIndex] = 0;
            outputData[outputIndex + 1] = 0;
            outputData[outputIndex + 2] = 0;
            outputData[outputIndex + 3] = 0;
          } else if (brightness < 100) {
            outputData[outputIndex] = 255;
            outputData[outputIndex + 1] = 255;
            outputData[outputIndex + 2] = 255;
            outputData[outputIndex + 3] = 255;
          } else {
            outputData[outputIndex] = 128;
            outputData[outputIndex + 1] = 128;
            outputData[outputIndex + 2] = 128;
            outputData[outputIndex + 3] = 200;
          }
        }
        data = outputData;
      }
    }

    console.log('processMapImage: PNG 파일로 저장 시작');
    // 변환된 이미지 저장
    await sharp(data, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
    .png() // PNG로 저장 (투명도 지원)
    .toFile(outputPath);
    
    console.log('processMapImage: PNG 파일 저장 완료:', outputPath);
    

    return true;
    
  } catch (error) {
    console.error('processMapImage: 오류 발생', {
      error: error.message,
      stack: error.stack,
      inputPath,
      outputPath
    });
    return false;
  }
}

const mapController = {
  // 맵 목록 조회
  getAllMaps: async (req, res) => {
    try {
      const maps = await query('SELECT * FROM maps ORDER BY created_at DESC');
      res.json(maps);
    } catch (error) {

      res.status(500).json({ error: '맵 목록 조회 중 오류가 발생했습니다.' });
    }
  },

  // 맵 상세 조회
  getMapById: async (req, res) => {
    try {
      const { id } = req.params;
      const map = await query('SELECT * FROM maps WHERE id = ?', [id]);
      
      if (map.length === 0) {
        return res.status(404).json({ error: '맵을 찾을 수 없습니다.' });
      }
      
      res.json(map[0]);
    } catch (error) {

      res.status(500).json({ error: '맵 상세 조회 중 오류가 발생했습니다.' });
    }
  },

  // 맵 픽셀 데이터 조회 (텍스처 방식에서는 빈 배열 반환)
  getMapPixelData: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 맵 존재 확인
      const map = await query('SELECT * FROM maps WHERE id = ?', [id]);
      if (map.length === 0) {
        return res.status(404).json({ error: '맵을 찾을 수 없습니다.' });
      }
      
      // 텍스처 방식에서는 픽셀 데이터 불필요
      res.json([]);
    } catch (error) {

      res.status(500).json({ error: '맵 픽셀 데이터 조회 중 오류가 발생했습니다.' });
    }
  },

  // 맵 데이터 조회 (노드 + 연결)
  getMapData: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 맵 정보 조회
      const map = await query('SELECT * FROM maps WHERE id = ?', [id]);
      if (map.length === 0) {
        return res.status(404).json({ error: '맵을 찾을 수 없습니다.' });
      }
      
      // 노드 데이터 조회
      const nodes = await query('SELECT * FROM map_nodes WHERE map_id = ? ORDER BY node_index', [id]);
      
      // 연결 데이터 조회
      const connections = await query('SELECT * FROM map_connections WHERE map_id = ?', [id]);
      
      res.json({
        map: map[0],
        nodes,
        connections
      });
    } catch (error) {

      res.status(500).json({ error: '맵 데이터 조회 중 오류가 발생했습니다.' });
    }
  },

  // 맵 생성
  createMap: async (req, res) => {
    try {
      const { image, metadata, nodes } = req.files;
      
      if (!image || !metadata) {
        return res.status(400).json({ error: '이미지 파일과 메타데이터 파일이 필요합니다.' });
      }
      
      const imagePath = image[0].path;
      const metadataPath = metadata[0].path;
      const nodesPath = nodes ? nodes[0].path : null;
      
      // 메타데이터에서 맵 이름 추출
      const mapName = extractMapNameFromMetadata(metadataPath);
      if (!mapName) {
        return res.status(400).json({ error: '메타데이터에서 맵 이름을 추출할 수 없습니다.' });
      }
      
      // 변환된 이미지 경로 생성
      const timestamp = Date.now();
      const processedImagePath = path.join(
        path.dirname(imagePath),
        `processed_${mapName}_${timestamp}.png`
      );
      
      // 이미지 색상 변환 처리
      console.log('createMap: 이미지 처리 시작', { imagePath, processedImagePath });
      const processSuccess = await processMapImage(imagePath, processedImagePath);
      console.log('createMap: 이미지 처리 결과', processSuccess);
      
      if (!processSuccess) {
        console.error('createMap: 이미지 색상 변환 처리 실패');
        return res.status(500).json({ error: '이미지 색상 변환 처리에 실패했습니다.' });
      }
      
      console.log('createMap: 이미지 처리 완료, 처리된 파일 확인');
      if (!fs.existsSync(processedImagePath)) {
        console.error('createMap: 처리된 이미지 파일이 생성되지 않았습니다:', processedImagePath);
        return res.status(500).json({ error: '처리된 이미지 파일 생성에 실패했습니다.' });
      }
      
      // 메타데이터 파싱
      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      const metadata_obj = yaml.load(metadataContent);
      
      
      
      // 이미지 크기 정보 가져오기 (메타데이터에 없으면 실제 이미지에서 추출)
      let imageWidth = metadata_obj.width || 0;
      let imageHeight = metadata_obj.height || 0;
      
      if (!imageWidth || !imageHeight) {
        try {
          const imageInfo = await sharp(imagePath).metadata();
          imageWidth = imageInfo.width;
          imageHeight = imageInfo.height;

        } catch (error) {

        }
      }
      
      // 맵 정보 DB 저장 (처리된 이미지 경로 사용)
      const mapResult = await query(
        `INSERT INTO maps (name, image_path, metadata_path, nodes_path, resolution, origin_x, origin_y, width, height, occupied_thresh, free_thresh) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mapName,
          processedImagePath, // 처리된 이미지 경로 저장
          metadataPath,
          nodesPath,
          metadata_obj.resolution || 0.05,
          metadata_obj.origin ? metadata_obj.origin[0] : 0,
          metadata_obj.origin ? metadata_obj.origin[1] : 0,
          imageWidth,
          imageHeight,
          metadata_obj.occupied_thresh || 0.65,
          metadata_obj.free_thresh || 0.196
        ]
      );
      
      const mapId = mapResult.insertId;
      
      // 노드 데이터 처리
      let nodeCount = 0;
      let connectionCount = 0;
      
      if (nodesPath) {

        const nodesContent = fs.readFileSync(nodesPath, 'utf8');
        const nodesData = yaml.load(nodesContent);
        

        
        if (nodesData && nodesData.node) {

          for (const node of nodesData.node) {

            await query(
              `INSERT INTO map_nodes (map_id, node_index, name, position_x, position_y, type) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [mapId, node.index, node.name, node.position.x, node.position.y, node.type]
            );
            nodeCount++;
            
            // 각 노드의 연결 정보 처리
            if (node.connection && node.connection.length > 0) {
              for (const connectedNodeIndex of node.connection) {

                await query(
                  `INSERT INTO map_connections (map_id, from_node_index, to_node_index) 
                   VALUES (?, ?, ?)`,
                  [mapId, node.index, connectedNodeIndex]
                );
                connectionCount++;
              }
            }
          }

        } else {

        }
      } else {

      }
      
      res.status(201).json({
        message: '맵이 성공적으로 생성되었습니다.',
        mapId: mapId,
        mapName: mapName,
        nodeCount: nodeCount,
        connectionCount: connectionCount
      });
      
    } catch (error) {

      res.status(500).json({ error: '맵 생성 중 오류가 발생했습니다.' });
    }
  },

  // 맵 수정
  updateMap: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      await query('UPDATE maps SET name = ? WHERE id = ?', [name, id]);
      res.json({ message: '맵이 성공적으로 수정되었습니다.' });
    } catch (error) {

      res.status(500).json({ error: '맵 수정 중 오류가 발생했습니다.' });
    }
  },

  // 맵 삭제
  deleteMap: async (req, res) => {
    try {
      const { id } = req.params;
      
      // 맵 정보 조회
      const map = await query('SELECT * FROM maps WHERE id = ?', [id]);
      if (map.length === 0) {
        return res.status(404).json({ error: '맵을 찾을 수 없습니다.' });
      }
      
      // 파일 삭제
      const mapData = map[0];
      if (mapData.image_path && fs.existsSync(mapData.image_path)) {
        fs.unlinkSync(mapData.image_path);
      }
      if (mapData.metadata_path && fs.existsSync(mapData.metadata_path)) {
        fs.unlinkSync(mapData.metadata_path);
      }
      if (mapData.nodes_path && fs.existsSync(mapData.nodes_path)) {
        fs.unlinkSync(mapData.nodes_path);
      }
      
      // DB 데이터 삭제
      await query('DELETE FROM map_connections WHERE map_id = ?', [id]);
      await query('DELETE FROM map_nodes WHERE map_id = ?', [id]);
      await query('DELETE FROM maps WHERE id = ?', [id]);
      
      res.json({ message: '맵이 성공적으로 삭제되었습니다.' });
    } catch (error) {

      res.status(500).json({ error: '맵 삭제 중 오류가 발생했습니다.' });
    }
  },

  // 파일 다운로드
  downloadFile: async (req, res) => {
    try {
      const { id, fileType } = req.params;
      
  
      
      const map = await query('SELECT * FROM maps WHERE id = ?', [id]);
      if (map.length === 0) {

        return res.status(404).json({ error: '맵을 찾을 수 없습니다.' });
      }
      
      const mapData = map[0];

      
      let filePath;
      
      switch (fileType) {
        case 'image':
          filePath = mapData.image_path;
          break;
        case 'metadata':
          filePath = mapData.metadata_path;
          break;
        case 'nodes':
          filePath = mapData.nodes_path;
          break;
        default:

          return res.status(400).json({ error: '잘못된 파일 타입입니다.' });
      }
      

      
      if (!filePath || !fs.existsSync(filePath)) {

        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }
      

      res.sendFile(path.resolve(filePath));
    } catch (error) {

      res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = { mapController, upload }; 