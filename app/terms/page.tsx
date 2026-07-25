import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By accessing and using our platform, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
                <p className="leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials. 
                  You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Purchases and Payments</h2>
                <p className="leading-relaxed">
                  All purchases are processed through secure payment providers. Refunds are handled 
                  according to our refund policy. Prices are subject to change without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Content and Resources</h2>
                <p className="leading-relaxed">
                  All resources provided on our platform are protected by copyright. You may not 
                  redistribute, resell, or share purchased resources without explicit permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Conduct</h2>
                <p className="leading-relaxed">
                  Users agree not to engage in any activity that disrupts the service or violates 
                  applicable laws. This includes posting inappropriate content or attempting to 
                  compromise the security of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
                <p className="leading-relaxed">
                  We are not liable for any indirect, incidental, or consequential damages arising 
                  from the use of our service. Our liability is limited to the amount paid for the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to Terms</h2>
                <p className="leading-relaxed">
                  We reserve the right to modify these terms at any time. Continued use of the service 
                  constitutes acceptance of any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
                <p className="leading-relaxed">
                  For any questions regarding these Terms of Service, please contact us through our 
                  support channels.
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
