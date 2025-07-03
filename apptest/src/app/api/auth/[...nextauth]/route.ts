import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || "backendgateway",
      clientSecret: process.env.KEYCLOAK_SECRET || "jnhpOE1sJfJmdRaRDyzsWPCFBoGC1gey",
      issuer: process.env.KEYCLOAK_ISSUER || "http://82.29.168.17:8080/realms/osRoom",
      authorization: { params: { scope: "openid email profile" } },
      token: {
        params: {
          grant_type: "password",
        },
      },
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and userinfo to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.profile = profile
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken
      session.idToken = token.idToken
      session.refreshToken = token.refreshToken
      session.userProfile = token.profile
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly
      if (url.startsWith(baseUrl)) return url
      // Handle relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow redirects to external URLs if they are allowed
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST } 