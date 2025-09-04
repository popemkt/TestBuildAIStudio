"use strict";
/**
 * Logger service for SplitSmart AI application
 * Provides environment-aware logging with different levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logInfo = exports.logWarn = exports.logError = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class LoggerService {
    constructor() {
        var _a, _b;
        // Safe environment detection that works with TypeScript
        this.isDevelopment =
            ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV) ||
                ((_b = import.meta.env) === null || _b === void 0 ? void 0 : _b.NODE_ENV) === 'development';
        this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }
    error(message, ...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('ERROR', message), ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('WARN', message), ...args);
        }
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage('INFO', message), ...args);
        }
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('DEBUG', message), ...args);
        }
    }
    // Convenience methods for common scenarios
    apiError(operation, error) {
        this.error(`API Error in ${operation}:`, error.message, error);
    }
    apiSuccess(operation, data) {
        this.debug(`API Success in ${operation}`, data);
    }
    userAction(action, details) {
        this.debug(`User Action: ${action}`, details);
    }
    performanceStart(operation) {
        if (!this.shouldLog(LogLevel.DEBUG)) {
            return () => { }; // No-op in production
        }
        const startTime = performance.now();
        this.debug(`Performance Start: ${operation}`);
        return () => {
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            this.debug(`Performance End: ${operation} took ${duration}ms`);
        };
    }
}
// Export singleton instance
exports.logger = new LoggerService();
// Export convenience functions for easier migration
exports.logError = exports.logger.error.bind(exports.logger);
exports.logWarn = exports.logger.warn.bind(exports.logger);
exports.logInfo = exports.logger.info.bind(exports.logger);
exports.logDebug = exports.logger.debug.bind(exports.logger);
exports.default = exports.logger;
//# sourceMappingURL=loggerService.js.map