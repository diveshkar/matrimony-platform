import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BRAND = 'The World Tamil Matrimony';

const pageTitles: Record<string, string> = {
  '/': `${BRAND} - Premium Tamil Matrimony Worldwide`,
  '/about': `About Us | ${BRAND}`,
  '/safety': `Safety Tips | ${BRAND}`,
  '/faq': `FAQ | ${BRAND}`,
  '/contact': `Contact Us | ${BRAND}`,
  '/terms': `Terms of Service | ${BRAND}`,
  '/privacy': `Privacy Policy | ${BRAND}`,
  '/plans': `Subscription Plans | ${BRAND}`,
  '/login': `Login | ${BRAND}`,
  '/verify-otp': `Verify OTP | ${BRAND}`,
  '/onboarding': `Create Your Profile | ${BRAND}`,
  '/dashboard': `Dashboard | ${BRAND}`,
  '/my-profile': `My Profile | ${BRAND}`,
  '/my-profile/edit': `Edit Profile | ${BRAND}`,
  '/my-profile/photos': `My Photos | ${BRAND}`,
  '/discover': `Discover Matches | ${BRAND}`,
  '/search': `Search Profiles | ${BRAND}`,
  '/interests': `Interests | ${BRAND}`,
  '/shortlist': `Shortlist | ${BRAND}`,
  '/chats': `Messages | ${BRAND}`,
  '/settings': `Settings | ${BRAND}`,
  '/settings/privacy': `Privacy Settings | ${BRAND}`,
  '/settings/blocked': `Blocked Users | ${BRAND}`,
  '/who-viewed-me': `Who Viewed Me | ${BRAND}`,
  '/notifications': `Notifications | ${BRAND}`,
  '/payment/success': `Payment Successful | ${BRAND}`,
  '/payment/cancel': `Payment Cancelled | ${BRAND}`,
};

const defaultTitle = `${BRAND} - Premium Tamil Matrimony`;

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const title = pageTitles[path] || defaultTitle;
    document.title = title;
  }, [location.pathname]);
}
