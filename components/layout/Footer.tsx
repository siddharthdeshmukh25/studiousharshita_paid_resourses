export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-6 w-full overflow-hidden">
          {/* Brand Section */}
          <div className="min-w-0 border-b-2 border-gray-600 pb-6 sm:pb-0 sm:border-b-0 sm:border-r-2 sm:border-gray-600 sm:pr-6">
            <h3 className="text-base md:text-xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent break-words">
              studiousharshita
            </h3>
            <p className="text-gray-400 text-[10px] md:text-sm leading-relaxed break-words">
              Your premium resource marketplace for quality educational materials and digital products.
            </p>
          </div>

          {/* Contact Section */}
          <div className="min-w-0">
            <h4 className="text-sm md:text-lg font-semibold mb-3 md:mb-4">Get in Touch</h4>
            <ul className="space-y-1 md:space-y-2">
              <li className="text-gray-400 text-[10px] md:text-sm break-words">
                <span className="block">Email:</span>
                <a href="mailto:studiousharshita@gmail.com" className="hover:text-white transition-colors break-all">
                  studiousharshita@gmail.com
                </a>
              </li>
              <li className="text-gray-400 text-[10px] md:text-sm">
                <span className="block">Location:</span>
                <span>Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-[10px] md:text-sm text-center md:text-left">
              © {new Date().getFullYear()} studiousharshita. All rights reserved.
            </p>
            <div className="flex space-x-2 md:space-x-4 mt-2 md:mt-0">
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors text-[10px] md:text-sm"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors text-[10px] md:text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="/refund"
                className="text-gray-400 hover:text-white transition-colors text-[10px] md:text-sm"
              >
                Refund Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
