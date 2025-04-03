import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.server.createSIWERegistration({
    auth: ctx.authVerifier.userServiceAuthOptional,
    handler: async ({ input }) => {
      const siwe = await ctx.accountManager.siweRegistration(
        input.body.ethAddress,
      )
      return {
        encoding: 'application/json',
        body: { siweMessage: siwe },
      }
    },
  })
}
