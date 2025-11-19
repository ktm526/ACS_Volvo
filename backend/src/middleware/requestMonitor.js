const { query } = require('../database/connection');
const Logger = require('../utils/logger');

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const determineClientType = (req) => {
  const headerClient = (req.get('x-client-type') || '').trim().toLowerCase();
  if (headerClient) {
    return headerClient;
  }

  if (req.get('x-robot-id')) {
    return 'robot';
  }

  const path = req.path || '';
  if (path.startsWith('/api/robots') || path.startsWith('/api/missions')) {
    return 'robot';
  }

  const userAgent = (req.get('user-agent') || '').toLowerCase();
  if (userAgent.includes('mozilla') || userAgent.includes('chrome') || userAgent.includes('safari')) {
    return 'frontend';
  }

  return 'unknown';
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    Logger.warn('메타데이터 직렬화 실패', { error: error.message });
    return null;
  }
};

const requestMonitor = () => {
  return (req, res, next) => {
    if (!req.originalUrl || !req.originalUrl.startsWith('/api')) {
      next();
      return;
    }

    const startTs = typeof process.hrtime.bigint === 'function'
      ? process.hrtime.bigint()
      : process.hrtime();

    const reportedDelayMs = toNumberOrNull(req.get('x-network-delay-ms'));
    const packetLossRate = toNumberOrNull(req.get('x-packet-loss-rate'));
    const signalStrength = toNumberOrNull(req.get('x-signal-strength'));
    const jitterMs = toNumberOrNull(req.get('x-jitter-ms'));

    const captureDuration = () => {
      if (typeof startTs === 'bigint') {
        const end = process.hrtime.bigint();
        return Number(end - startTs) / 1e6;
      }

      const diff = process.hrtime(startTs);
      return diff[0] * 1000 + diff[1] / 1e6;
    };

    const persistLog = () => {
      const responseTimeMs = captureDuration();
      const metadata = {
        referer: req.get('referer') || null,
        robotId: req.get('x-robot-id') || req.body?.robotId || null,
        missionId: req.body?.missionId || null,
        network: {
          signalStrength,
          jitterMs
        }
      };

      const params = [
        determineClientType(req),
        req.ip || req.socket?.remoteAddress || null,
        req.get('user-agent') || null,
        req.method,
        req.originalUrl,
        res.statusCode,
        responseTimeMs,
        reportedDelayMs,
        packetLossRate,
        safeStringify(metadata)
      ];

      query(
        `
          INSERT INTO network_logs (
            client_type,
            source_ip,
            user_agent,
            method,
            path,
            status_code,
            response_time_ms,
            reported_delay_ms,
            packet_loss_rate,
            metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params
      ).catch((error) => {
        Logger.error('네트워크 로그 저장 실패', { error: error.message });
      });
    };

    res.on('finish', persistLog);

    res.on('close', () => {
      res.removeListener('finish', persistLog);
    });

    next();
  };
};

module.exports = requestMonitor;

