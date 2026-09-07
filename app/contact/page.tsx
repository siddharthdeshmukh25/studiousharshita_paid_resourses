import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContactForm from '@/components/contact/ContactForm';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Get in Touch</h2>
                <p className="leading-relaxed text-justify">
                  We are here to help you with any questions, concerns, or support requests regarding our educational resources and services. Please reach out to us through any of the following channels.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
                <div className="mt-4 space-y-4">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Official Email</h3>
                    <p className="text-lg text-[var(--accent)]">support@studiousharshita.com</p>
                    <p className="text-sm text-gray-500 mt-1">For general inquiries, support, and technical assistance</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Phone Number</h3>
                    <p className="text-lg text-[var(--accent)]">+91 95122 15337</p>
                    <p className="text-sm text-gray-500 mt-1">Available for urgent matters during business hours (9 AM - 6 PM IST)</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Business Information</h2>
                <div className="mt-4 space-y-2 text-gray-700">
                  <p><strong>Legal Entity Name:</strong> Harshita Pravinbhai Soni</p>
                  <p><strong>Registered Address:</strong> Vyasvadi, Vadaj, Ahmedabad, Gujarat, India - 380013</p>
                  <p><strong>Business Type:</strong> Educational Digital Resources</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Response Time</h2>
                <p className="leading-relaxed text-justify">
                  We strive to respond to all inquiries within 24-48 business hours. For urgent technical issues related to accessing purchased resources, please include your order number and registered email address in your communication to help us assist you faster.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Support Topics</h2>
                <p className="leading-relaxed text-justify">
                  We can assist you with:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Questions about our study resources and course materials</li>
                  <li>Technical issues with accessing purchased content</li>
                  <li>Account and login assistance</li>
                  <li>Payment and billing inquiries</li>
                  <li>Refund and cancellation requests (as per our Refund Policy)</li>
                  <li>Feedback and suggestions for improving our platform</li>
                </ul>
              </section>
            </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Write to us</h2>
                <p className="leading-relaxed text-justify text-gray-700 mb-6">
                  Have a query about a resource, your payment, or a student project you are working on?
                  Send it through the form below and we will respond within 24-48 business hours.
                </p>
                <ContactForm />
              </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: September 2, 2026
              </p>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}