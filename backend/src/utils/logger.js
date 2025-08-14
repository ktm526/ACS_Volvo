class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
  }

  static info(message, meta = {}) {
    this.log('info', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  static error(message, meta = {}) {
    this.log('error', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

module.exports = Logger; 