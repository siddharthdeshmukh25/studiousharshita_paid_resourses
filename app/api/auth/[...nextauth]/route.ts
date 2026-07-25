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
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === 'google') {
        await connectDB();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'user',
            purchasedResources: [],
          });
        }
        
        return true;
      }
      return false;
    },
    async session({ session, user }: any) {
      await connectDB();
      
      // Add user ID and role to session
      const dbUser = await User.findOne({ email: session.user.email });
      
      if (dbUser) {
        session.user.id = dbUser._id.toString();
        session.user.role = dbUser.role;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
