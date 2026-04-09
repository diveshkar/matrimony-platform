export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SAFETY: '/safety',
  FAQ: '/faq',
  CONTACT: '/contact',

  ONBOARDING: '/onboarding',

  DASHBOARD: '/dashboard',
  MY_PROFILE: '/my-profile',
  EDIT_PROFILE: '/my-profile/edit',
  EDIT_PREFERENCES: '/my-profile/preferences',
  MY_PHOTOS: '/my-profile/photos',
  PROFILE_PREVIEW: '/my-profile/preview',

  DISCOVER: '/discover',
  RECENTLY_JOINED: '/discover/new',
  SEARCH: '/search',
  PROFILE_DETAIL: '/profiles/:id',

  INTERESTS: '/interests',
  SHORTLIST: '/shortlist',
  WHO_VIEWED: '/who-viewed-me',

  CHATS: '/chats',
  CHAT_DETAIL: '/chats/:conversationId',

  PLANS: '/plans',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCEL: '/payment/cancel',

  SETTINGS: '/settings',
  PRIVACY_SETTINGS: '/settings/privacy',
  BLOCKED_USERS: '/settings/blocked',
  SHARE_STORY: '/settings/share-story',
  APPROVE_STORY: '/success-story/approve/:storyId',
  NOTIFICATIONS: '/notifications',

  NOT_FOUND: '*',
} as const;

export function profileDetailPath(id: string): string {
  return `/profiles/${id}`;
}

export function chatDetailPath(conversationId: string): string {
  return `/chats/${conversationId}`;
}
