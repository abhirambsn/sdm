export class AuditService {
  async record(action: string, actor: string, details: Record<string, any>) {
    // TODO: persist to DB (Postgres/Mongo)
    console.log(`[AUDIT] ${new Date().toISOString()} actor=${actor} action=${action} details=${JSON.stringify(details)}`);
  }
}

export const auditService = new AuditService();