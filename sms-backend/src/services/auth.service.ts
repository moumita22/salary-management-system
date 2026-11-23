import crypto from 'node:crypto';
import { adminUserModel } from '../models/admin_users.model.js';
import { AppError, type AuthSessionUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'acme-sms-secret-key-production-hardened-2026';
const TOKEN_TTL_HOURS = 24;

export class AuthService {
  private isInitialized = false;

  /**
   * Hashes a password using PBKDF2 with a randomly generated 16-byte salt
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies a plain text password against a stored PBKDF2 salt:hash
   */
  verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    const testBuf = Buffer.from(testHash, 'hex');
    const origBuf = Buffer.from(originalHash, 'hex');
    if (testBuf.length !== origBuf.length) return false;
    return crypto.timingSafeEqual(testBuf, origBuf);
  }

  /**
   * Generates a signed Bearer token with expiration
   */
  generateToken(user: AuthSessionUser): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_HOURS * 3600;
    const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validates and decodes a signed Bearer token
   */
  verifyToken(token: string): AuthSessionUser {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AppError('Invalid authentication token format', 401, 'UnauthorizedError');
    }

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new AppError('Invalid token signature', 401, 'UnauthorizedError');
    }

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new AppError('Session token has expired. Please log in again.', 401, 'TokenExpiredError');
      }
      return {
        id: decoded.id,
        username: decoded.username,
        full_name: decoded.full_name,
        role: decoded.role,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid token payload', 401, 'UnauthorizedError');
    }
  }

  /**
   * Helper to map user model to session user and signed token
   */
  private toSession(user: { id: number; username: string; full_name?: string | null; role: 'ADMIN' }): { token: string; user: AuthSessionUser } {
    const sessionUser: AuthSessionUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name || user.username,
      role: user.role,
    };
    const token = this.generateToken(sessionUser);
    return { token, user: sessionUser };
  }

  /**
   * Authenticates user credentials and issues a Bearer token
   */
  async login(username: string, password: string): Promise<{ token: string; user: AuthSessionUser }> {
    await this.ensureAccounts();

    if (!username || !password) {
      throw new AppError('Username and password are required', 400, 'ValidationError');
    }

    const user = await adminUserModel.findByUsername(username);
    if (!user) {
      throw new AppError('Invalid username or password', 401, 'InvalidCredentialsError');
    }

    const isValid = this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid username or password', 401, 'InvalidCredentialsError');
    }

    return this.toSession(user);
  }

  /**
   * Registers a new administrator user account and returns Bearer token
   */
  async register(data: { username: string; password: string; full_name?: string }): Promise<{ token: string; user: AuthSessionUser }> {
    await this.ensureAccounts();

    const username = data.username?.trim();
    const password = data.password;
    const fullName = data.full_name?.trim() || username;

    if (!username || username.length < 3) {
      throw new AppError('Username must be at least 3 characters long', 400, 'ValidationError');
    }
    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'ValidationError');
    }

    const existing = await adminUserModel.findByUsername(username);
    if (existing) {
      throw new AppError('Username is already taken', 409, 'ConflictError');
    }

    const passwordHash = this.hashPassword(password);
    const created = await adminUserModel.create({
      username,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'ADMIN',
    });

    return this.toSession(created);
  }

  /**
   * Ensures default admin user exists in the database
   */
  async ensureAccounts(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await adminUserModel.ensureInitialized([
        {
          username: 'admin',
          password_hash: this.hashPassword('adminpassword'),
          full_name: 'System Administrator',
          role: 'ADMIN',
        },
      ]);
      this.isInitialized = true;
    } catch (err) {
      console.error('[AuthService] Failed to initialize default admin users:', err);
    }
  }
}

export const authService = new AuthService();
