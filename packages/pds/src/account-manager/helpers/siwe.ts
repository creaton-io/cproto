import {
  Hex,
  createPublicClient,
  http,
  isErc6492Signature,
  parseErc6492Signature,
} from 'viem'
import { base } from 'viem/chains'
import { createSiweMessage, generateSiweNonce } from 'viem/siwe'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { AccountDb } from '../db'

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

//const signature = await walletClient.signMessage({ account, message })
export const verifySIWELogin = async (
  db: AccountDb,
  did: string,
  siweSignature: Hex,
) => {
  const foundUser = await db.db
    .selectFrom('account')
    .selectAll()
    .where('did', '=', did)
    .executeTakeFirst()

  if (foundUser) {
    const address = foundUser.ethAddress as `0x${string}`

    //TODO get DID from ethAddress + handle (as an ethAddress could have multiple handles)
    //I guess the DID could be gotten from the handle alone

    const found = await db.db
      .selectFrom('siwe_login')
      .selectAll()
      .where('did', '=', did)
      .executeTakeFirst()

    if (found) {
      const { siweMessage } = found

      const verified = await publicClient.verifySiweMessage({
        address: address,
        message: siweMessage,
        signature: siweSignature,
      })

      if (verified) {
        // Delete the SIWE message
        await db.db.deleteFrom('siwe_login').where('did', '=', did).execute()

        return true
      }
    }
  }
  return false
}

export const verifySIWERegistration = async (
  db: AccountDb,
  ethAddress: string,
  siweSignature: Hex,
) => {
  const found = await db.db
    .selectFrom('siwe_registration')
    .selectAll()
    .where('ethAddress', '=', ethAddress)
    .executeTakeFirst()

  if (found) {
    const { siweMessage } = found

    const verified = await publicClient.verifySiweMessage({
      address: ethAddress as `0x${string}`,
      message: siweMessage,
      signature: siweSignature,
    })

    if (verified) {
      // Delete the SIWE message
      await db.db
        .deleteFrom('siwe_registration')
        .where('ethAddress', '=', ethAddress)
        .execute()

      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

export const siweLogin = async (
  db: AccountDb,
  did: string,
): Promise<string> => {
  const nonce = generateSiweNonce()
  const createdAt = new Date().toISOString()

  let siweMessage = ''

  const found = await db.db
    .selectFrom('account')
    .selectAll()
    .where('did', '=', did)
    .executeTakeFirst()

  if (found) {
    const address = found?.ethAddress as `0x${string}`

    siweMessage = createSiweMessage({
      address: address, // get address based on did
      chainId: 8453,
      domain: 'creaton.social', // TODO: get domain from env
      nonce: nonce,
      uri: 'https://creaton.social',
      version: '1',
      statement: 'Log in to Creaton Account',
    })

    // Check if an entry already exists for this DID
    const existing = await db.db
      .selectFrom('siwe_login')
      .where('did', '=', did)
      .selectAll()
      .executeTakeFirst()

    if (existing) {
      // Update the existing entry
      await db.db
        .updateTable('siwe_login')
        .set({ siweMessage, createdAt })
        .where('did', '=', did)
        .execute()
    } else {
      // Insert a new entry
      await db.db
        .insertInto('siwe_login')
        .values({ did, createdAt, siweMessage })
        .execute()
    }
  } else {
    throw new InvalidRequestError('could not find account')
  }
  return siweMessage
}

export const siweRegistration = async (
  db: AccountDb,
  ethAddress: string,
): Promise<string> => {
  const nonce = generateSiweNonce()
  const createdAt = new Date().toISOString()

  const siweMessage = createSiweMessage({
    address: ethAddress as `0x${string}`,
    chainId: 8453,
    domain: 'creaton.social', // TODO: get domain from env
    nonce: nonce,
    uri: 'https://creaton.social',
    version: '1',
    statement: 'Register Creaton Account',
  })

  // Check if an entry already exists for this ethAddress
  const existing = await db.db
    .selectFrom('siwe_registration')
    .where('ethAddress', '=', ethAddress)
    .selectAll()
    .executeTakeFirst()

  if (existing) {
    // Update the existing entry
    await db.db
      .updateTable('siwe_registration')
      .set({ siweMessage, createdAt })
      .where('ethAddress', '=', ethAddress)
      .execute()
  } else {
    // Insert a new entry
    await db.db
      .insertInto('siwe_registration')
      .values({ ethAddress, createdAt, siweMessage })
      .execute()
  }

  return siweMessage
}
