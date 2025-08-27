const pcdProcessingService = require('../services/pcdProcessingService');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Multer 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pcd');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 타임스탬프와 랜덤 문자열로 고유한 파일명 생성
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pcd-${uniqueSuffix}-${file.originalname}`);
  }
});

// 파일 필터
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/octet-stream' || 
      file.originalname.toLowerCase().endsWith('.pcd')) {
    cb(null, true);
  } else {
    cb(new Error('PCD 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 * 1024 // 3GB 제한 (서버에서는 더 큰 파일 처리 가능)
  }
});

class PCDController {
  // PCD 파일 업로드 및 처리
  async uploadAndProcess(req, res) {
    const startTime = Date.now();
    try {
      console.log('🎯 [PCD Controller] 파일 업로드 요청 받음');
      
      if (!req.file) {
        console.log('❌ [PCD Controller] 파일이 업로드되지 않음');
        return res.status(400).json({
          success: false,
          message: 'PCD 파일이 업로드되지 않았습니다.'
        });
      }

      const { maxPoints = 500000 } = req.query;
      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const fileSizeMB = req.file.size / (1024 * 1024);

      console.log(`📁 [PCD Controller] 업로드된 파일 정보:`, {
        originalName,
        fileSizeMB: fileSizeMB.toFixed(2),
        filePath,
        maxPoints: parseInt(maxPoints),
        mimeType: req.file.mimetype
      });

      console.log(`🔄 [PCD Controller] 파일 처리 시작...`);
      
      // PCD 파일 처리
      const processedData = await pcdProcessingService.processPCDFile(filePath, {
        maxPoints: parseInt(maxPoints)
      });

      console.log(`💾 [PCD Controller] 처리된 데이터 저장 중...`);
      
      // 처리된 데이터를 JSON으로 저장
      const savedPath = await pcdProcessingService.saveProcessedData(
        processedData, 
        path.parse(originalName).name
      );

      console.log(`🗑️ [PCD Controller] 원본 파일 정리 중...`);
      
      // 원본 파일 정리
      await pcdProcessingService.cleanupFile(filePath);

      const processingTimeMs = Date.now() - startTime;
      
      console.log(`✅ [PCD Controller] 처리 완료:`, {
        processingTimeMs,
        originalCount: processedData.originalCount,
        processedCount: processedData.processedCount,
        compressionRatio: processedData.compressionRatio,
        pointsDataSize: processedData.points ? processedData.points.length : 0
      });

      // 성공 응답
      res.json({
        success: true,
        message: 'PCD 파일이 성공적으로 처리되었습니다.',
        data: {
          originalName,
          originalSize: fileSizeMB,
          originalCount: processedData.originalCount,
          processedCount: processedData.processedCount,
          compressionRatio: processedData.compressionRatio,
          processingMode: processedData.processingMode,
          points: processedData.points,
          header: processedData.header,
          savedPath: path.basename(savedPath),
          processingTimeMs
        }
      });

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      console.error('💥 [PCD Controller] 처리 오류:', {
        errorMessage: error.message,
        errorName: error.name,
        processingTimeMs,
        filePath: req.file?.path,
        originalName: req.file?.originalname,
        errorStack: error.stack
      });
      
      // 업로드된 파일이 있다면 정리
      if (req.file && req.file.path) {
        console.log(`🗑️ [PCD Controller] 오류 후 파일 정리: ${req.file.path}`);
        await pcdProcessingService.cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: `PCD 파일 처리 중 오류가 발생했습니다: ${error.message}`,
        processingTimeMs,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // 처리된 PCD 데이터 조회
  async getProcessedData(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../uploads/pcd', filename);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({
          success: false,
          message: '요청한 파일을 찾을 수 없습니다.'
        });
      }

      const data = await fs.readJSON(filePath);
      
      res.json({
        success: true,
        data
      });

    } catch (error) {
      console.error('PCD 데이터 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: 'PCD 데이터 조회 중 오류가 발생했습니다.'
      });
    }
  }

  // 업로드 진행 상황 확인 (WebSocket 또는 Server-Sent Events 대안)
  async getUploadStatus(req, res) {
    try {
      // 간단한 상태 확인 응답
      res.json({
        success: true,
        message: 'Upload service is running',
        maxFileSize: '3GB',
        supportedFormats: ['pcd']
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '상태 확인 중 오류가 발생했습니다.'
      });
    }
  }

  // 업로드된 파일 목록 조회
  async listProcessedFiles(req, res) {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/pcd');
      await fs.ensureDir(uploadDir);
      
      const files = await fs.readdir(uploadDir);
      const processedFiles = files.filter(file => file.startsWith('processed_') && file.endsWith('.json'));
      
      const fileList = await Promise.all(
        processedFiles.map(async (filename) => {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          const data = await fs.readJSON(filePath);
          
          return {
            filename,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            originalCount: data.originalCount,
            processedCount: data.processedCount,
            compressionRatio: data.compressionRatio,
            processingMode: data.processingMode
          };
        })
      );

      res.json({
        success: true,
        files: fileList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

    } catch (error) {
      console.error('파일 목록 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '파일 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

const pcdController = new PCDController();

module.exports = {
  upload: upload.single('pcdFile'),
  uploadAndProcess: pcdController.uploadAndProcess.bind(pcdController),
  getProcessedData: pcdController.getProcessedData.bind(pcdController),
  getUploadStatus: pcdController.getUploadStatus.bind(pcdController),
  listProcessedFiles: pcdController.listProcessedFiles.bind(pcdController)
};
