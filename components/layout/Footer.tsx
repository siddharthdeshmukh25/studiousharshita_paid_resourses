import { BookOpen, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-4 md:py-12">
        <div className="grid gap-6 sm:gap-10 sm:grid-cols-[1.35fr_1fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="grid h-9 w-9 place-items-center bg-[#E0F2FE] text-[#2563EB] rounded-lg">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-normal">studiousharshita</span>
            </div>
            <p className="text-sm leading-6 text-[#CBD5E1]">
              Thoughtfully selected study resources for focused learning and confident progress.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2.5 text-sm text-[#CBD5E1]">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-[#67E8F9]" />
                <a href="mailto:connect@studiousharshita.com" className="hover:text-white transition-colors break-all">connect@studiousharshita.com</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#67E8F9]" />
                <span>Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#334155] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#CBD5E1]">&copy; {new Date().getFullYear()} studiousharshita. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#CBD5E1] sm:justify-end">
            <a href="/about" className="hover:text-white transition-colors">About Us</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact Us</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#334155] text-center">
          <p className="text-xs text-[#94A3B8]">
            Build by <a href="https://www.linkedin.com/in/siddharth-deshmukh2028/" target="_blank" rel="noopener noreferrer" className="text-[#67E8F9] hover:text-white transition-colors">Siddharth Deshmukh</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
