import { Selectable } from 'kysely'

export interface SIWERegistration {
  ethAddress: string
  createdAt: string
  siweMessage: string
}

export type SiweEntry = Selectable<SIWERegistration>

export const tableName = 'siwe_registration'

export type PartialDB = { [tableName]: SIWERegistration }
