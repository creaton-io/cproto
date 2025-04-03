import { Selectable } from 'kysely'

export interface SIWELogin {
  did: string
  createdAt: string
  siweMessage: string
}

export type SiweEntry = Selectable<SIWELogin>

export const tableName = 'siwe_login'

export type PartialDB = { [tableName]: SIWELogin }
