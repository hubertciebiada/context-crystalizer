import { promises as fs } from 'fs';
import path from 'path';

export interface TestRepository {
  name: string;
  files: Record<string, string>;
  description: string;
  expectedComplexity: 'low' | 'medium' | 'high';
}

export const sampleRepositories: TestRepository[] = [
  {
    name: 'simple-api',
    description: 'A simple REST API with basic CRUD operations',
    expectedComplexity: 'low',
    files: {
      'package.json': JSON.stringify({
        name: 'simple-api',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.0',
          cors: '^2.8.5'
        }
      }, null, 2),
      'src/index.ts': `import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      'src/routes/users.ts': `import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';

export const userRoutes = Router();
const userController = new UserController();

userRoutes.get('/', userController.getUsers);
userRoutes.post('/', userController.createUser);
userRoutes.get('/:id', userController.getUserById);
userRoutes.put('/:id', userController.updateUser);
userRoutes.delete('/:id', userController.deleteUser);`,
      'src/controllers/UserController.ts': `import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';

export class UserController {
  private userService = new UserService();

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (_error) {
      res.status(400).json({ error: 'Failed to create user' });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (_error) {
      res.status(400).json({ error: 'Failed to update user' });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      await this.userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };
}`,
      'src/services/UserService.ts': `export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  private users: User[] = [];

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  async deleteUser(id: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users.splice(userIndex, 1);
  }
}`,
      'README.md': `# Simple API

A basic REST API for user management with CRUD operations.

## Features
- Create, read, update, delete users
- Express.js framework
- TypeScript support
- CORS enabled

## API Endpoints
- GET /api/users - Get all users
- POST /api/users - Create new user
- GET /api/users/:id - Get user by ID
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user`
    }
  },
  {
    name: 'complex-microservice',
    description: 'A complex microservice with authentication, database, caching, and monitoring',
    expectedComplexity: 'high',
    files: {
      'package.json': JSON.stringify({
        name: 'complex-microservice',
        version: '2.1.0',
        dependencies: {
          express: '^4.18.0',
          'prisma': '^5.0.0',
          'redis': '^4.6.0',
          'jsonwebtoken': '^9.0.0',
          'bcryptjs': '^2.4.3',
          'helmet': '^7.0.0',
          'rate-limiter-flexible': '^3.0.0',
          'prom-client': '^14.2.0',
          'winston': '^3.10.0'
        }
      }, null, 2),
      'src/index.ts': `import express from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/users.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { logger } from './utils/logger.js';
import { DatabaseService } from './services/DatabaseService.js';
import { CacheService } from './services/CacheService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(rateLimiter);
app.use(metricsMiddleware);
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    await DatabaseService.connect();
    await CacheService.connect();
    
    app.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
    });
  } catch (_error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();`,
      'src/middleware/auth.ts': `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await UserService.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (_error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};`,
      'src/services/DatabaseService.ts': `import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export class DatabaseService {
  private static instance: PrismaClient;

  static async connect(): Promise<PrismaClient> {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Log database queries
      this.instance.$on('query', (e) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Duration: ' + e.duration + 'ms');
      });

      this.instance.$on('error', (e) => {
        logger.error('Database error:', e);
      });

      await this.instance.$connect();
      logger.info('Database connected successfully');
    }

    return this.instance;
  }

  static getInstance(): PrismaClient {
    if (!this.instance) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      logger.info('Database disconnected');
    }
  }

  static async executeTransaction<T>(
    operation: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    const db = this.getInstance();
    return db.$transaction(operation);
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const db = this.getInstance();
      await db.$queryRaw\`SELECT 1\`;
      return true;
    } catch (_error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}`,
      'src/services/CacheService.ts': `import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger.js';

export class CacheService {
  private static client: RedisClientType;

  static async connect(): Promise<void> {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    await this.client.connect();
  }

  static async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (_error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (_error) {
      logger.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (_error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (_error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(\`Invalidated \${keys.length} cache entries matching pattern: \${pattern}\`);
      }
    } catch (_error) {
      logger.error('Cache pattern invalidation error:', error);
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      logger.info('Redis disconnected');
    }
  }
}`
    }
  },
  {
    name: 'config-heavy',
    description: 'A project with extensive configuration files and minimal code',
    expectedComplexity: 'medium',
    files: {
      'package.json': JSON.stringify({
        name: 'config-heavy-project',
        version: '1.0.0',
        scripts: {
          build: 'webpack --mode production',
          dev: 'webpack serve --mode development',
          test: 'jest',
          lint: 'eslint src/**/*.ts'
        }
      }, null, 2),
      'webpack.config.js': `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
    module: {
      rules: [
        {
          test: /\\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: isProduction,
      }),
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      })] : []),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin(),
        new OptimizeCSSAssetsPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 9000,
      hot: true,
    },
  };
};`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          allowJs: true,
          strict: true,
          noImplicitAny: true,
          strictNullChecks: true,
          strictFunctionTypes: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          noImplicitThis: true,
          alwaysStrict: true,
          declaration: true,
          outDir: './dist',
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
            '@components/*': ['src/components/*'],
            '@utils/*': ['src/utils/*']
          }
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),
      '.eslintrc.json': JSON.stringify({
        extends: [
          '@typescript-eslint/recommended',
          'plugin:@typescript-eslint/recommended-requiring-type-checking'
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          project: './tsconfig.json'
        },
        plugins: ['@typescript-eslint'],
        rules: {
          '@typescript-eslint/no-unused-vars': 'error',
          '@typescript-eslint/explicit-function-return-type': 'warn',
          '@typescript-eslint/no-explicit-any': 'warn',
          '@typescript-eslint/prefer-nullish-coalescing': 'error',
          '@typescript-eslint/prefer-optional-chain': 'error'
        }
      }, null, 2),
      'src/index.ts': `import { ConfigManager } from './config/ConfigManager.js';
import { Logger } from './utils/Logger.js';

const config = new ConfigManager();
const logger = new Logger();

logger.info('Application starting with config:', config.getAll());

export { config, logger };`,
      'src/config/ConfigManager.ts': `export class ConfigManager {
  private config: Record<string, any> = {};

  constructor() {
    this.loadEnvironmentConfig();
  }

  private loadEnvironmentConfig(): void {
    this.config = {
      environment: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'app_db',
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    };
  }

  get(key: string): any {
    return this.config[key];
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }
}`
    }
  }
];

export async function createTestRepository(repo: TestRepository, basePath: string): Promise<string> {
  const repoPath = path.join(basePath, repo.name);
  await fs.mkdir(repoPath, { recursive: true });

  for (const [filePath, content] of Object.entries(repo.files)) {
    const fullPath = path.join(repoPath, filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  return repoPath;
}

export async function cleanupTestRepository(repoPath: string): Promise<void> {
  try {
    await fs.rmdir(repoPath, { recursive: true });
  } catch {
    // Directory might not exist
  }
}