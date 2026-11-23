import { query } from '../config/db.js';
import type {
  PaginationOptions,
  PaginationResult,
  QueryParam,
  QueryRow,
} from '../types/index.js';

// Re-export pagination types for backward compatibility
export type { PaginationOptions, PaginationResult };

/**
 * Generic typed BaseModel class providing CRUD, server-side pagination,
 * multi-column ILIKE search, and strict column allowlist protection against SQL injection.
 */
export class BaseModel<T extends Record<string, any>> {
  protected tableName: string;
  protected primaryKey: string;
  protected allowedColumns: Set<string>;

  constructor(
    tableName: string,
    primaryKey: string = 'id',
    allowedColumns: string[] = []
  ) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.allowedColumns = new Set(allowedColumns);
  }

  /**
   * Validates a column name against the model's allowlist to prevent SQL injection.
   */
  protected assertValidColumn(column: string): string {
    if (this.allowedColumns.size > 0 && !this.allowedColumns.has(column)) {
      throw new Error(`Unauthorized column access: '${column}' is not allowed for table '${this.tableName}'`);
    }
    return column;
  }

  /**
   * Find records matching a filter object
   */
  async find(filter: Partial<T> = {}): Promise<T[]> {
    const conditions: string[] = [];
    const values: QueryParam[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        this.assertValidColumn(key);
        conditions.push(`"${key}" = $${paramIndex}`);
        values.push(value as QueryParam);
        paramIndex++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM "${this.tableName}" ${whereClause} ORDER BY "${this.primaryKey}" ASC`;
    const res = await query<T>(sql, values);
    return res.rows;
  }

  /**
   * Find a single record by primary key
   */
  async findById(id: number | string): Promise<T | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "${this.primaryKey}" = $1 LIMIT 1`;
    const res = await query<T>(sql, [id as QueryParam]);
    return res.rows.length > 0 ? res.rows[0] : null;
  }

  /**
   * Find paginated records with safe multi-column search, filtering, and sorting
   */
  async findPaginated(options: PaginationOptions<T> = {}): Promise<PaginationResult<T>> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 25)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: QueryParam[] = [];
    let paramIndex = 1;

    // 1. Structured Filter Equality (Column Allowlist checked)
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        if (value !== undefined && value !== null && value !== '') {
          this.assertValidColumn(key);
          conditions.push(`"${key}" = $${paramIndex}`);
          values.push(value as QueryParam);
          paramIndex++;
        }
      }
    }

    // 2. Multi-column ILIKE Search (Column Allowlist checked)
    if (options.search && options.search.query && options.search.columns.length > 0) {
      const searchTerm = `%${options.search.query.trim()}%`;
      const searchConditions = options.search.columns.map((col) => {
        const validatedCol = this.assertValidColumn(String(col));
        return `"${validatedCol}"::text ILIKE $${paramIndex}`;
      });
      conditions.push(`(${searchConditions.join(' OR ')})`);
      values.push(searchTerm as QueryParam);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count Query
    const countSql = `SELECT COUNT(*)::int AS total FROM "${this.tableName}" ${whereClause}`;
    const countRes = await query<{ total: number }>(countSql, values);
    const total = Number(countRes.rows[0]?.total || 0);

    // 3. Sort setup (Column Allowlist checked)
    const rawSortField = options.sort?.field ? String(options.sort.field) : this.primaryKey;
    const sortField = this.assertValidColumn(rawSortField);
    const sortOrder = options.sort?.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Data Query
    const dataSql = `
      SELECT * FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "${sortField}" ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await query<T>(dataSql, [...values, limit, offset]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Insert a new record
   */
  async create(data: Partial<T>): Promise<T> {
    const keys = (Object.keys(data) as Array<keyof T>).filter(
      (k) => data[k] !== undefined
    );
    if (keys.length === 0) {
      throw new Error(`Cannot insert empty record into ${this.tableName}`);
    }

    keys.forEach((key) => this.assertValidColumn(String(key)));

    const cols = keys.map((k) => `"${String(k)}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values: QueryParam[] = keys.map((k) => data[k] as QueryParam);

    const sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES (${placeholders}) RETURNING *`;
    const res = await query<T>(sql, values);
    return res.rows[0];
  }

  /**
   * Update an existing record by primary key
   */
  async update(id: number | string, data: Partial<T>): Promise<T | null> {
    const keys = (Object.keys(data) as Array<keyof T>).filter(
      (k) => data[k] !== undefined && String(k) !== this.primaryKey
    );
    if (keys.length === 0) {
      return this.findById(id);
    }

    keys.forEach((key) => this.assertValidColumn(String(key)));

    const setClauses = keys.map((k, i) => `"${String(k)}" = $${i + 1}`).join(', ');
    const values: QueryParam[] = keys.map((k) => data[k] as QueryParam);
    values.push(id as QueryParam);

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setClauses}
      WHERE "${this.primaryKey}" = $${values.length}
      RETURNING *
    `;
    const res = await query<T>(sql, values);
    return res.rows.length > 0 ? res.rows[0] : null;
  }

  /**
   * Delete a record by primary key
   */
  async delete(id: number | string): Promise<T | null> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "${this.primaryKey}" = $1 RETURNING *`;
    const res = await query<T>(sql, [id as QueryParam]);
    return res.rows.length > 0 ? res.rows[0] : null;
  }

  /**
   * Raw query execution helper
   */
  async raw<R = QueryRow>(sql: string, params: QueryParam[] = []): Promise<R[]> {
    const res = await query<R>(sql, params);
    return res.rows;
  }
}
