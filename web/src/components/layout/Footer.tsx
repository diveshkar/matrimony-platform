import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/lib/constants/routes';
import { CONFIG } from '@/lib/constants/config';

const footerLinks = {
  company: [
    { label: 'About Us', href: ROUTES.ABOUT },
    { label: 'Contact', href: ROUTES.CONTACT },
    { label: 'FAQ', href: ROUTES.FAQ },
  ],
  legal: [
    { label: 'Terms of Service', href: ROUTES.TERMS },
    { label: 'Privacy Policy', href: ROUTES.PRIVACY },
    { label: 'Safety Tips', href: ROUTES.SAFETY },
  ],
  product: [
    { label: 'Plans & Pricing', href: ROUTES.PLANS },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Success Stories', href: '/#success-stories' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-900 text-white/80">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="md" showText className="[&_span]:text-white" />
            <p className="text-sm leading-relaxed text-white/60 max-w-xs">
              {CONFIG.APP_TAGLINE}. Connecting Tamil hearts across the world with trust and tradition.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-white/40">
            &copy; {currentYear} {CONFIG.APP_NAME}. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-white/40">
            Made with <Heart className="h-3 w-3 fill-primary-400 text-primary-400" /> in the UK
          </p>
        </div>
      </div>
    </footer>
  );
}
