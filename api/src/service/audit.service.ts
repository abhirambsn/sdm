import db from "../models/audit.model";
import { type Statement } from "better-sqlite3";

export interface AuditRecord {
  id?: number;
  actor: string;
  action: string;
  target?: string | null;
  details?: Record<string, any> | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at?: string;
}
export class AuditService {
  insertStmt: Statement = db.prepare(`
    INSERT INTO audit_logs (actor, action, target, details, ip, user_agent, created_at)
    VALUES (@actor, @action, @target, @details, @ip, @user_agent, @created_at)
  `);

  listStmt: Statement<any, any> = db.prepare(`
    SELECT id, actor, action, target, details, ip, user_agent, created_at
    FROM audit_logs
    WHERE
      (@actor IS NULL OR actor = @actor)
      AND (@action IS NULL OR action = @action)
      AND (@date_from IS NULL OR datetime(created_at) >= datetime(@date_from))
      AND (@date_to IS NULL OR datetime(created_at) <= datetime(@date_to))
    ORDER BY datetime(created_at) DESC
    LIMIT @limit OFFSET @offset
  `);

  getStmt: Statement<any, any> = db.prepare(`
    SELECT id, actor, action, target, details, ip, user_agent, created_at
    FROM audit_logs
    WHERE id = ?
  `);

  countStmt: Statement<any, any> = db.prepare<any, any>(`
    SELECT COUNT(1) as cnt FROM audit_logs
    WHERE
      (@actor IS NULL OR actor = @actor)
      AND (@action IS NULL OR action = @action)
      AND (@date_from IS NULL OR datetime(created_at) >= datetime(@date_from))
      AND (@date_to IS NULL OR datetime(created_at) <= datetime(@date_to))
  `);

  async record(
    action: string,
    actor: string,
    details: Record<string, any> = {},
    meta: { ip?: string; userAgent?: string } = {}
  ) {
    const now = new Date().toISOString();
    const target = details.target || null;
    const payload = {
      actor,
      action,
      target,
      details: JSON.stringify(details),
      ip: meta.ip || null,
      user_agent: meta.userAgent || null,
      created_at: now,
    };
    const info = this.insertStmt.run(payload);
    return info.lastInsertRowid as number;
  }

  async list(opts: {
    actor?: string | null;
    action?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    limit?: number;
    offset?: number;
  }) {
    const rows = this.listStmt.all({
      actor: opts.actor || null,
      action: opts.action || null,
      date_from: opts.date_from || null,
      date_to: opts.date_to || null,
      limit: opts.limit ?? 50,
      offset: opts.offset ?? 0,
    });

    // parse details JSON
    const parsed = rows.map((r: any) => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null,
    }));

    const count = this.countStmt.get({
      actor: opts.actor || null,
      action: opts.action || null,
      date_from: opts.date_from || null,
      date_to: opts.date_to || null,
    }).cnt as number;

    return { rows: parsed, total: count };
  }

  async get(id: number) {
    const row = this.getStmt.get(id);
    if (!row) return null;
    return { ...row, details: row.details ? JSON.parse(row.details) : null };
  }
}

export const auditService = new AuditService();
