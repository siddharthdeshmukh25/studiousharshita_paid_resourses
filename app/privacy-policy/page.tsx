import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                <p className="leading-relaxed text-justify">
                  studiousharshita, operated by HARSHITA SONI, is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy outlines how we collect, use, process, and protect your information when you visit our website and purchase our digital resources.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                <p className="leading-relaxed text-justify">
                  We collect information you provide directly to us to ensure a seamless experience:
                </p>
                <div className="mt-3 space-y-2">
                  <p><strong>Personal Data:</strong> Name and email address (collected when you create an account or sign in).</p>
                  <p><strong>Contact Data:</strong> Phone number and billing details (required for payment processing and invoice generation).</p>
                  <p><strong>Usage Data:</strong> Information about how you navigate and use our platform to help us improve our services.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <p className="leading-relaxed text-justify">
                  Your information is strictly used for the following purposes:
                </p>
                <div className="mt-3 space-y-2">
                  <p>To process transactions and securely deliver digital content to your account.</p>
                  <p>To send important updates, purchase receipts, and account-related notifications.</p>
                  <p>To provide customer support and resolve any queries or disputes.</p>
                  <p>To comply with legal and regulatory obligations in India.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Services & Payment Gateways</h2>
                <p className="leading-relaxed text-justify">
                  We do not sell your personal data. However, we use trusted third-party services to operate our platform securely:
                </p>
                <div className="mt-3 space-y-2">
                  <p><strong>Payment Processing:</strong> We use encrypted third-party payment gateways (like Razorpay or Cashfree). When making a purchase, your contact details are shared securely with these gateways to process the transaction. We do not store your credit/debit card numbers, UPI pins, or bank passwords on our servers.</p>
                  <p><strong>Authentication:</strong> We use Google OAuth for secure sign-ins. We only access your basic profile information (name and email) necessary for account creation.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
                <p className="leading-relaxed text-justify">
                  We implement industry-standard security measures, including SSL encryption and secure server hosting, to protect your personal information from unauthorized access, alteration, or disclosure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
                <p className="leading-relaxed text-justify">
                  We use cookies to maintain your session, remember your preferences, and analyze website traffic. You can manage or disable cookies through your browser settings, though this may affect certain functionalities of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights and Data Retention</h2>
                <p className="leading-relaxed text-justify">
                  You have the right to access, correct, or request the deletion of your personal data. We retain your data only for as long as necessary to provide our services and fulfill the purposes outlined in this policy, or as required by Indian law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
                <p className="leading-relaxed text-justify">
                  If you have any questions or concerns regarding this Privacy Policy or how your data is handled, please contact our Grievance Officer at:
                </p>
                <div className="mt-4 space-y-2 text-gray-700">
                  <p><strong>Legal Entity Name:</strong> Harshita Pravinbhai Soni</p>
                  <p><strong>Email:</strong> support@studiousharshita.com</p>
                  <p><strong>Phone:</strong> +91 95122 15337</p>
                  <p><strong>Registered Address:</strong> Vyasvadi, Vadaj, Ahmedabad, Gujarat, India - 380013</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: August 2, 2026
              </p>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}