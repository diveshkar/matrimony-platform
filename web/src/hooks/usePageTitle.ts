import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Matrimony - Premium Tamil Matrimony | Where Tamil Hearts Find Home',
  '/about': 'About Us | Matrimony',
  '/safety': 'Safety Tips | Matrimony',
  '/faq': 'FAQ | Matrimony',
  '/contact': 'Contact Us | Matrimony',
  '/terms': 'Terms of Service | Matrimony',
  '/privacy': 'Privacy Policy | Matrimony',
  '/plans': 'Subscription Plans | Matrimony',
  '/login': 'Login | Matrimony',
  '/verify-otp': 'Verify OTP | Matrimony',
  '/onboarding': 'Create Your Profile | Matrimony',
  '/dashboard': 'Dashboard | Matrimony',
  '/my-profile': 'My Profile | Matrimony',
  '/my-profile/edit': 'Edit Profile | Matrimony',
  '/my-profile/photos': 'My Photos | Matrimony',
  '/discover': 'Discover Matches | Matrimony',
  '/search': 'Search Profiles | Matrimony',
  '/interests': 'Interests | Matrimony',
  '/shortlist': 'Shortlist | Matrimony',
  '/chats': 'Messages | Matrimony',
  '/settings': 'Settings | Matrimony',
  '/settings/privacy': 'Privacy Settings | Matrimony',
  '/settings/blocked': 'Blocked Users | Matrimony',
  '/who-viewed-me': 'Who Viewed Me | Matrimony',
  '/notifications': 'Notifications | Matrimony',
  '/payment/success': 'Payment Successful | Matrimony',
  '/payment/cancel': 'Payment Cancelled | Matrimony',
};

const defaultTitle = 'Matrimony - Premium Tamil Matrimony';

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = pageTitles[path] || defaultTitle;
    document.title = title;
  }, [location.pathname]);
}
