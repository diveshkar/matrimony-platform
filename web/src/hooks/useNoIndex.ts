import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Pages that should NOT be indexed by search engines
const noIndexPaths = [
  '/login',
  '/verify-otp',
  '/onboarding',
  '/dashboard',
  '/my-profile',
  '/discover',
  '/search',
  '/interests',
  '/shortlist',
  '/chats',
  '/settings',
  '/notifications',
  '/who-viewed-me',
  '/payment',
];

export function useNoIndex() {
  const location = useLocation();

  useEffect(() => {
    const shouldNoIndex = noIndexPaths.some((p) => location.pathname.startsWith(p));

    let metaTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;

    if (shouldNoIndex) {
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'robots';
        document.head.appendChild(metaTag);
      }
      metaTag.content = 'noindex, nofollow';
    } else {
      if (metaTag) {
        metaTag.content = 'index, follow';
      }
    }
  }, [location.pathname]);
}
