import { BaseModel } from './base.model.js';
import { query } from '../config/db.js';
import type { AdminUser, QueryParam } from '../types/index.js';

const ADMIN_USER_COLUMNS = ['id', 'username', 'password_hash', 'full_name', 'role', 'created_at'];

export class AdminUserModel extends BaseModel<AdminUser> {
  constructor() {
    super('admin_users', 'id', ADMIN_USER_COLUMNS);
  }

  /**
   * Find an admin/HR user by username (case-insensitive)
   */
  async findByUsername(username: string): Promise<AdminUser | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE LOWER(username) = LOWER($1) LIMIT 1`;
    const rows = await this.raw<AdminUser>(sql, [username.trim() as QueryParam]);
    return rows[0] ?? null;
  }

  /**
   * Automatically initializes the admin_users table and seeds default accounts if absent
   */
  async ensureInitialized(seedAccounts: Array<{ username: string; password_hash: string; full_name: string; role: 'ADMIN' }>): Promise<void> {
    const tableSql = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)::BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
    `;
    await query(tableSql);

    for (const acc of seedAccounts) {
      const existing = await this.findByUsername(acc.username);
      if (!existing) {
        await this.create(acc);
      }
    }
  }
}

export const adminUserModel = new AdminUserModel();
