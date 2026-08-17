import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-change-in-production',
  debug: false, // Disabled for security - prevents sensitive data in logs
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === 'google') {
        await connectDB();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'user',
            purchasedResources: [],
          });
          // Store user data in the JWT token
          user.id = newUser._id.toString();
          user.role = newUser.role;
        } else {
          // Store existing user data in the JWT token
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
        }
        
        return true;
      }
      return false;
    },
    async jwt({ token, user }: any) {
      // Add user data to JWT token during sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Use data from JWT token instead of database query
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
