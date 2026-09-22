import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContactForm from '@/components/contact/ContactForm';
import JsonLd from '@/components/seo/JsonLd';
import {
  BRAND_EMAIL,
  BUSINESS_ADDRESS,
  BUSINESS_ADDRESS_TEXT,
  CONTACT_EMAIL,
  LEGAL_ENTITY,
  SITE_NAME,
  SUPPORT_EMAIL,
  siteUrl,
} from '@/lib/site';

export const metadata: Metadata = {
  title: `Contact ${SITE_NAME} — Support for Digital Study Resources`,
  description:
    'Contact Studious Harshita for order, access, payment or refund help on our digital study notes. Email support@studiousharshita.com or use the form; we reply within 24–48 business hours.',
  keywords: [
    'contact Studious Harshita',
    'study notes support India',
    'digital study resource help',
    'refund request study notes',
  ],
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: '/contact',
    title: `Contact ${SITE_NAME}`,
    description:
      'Reach the Studious Harshita support team for help with study resources, orders, payments and refunds.',
    siteName: SITE_NAME,
  },
};

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: `Contact ${SITE_NAME}`,
  url: siteUrl('/contact'),
  mainEntity: {
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: LEGAL_ENTITY,
    email: SUPPORT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_ADDRESS.street,
      addressLocality: BUSINESS_ADDRESS.city,
      addressRegion: BUSINESS_ADDRESS.region,
      postalCode: BUSINESS_ADDRESS.postalCode,
      addressCountry: BUSINESS_ADDRESS.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi', 'gu'],
    },
  },
};

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <JsonLd data={contactSchema} />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Support</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1A1A1A] mb-8 sm:text-4xl">
            Contact Studious Harshita — Study Resource Support in Ahmedabad
          </h1>
            
            <div className="space-y-6 text-[#4A443B]">
              <section>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Get in Touch</h2>
                <p className="leading-relaxed text-justify">
                  We are here to help you with any questions, concerns, or support requests regarding our educational resources and services. Please reach out to us through any of the following channels.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Contact Information</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="bg-[#FFFDF8] p-6 rounded-lg border border-[var(--line)]">
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">Support</h3>
                    <p className="text-[var(--accent)] break-all">
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">{SUPPORT_EMAIL}</a>
                    </p>
                    <p className="text-sm text-[#6B6257] mt-1">Orders, payments, refunds & technical help</p>
                  </div>
                  <div className="bg-[#FFFDF8] p-6 rounded-lg border border-[var(--line)]">
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">General queries</h3>
                    <p className="text-[var(--accent)] break-all">
                      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
                    </p>
                    <p className="text-sm text-[#6B6257] mt-1">Questions, feedback & suggestions</p>
                  </div>
                  <div className="bg-[#FFFDF8] p-6 rounded-lg border border-[var(--line)]">
                    <h3 className="font-semibold text-[#1A1A1A] mb-2">Brand deals</h3>
                    <p className="text-[var(--accent)] break-all">
                      <a href={`mailto:${BRAND_EMAIL}`} className="hover:underline">{BRAND_EMAIL}</a>
                    </p>
                    <p className="text-sm text-[#6B6257] mt-1">Collaborations & partnerships</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Business Information</h2>
                <div className="mt-4 space-y-2 text-[#4A443B]">
                  <p><strong>Legal Entity Name:</strong> {LEGAL_ENTITY}</p>
                  <p><strong>Registered Address:</strong> {BUSINESS_ADDRESS_TEXT}</p>
                  <p><strong>Business Type:</strong> Educational Digital Resources</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Response Time</h2>
                <p className="leading-relaxed text-justify">
                  We strive to respond to all inquiries within 24-48 business hours. For urgent technical issues related to accessing purchased resources, please include your order number and registered email address in your communication to help us assist you faster.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Support Topics</h2>
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
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Write to us</h2>
                <p className="leading-relaxed text-justify text-[#4A443B] mb-6">
                  Have a query about a resource, your payment, or a student project you are working on?
                  Send it through the form below and we will respond within 24-48 business hours.
                </p>
                <ContactForm />
              </section>

            <div className="mt-8 pt-6 border-t border-[var(--line)]">
              <p className="text-sm text-[#6B6257]">
                Last updated: September 2, 2026
              </p>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}