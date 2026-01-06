import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export const routeLogger = logger.child({ component: 'routes' });
export const dbLogger = logger.child({ component: 'database' });
export const s3Logger = logger.child({ component: 's3' });
