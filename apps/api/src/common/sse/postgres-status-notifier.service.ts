import type { DataSource } from "typeorm"

export abstract class PostgresStatusNotifierService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly channel: string,
  ) {}

  protected async notify(payload: Record<string, unknown>): Promise<void> {
    const serialized = JSON.stringify(payload)
    await this.dataSource.query(`SELECT pg_notify($1, $2)`, [this.channel, serialized])
  }
}
