import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ROUTES } from '@/lib/constants/routes';

// Phase 1A — Landing + Static pages
const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const NotFoundPage = lazy(() => import('@/features/home/pages/NotFoundPage'));
const AboutPage = lazy(() => import('@/features/static/pages/AboutPage'));
const TermsPage = lazy(() => import('@/features/static/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/features/static/pages/PrivacyPage'));
const SafetyPage = lazy(() => import('@/features/static/pages/SafetyPage'));
const FAQPage = lazy(() => import('@/features/static/pages/FAQPage'));
const ContactPage = lazy(() => import('@/features/static/pages/ContactPage'));

// Phase 1B — Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const VerifyOtpPage = lazy(() => import('@/features/auth/pages/VerifyOtpPage'));

// Phase 1C — Profile pages
const OnboardingPage = lazy(() => import('@/features/profile/pages/OnboardingPage'));
const MyProfilePage = lazy(() => import('@/features/profile/pages/MyProfilePage'));
const DashboardPage = lazy(() => import('@/features/home/pages/DashboardPage'));

// Phase 1D — Photos
const PhotosPage = lazy(() => import('@/features/profile/pages/PhotosPage'));

// Phase 1E — Discovery
const DiscoverPage = lazy(() => import('@/features/discovery/pages/DiscoverPage'));
const SearchPage = lazy(() => import('@/features/discovery/pages/SearchPage'));
const ProfileDetailPage = lazy(() => import('@/features/discovery/pages/ProfileDetailPage'));

// Phase 1F — Interests & Shortlist
const InterestsPage = lazy(() => import('@/features/interests/pages/InterestsPage'));
const ShortlistPage = lazy(() => import('@/features/interests/pages/ShortlistPage'));

// Placeholder for future phase pages
const PlaceholderPage = lazy(() => import('@/features/home/pages/PlaceholderPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen message="Loading..." />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <SuspenseWrapper>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.TERMS} element={<TermsPage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
          <Route path={ROUTES.SAFETY} element={<SafetyPage />} />
          <Route path={ROUTES.FAQ} element={<FAQPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />

          {/* Auth pages */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtpPage />} />
          <Route path={ROUTES.PLANS} element={<PlaceholderPage />} />
        </Route>

        {/* Onboarding — auth required but no profile required */}
        <Route
          element={
            <ProtectedRoute requireOnboarding={false}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
        </Route>

        {/* Protected routes — require auth + completed onboarding */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.MY_PROFILE} element={<MyProfilePage />} />
          <Route path={ROUTES.MY_PHOTOS} element={<PhotosPage />} />
          <Route path={ROUTES.DISCOVER} element={<DiscoverPage />} />
          <Route path={ROUTES.SEARCH} element={<SearchPage />} />
          <Route path={ROUTES.PROFILE_DETAIL} element={<ProfileDetailPage />} />
          <Route path={ROUTES.INTERESTS} element={<InterestsPage />} />
          <Route path={ROUTES.SHORTLIST} element={<ShortlistPage />} />
          <Route path={ROUTES.WHO_VIEWED} element={<PlaceholderPage />} />
          <Route path={ROUTES.CHATS} element={<PlaceholderPage />} />
          <Route path={ROUTES.CHAT_DETAIL} element={<PlaceholderPage />} />
          <Route path={ROUTES.SETTINGS} element={<PlaceholderPage />} />
          <Route path={ROUTES.PRIVACY_SETTINGS} element={<PlaceholderPage />} />
          <Route path={ROUTES.BLOCKED_USERS} element={<PlaceholderPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<PlaceholderPage />} />
          <Route path={ROUTES.PAYMENT_SUCCESS} element={<PlaceholderPage />} />
          <Route path={ROUTES.PAYMENT_CANCEL} element={<PlaceholderPage />} />
        </Route>

        {/* 404 */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </SuspenseWrapper>
  );
}
