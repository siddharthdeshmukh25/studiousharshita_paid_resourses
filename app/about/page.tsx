import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">About Us</h1>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <p className="leading-relaxed text-justify">
                  Welcome to studiousharshita! We are passionate about making education accessible, engaging, and highly effective for students everywhere.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Story</h2>
                <p className="leading-relaxed text-justify">
                  Founded and operated by Harshita Pravinbhai Soni, based in Ahmedabad, Gujarat, this platform was born out of a simple yet powerful vision: to bridge the gap between complex academic concepts and easy-to-grasp study materials. We understand the challenges students face when preparing for exams, which is why we decided to create a dedicated space for high-quality digital resources.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Who We Serve</h2>
                <p className="leading-relaxed text-justify">
                  Our study materials are designed for students across different academic levels:
                </p>
                <div className="mt-3 space-y-2">
                  <p><strong>School Students:</strong> Classes 5th to 12th</p>
                  <p><strong>College Students:</strong> Undergraduate and postgraduate programs</p>
                  <p><strong>Competitive Exam Aspirants:</strong> Students preparing for various competitive examinations</p>
                  <p><strong>Scholarship Students:</strong> Learners seeking scholarship opportunities</p>
                </div>
                <p className="leading-relaxed mt-3 text-justify">
                  All our educational content is available in English to ensure clarity and accessibility for a wide range of students.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h2>
                <p className="leading-relaxed text-justify">
                  Our mission is to provide top-notch, meticulously crafted digital notes and educational resources that empower students to excel in their academic journeys. We believe that with the right guidance and structured materials, every student can achieve their true potential without the overwhelming stress of disorganized study routines.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Offer</h2>
                <p className="leading-relaxed text-justify">
                  At studiousharshita, we specialize in premium digital study notes and comprehensive resource guides. Every piece of content on our platform is designed specifically with the student's perspective in mind—focusing on clarity, accuracy, and ease of understanding. Because our resources are 100% digital, you get instant access to your study materials the moment you complete your purchase.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Connect With Us</h2>
                <p className="leading-relaxed text-justify">
                  We are constantly working to expand our library and improve our platform. Follow us on social media for updates, study tips, and educational content:
                </p>
                <div className="mt-4 space-y-2">
                  <p><strong>Instagram:</strong> <a href="https://www.instagram.com/studious_harshita" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@studious_harshita</a></p>
                  <p><strong>YouTube:</strong> <a href="https://youtube.com/@studious_harshita" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@studious_harshita</a></p>
                </div>
                <p className="leading-relaxed mt-4 text-justify">
                  For support, reach out to us at support@studiousharshita.com
                </p>
                <p className="leading-relaxed mt-4 text-justify">
                  Join our growing community of learners and take the next step toward academic excellence today!
                </p>
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
