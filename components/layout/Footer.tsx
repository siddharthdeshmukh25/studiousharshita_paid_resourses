import { BookOpen, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid gap-10 sm:grid-cols-[1.35fr_1fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 mb-4">
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
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-[#CBD5E1]">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-[#67E8F9]" />
                <a href="mailto:studiousharshita@gmail.com" className="hover:text-white transition-colors break-all">studiousharshita@gmail.com</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#67E8F9]" />
                <span>Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-[#334155] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#CBD5E1]">&copy; {new Date().getFullYear()} studiousharshita. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#CBD5E1]">
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/refund" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
