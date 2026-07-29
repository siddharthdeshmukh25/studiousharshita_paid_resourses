import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                <p className="leading-relaxed">
                  We collect information you provide directly, including your name, email address, 
                  and payment information when you create an account or make a purchase. We also 
                  collect usage data to improve our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p className="leading-relaxed">
                  Your information is used to process transactions, send you important updates, 
                  provide customer support, and improve our platform. We do not sell your personal 
                  data to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Security</h2>
                <p className="leading-relaxed">
                  We implement industry-standard security measures to protect your data. This includes 
                  encryption, secure payment processing, and regular security audits. Your payment 
                  information is processed through secure third-party providers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Google Authentication</h2>
                <p className="leading-relaxed">
                  We use Google OAuth for authentication. When you sign in with Google, we only 
                  receive your basic profile information (name and email). We do not access your 
                  Google account data beyond what is necessary for authentication.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies</h2>
                <p className="leading-relaxed">
                  We use cookies to enhance your experience, maintain your session, and analyze usage 
                  patterns. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Third-Party Services</h2>
                <p className="leading-relaxed">
                  We use third-party services for payment processing (Cashfree), authentication (Google), 
                  and analytics. These services have their own privacy policies which we encourage you 
                  to review.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                <p className="leading-relaxed">
                  You have the right to access, correct, or delete your personal data. You can request 
                  account deletion or data export by contacting our support team.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Retention</h2>
                <p className="leading-relaxed">
                  We retain your data only as long as necessary to provide our services and as required 
                  by law. You can request deletion of your account and associated data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to Privacy Policy</h2>
                <p className="leading-relaxed">
                  We may update this privacy policy from time to time. We will notify users of 
                  significant changes via email or through our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have questions about this privacy policy or your personal data, please 
                  contact our support team.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
