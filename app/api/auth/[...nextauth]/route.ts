import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { getClientIP, getCountryFromIP } from '@/lib/geoLocation';

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
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Changed to false for development to work with HTTP
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile, req }: any) {
      if (account.provider === 'google') {
        await connectDB();
        
        console.log('Google sign-in attempt for email:', user.email);
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          console.log('Creating new user for email:', user.email);
          // Create new user
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'user',
            purchasedResources: [],
            googleDriveConnected: false,
          });
          console.log('New user created successfully:', newUser.email);
          // Store user data in the JWT token
          user.id = newUser._id.toString();
          user.role = newUser.role;
        } else {
          console.log('Existing user found:', existingUser.email);
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
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Use data from JWT token instead of database query
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
