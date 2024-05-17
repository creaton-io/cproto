import axios, { AxiosError } from 'axios'
import BaseResolver from './base-resolver'
import { DidCache } from '../types'

export class DidCreatonResolver extends BaseResolver {
  constructor(
    public timeout: number,
    public cache?: DidCache,
  ) {
    super(cache)
  }

  async resolveNoCheck(did: string): Promise<unknown> {
    const url = `https://resolver.cheqd.io/1.0/identifiers/${did}`
    try {
      const res = await axios.get(url, { timeout: this.timeout })
      return res.data
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        return null
      }
      throw err
    }
  }
}
