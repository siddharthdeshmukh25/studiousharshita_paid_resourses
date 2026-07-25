export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              studiousharshita
            </h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              Your premium resource marketplace for quality educational materials and digital products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Quick Links</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Resources
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/refund"
                  className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Contact</h4>
            <ul className="space-y-1 md:space-y-2">
              <li className="text-gray-400 text-xs md:text-sm">
                <span className="block">Email:</span>
                <a href="mailto:support@studiousharshita.com" className="hover:text-white transition-colors">
                  support@studiousharshita.com
                </a>
              </li>
              <li className="text-gray-400 text-xs md:text-sm">
                <span className="block">Location:</span>
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs md:text-sm text-center md:text-left">
              © {new Date().getFullYear()} studiousharshita. All rights reserved.
            </p>
            <div className="flex space-x-3 md:space-x-4 mt-3 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
              >
                LinkedIn
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
