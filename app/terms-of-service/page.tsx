import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction and Agreement</h2>
                <p className="leading-relaxed text-justify">
                  Welcome to studiousharshita. These Terms of Service ("Terms") govern your access to and use of our website, digital resources, and services. This platform is officially owned and operated by Harshita Pravinbhai Soni. By registering an account, accessing the platform, or completing a purchase, you agree to be strictly bound by these Terms. If you do not agree, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Account Registration and Security</h2>
                <p className="leading-relaxed text-justify">
                  Users must log in using a valid Google Account to access and purchase resources. You are entirely responsible for maintaining the security of your authentication credentials. We hold no liability for any unauthorized access to your dashboard resulting from compromised user credentials.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Purchases, Payments, and Delivery</h2>
                <p className="leading-relaxed text-justify">
                  All prices listed on the platform are in Indian Rupees (INR) and are subject to change without prior notice. Payments are processed securely via encrypted third-party payment gateways. Upon successful realization of payment, the digital resources will be instantly delivered and accessible via your user dashboard. For details on cancellations, please refer to our Cancellation & Refund Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Intellectual Property and Usage License</h2>
                <p className="leading-relaxed text-justify">
                  All digital resources, study materials, notes, and content provided on studiousharshita are the exclusive intellectual property of the platform creators.
                </p>
                <p className="leading-relaxed mt-3 font-semibold">Permitted Use:</p>
                <p className="leading-relaxed text-justify">
                  Purchasing a resource grants you a limited, non-exclusive, non-transferable license strictly for personal, non-commercial educational use.
                </p>
                <p className="leading-relaxed mt-3 font-semibold">Prohibited Use:</p>
                <p className="leading-relaxed text-justify">
                  You are strictly prohibited from redistributing, modifying, reselling, sharing on public forums, or reproducing any purchased materials. Violation of this clause will result in immediate account termination and potential legal action.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Conduct</h2>
                <p className="leading-relaxed text-justify">
                  Users agree not to engage in any activity that disrupts the service or violates applicable Indian laws. This includes attempting to compromise the security of the platform, bypassing payment gateways, or scraping digital content.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
                <p className="leading-relaxed text-justify">
                  The study materials provided are designed for educational assistance and reference. We do not guarantee specific academic results, grades, or examination clearances. Harshita Pravinbhai Soni shall not be held liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our digital resources. Our maximum liability is strictly limited to the amount paid for the specific resource.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Governing Law and Jurisdiction</h2>
                <p className="leading-relaxed text-justify">
                  These Terms of Service and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of India. Any disputes or claims arising in relation to these Terms shall be subject to the exclusive jurisdiction of the courts located in Ahmedabad, Gujarat, India.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
                <p className="leading-relaxed text-justify">
                  If you require any clarification regarding these Terms of Service, or have any grievances, please contact us at:
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
