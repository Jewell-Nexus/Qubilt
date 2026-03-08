export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value && isProduction) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
  };

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv,
    database: {
      url: requireEnv('DATABASE_URL'),
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    jwt: {
      secret: requireEnv('JWT_SECRET'),
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    storage: {
      driver: process.env.STORAGE_DRIVER || 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
      s3: {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || '',
        accessKey: process.env.S3_ACCESS_KEY || '',
        secretKey: process.env.S3_SECRET_KEY || '',
        endpoint: process.env.S3_ENDPOINT || '',
      },
    },
    email: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.EMAIL_FROM || 'noreply@qubilt.com',
    },
    app: {
      url: process.env.APP_URL || 'http://localhost:3000',
      apiUrl: process.env.API_URL || 'http://localhost:3001',
    },
  };
};
