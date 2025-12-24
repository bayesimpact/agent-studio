import * as process from 'node:process'

import { registerAs } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { config as dotenvConfig } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'

dotenvConfig({ path: '.env' })

let extra = {}
if (process.env.DATABASE_HOST && process.env.DATABASE_HOST.startsWith('/cloudsql')) {
  extra = {
    socketPath: process.env.DATABASE_HOST,
  }
}
export const config: () => TypeOrmModuleOptions = () => ({
  type: 'postgres',
  host: `${process.env.DATABASE_HOST}`,
  port: Number(`${process.env.DATABASE_PORT}`),
  username: `${process.env.DATABASE_USERNAME}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}${process.env.IS_TEST ? Number(process.env.JEST_WORKER_ID) : ''}`,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/**/migrations/*.js'],
  autoLoadEntities: true,
  synchronize: false,
  logging: true,
  extra,
})
export default registerAs('typeorm', () => config)
export const connectionSource = new DataSource(config() as DataSourceOptions)
