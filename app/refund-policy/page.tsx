import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation & Refund Policy</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Cancellation Policy</h2>
                <p className="leading-relaxed text-justify">
                  As our platform, operated by Harshita Pravinbhai Soni, provides exclusively digital products, orders cannot be cancelled once the payment is successful and the digital resource is delivered to your dashboard. Cancellations are only considered in the rare event of a duplicate payment due to a technical error.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Digital Products Nature</h2>
                <p className="leading-relaxed text-justify">
                  All resources sold on our platform are digital products. Once purchased and downloaded, these products cannot be returned in the traditional sense. Please review the product description carefully before making a purchase.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Refund Eligibility</h2>
                <p className="leading-relaxed text-justify">
                  Refunds may be considered in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>The product file is corrupted or cannot be downloaded.</li>
                  <li>The product description is significantly different from what was delivered.</li>
                  <li>Technical issues prevent access to the purchased content.</li>
                  <li>A duplicate purchase was made accidentally.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Refund Request Process</h2>
                <p className="leading-relaxed text-justify">
                  To request a refund, please contact our support team within 7 days of purchase with your order details and a description of the issue. We will review your request and respond within 48 hours.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Non-Refundable Cases</h2>
                <p className="leading-relaxed text-justify">
                  Refunds will not be issued for:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Change of mind after purchase.</li>
                  <li>Incompatibility with your specific requirements.</li>
                  <li>Failure to read the product description before purchase.</li>
                  <li>Purchases made more than 7 days ago.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Refund Method & Timeline</h2>
                <p className="leading-relaxed text-justify">
                  Approved refunds will be processed immediately from our end and credited back through the original payment method used for the purchase. Please allow 5-10 business days for the refund to appear in your account, depending on your bank or payment provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Partial Refunds</h2>
                <p className="leading-relaxed text-justify">
                  In certain cases, partial refunds may be offered at our discretion. This may apply when only part of the purchased content is defective or unusable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Information</h2>
                <p className="leading-relaxed text-justify">
                  For refund and cancellation inquiries, please contact us with your order number and a detailed explanation of the issue at:
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
