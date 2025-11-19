const { query } = require('../database/connection');
const Logger = require('../utils/logger');

const safeParseJSON = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    Logger.warn('네트워크 로그 메타데이터 파싱 실패', { error: error.message });
    return null;
  }
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const buildDateFilter = (clientType) => {
  const params = [];
  let clause = `DATE(created_at, 'localtime') = DATE('now', 'localtime')`;

  if (clientType) {
    clause += ' AND client_type = ?';
    params.push(clientType);
  }

  return { clause, params };
};

const getTodayNetworkStats = async (req, res, next) => {
  try {
    const clientType = req.query.clientType ? req.query.clientType.toLowerCase() : undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 1000);
    const { clause, params } = buildDateFilter(clientType);

    const logs = await query(
      `
        SELECT
          id,
          client_type,
          source_ip,
          user_agent,
          method,
          path,
          status_code,
          response_time_ms,
          reported_delay_ms,
          packet_loss_rate,
          metadata,
          created_at
        FROM network_logs
        WHERE ${clause}
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `,
      [...params, limit]
    );

    const summaryRows = await query(
      `
        SELECT
          COUNT(*) AS request_count,
          AVG(response_time_ms) AS avg_response_time_ms,
          MAX(response_time_ms) AS max_response_time_ms,
          MIN(response_time_ms) AS min_response_time_ms,
          AVG(packet_loss_rate) AS avg_packet_loss_rate,
          AVG(reported_delay_ms) AS avg_reported_delay_ms
        FROM network_logs
        WHERE ${clause}
      `,
      params
    );

    const summary = summaryRows[0] || {};
    const normalizedLogs = logs.map((log) => ({
      ...log,
      response_time_ms: toNumberOrNull(log.response_time_ms),
      reported_delay_ms: toNumberOrNull(log.reported_delay_ms),
      packet_loss_rate: toNumberOrNull(log.packet_loss_rate),
      metadata: safeParseJSON(log.metadata)
    }));

    res.json({
      date: new Date().toISOString().split('T')[0],
      filters: {
        clientType: clientType || null,
        limit
      },
      summary: {
        totalRequests: summary.request_count || 0,
        avgResponseTimeMs: toNumberOrNull(summary.avg_response_time_ms),
        maxResponseTimeMs: toNumberOrNull(summary.max_response_time_ms),
        minResponseTimeMs: toNumberOrNull(summary.min_response_time_ms),
        avgPacketLossRate: toNumberOrNull(summary.avg_packet_loss_rate),
        avgReportedDelayMs: toNumberOrNull(summary.avg_reported_delay_ms)
      },
      logs: normalizedLogs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayNetworkStats
};

