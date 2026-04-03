export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SAFETY: '/safety',
  FAQ: '/faq',
  CONTACT: '/contact',

  // Onboarding
  ONBOARDING: '/onboarding',

  // Authenticated
  DASHBOARD: '/dashboard',
  MY_PROFILE: '/my-profile',
  PROFILE_PREVIEW: '/my-profile/preview',

  // Discovery
  DISCOVER: '/discover',
  SEARCH: '/search',
  PROFILE_DETAIL: '/profiles/:id',

  // Interactions
  INTERESTS: '/interests',
  SHORTLIST: '/shortlist',
  WHO_VIEWED: '/who-viewed-me',

  // Chat
  CHATS: '/chats',
  CHAT_DETAIL: '/chats/:conversationId',

  // Subscription
  PLANS: '/plans',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCEL: '/payment/cancel',

  // Settings
  SETTINGS: '/settings',
  PRIVACY_SETTINGS: '/settings/privacy',
  BLOCKED_USERS: '/settings/blocked',
  NOTIFICATIONS: '/notifications',

  // Error
  NOT_FOUND: '*',
} as const;

export function profileDetailPath(id: string): string {
  return `/profiles/${id}`;
}

export function chatDetailPath(conversationId: string): string {
  return `/chats/${conversationId}`;
}
