# Discovery Matching Algorithm — Technical Documentation

## Overview

When a user opens the Discover page, the matching algorithm runs to find and rank the best profiles for them. The entire process happens in a single API call — the frontend sends one request to `GET /discover`, and the backend Lambda does everything: fetches profiles, removes duplicates, filters out irrelevant ones, scores the remaining profiles, and returns them sorted by best match. The algorithm has five stages: Fetch, Deduplicate, Filter, Score, and Sort.

---

## Stage 1: FETCH — Gathering Candidate Profiles

The first thing the algorithm does is figure out what gender to look for. If the user is male, it searches for female profiles. If female, it searches for male profiles.

Then it fetches profiles from three sources, one after another, stopping when it has enough results.

**Source 1: Preferred Countries.** The system looks at the user's partner preferences. If they set preferred countries like United Kingdom, Canada, and Sri Lanka, it runs one DynamoDB query for each country. For example, it queries for all female profiles in the United Kingdom, then all female profiles in Canada, then all female profiles in Sri Lanka. Each query hits a Global Secondary Index called GSI1, which is indexed by country and gender. If the user set 3 countries, that's 3 DynamoDB queries.

**Source 2: Preferred Religions.** If there still aren't enough profiles, the system does the same for preferred religions. If the user prefers Hindu, Christian, and Muslim, it queries for all female Hindu profiles, then all female Christian profiles, then all female Muslim profiles. These queries hit GSI2, indexed by religion and gender. If the user set 3 religions, that's another 3 DynamoDB queries.

**Source 3: Fallback — Everyone.** If there still aren't enough results after country and religion queries, the system falls back to a general index called DISCOVERY#ALL, which contains every profile on the platform sorted by recent activity. This is one DynamoDB query.

Before any of this happens, the system also needs to know who the user is and what their preferences are, so it makes two more DynamoDB reads: one to get the user's profile (to know their gender, country, and religion), and one to get their partner preferences (age range, religions, castes, countries, education levels). It also queries the user's blocked list to know which profiles to exclude later.

**Total DynamoDB operations for Stage 1:** 3 reads (user profile, preferences, blocked list) plus 1 to 7 queries depending on how many countries and religions are in the preferences, plus the fallback. A typical user with 3 countries and 3 religions generates about 10 DynamoDB operations in this stage.

---

## Stage 2: DEDUPLICATE — Removing Repeated Profiles

The same profile can appear in multiple query results. For example, a Hindu woman living in the United Kingdom would appear in both the country query for UK and the religion query for Hindu. If the user has both UK and Hindu in their preferences, her profile is fetched twice.

The algorithm goes through all fetched profiles and keeps only the first occurrence of each userId. The second, third, or fourth copy is discarded. This happens in memory with no database calls.

**DynamoDB operations for Stage 2:** Zero. This is pure in-memory processing.

---

## Stage 3: FILTER — Removing Profiles That Don't Match

This is where profiles are permanently removed from the results. If a profile fails any of these checks, the user will never see it.

**Self removal.** The user's own profile is removed so they don't see themselves in discovery.

**Blocked users.** The system checks the user's blocked list that was fetched in Stage 1. Any profile where either user has blocked the other is removed. Blocking is bidirectional — if User A blocked User B, then B disappears from A's results and A disappears from B's results.

**Gender filter.** Only opposite-gender profiles are kept. Male users see only female profiles and vice versa.

**Age range.** If the user set an age preference like 24 to 30, any profile with an age outside this range is removed. A 22-year-old or a 35-year-old would be filtered out.

**Religion filter.** If the user set preferred religions like Hindu and Christian, any profile with a different religion like Muslim is removed. If the user didn't set any religion preference, this filter is skipped.

**Caste filter.** If the user set preferred castes like Vellalar and Pillai, any profile with a different caste like Nadar is removed. If the profile has no caste set, it passes through. If the user didn't set any caste preference, this filter is skipped entirely.

After all filters, the result could be zero profiles if the preferences are too narrow. In that case, the user sees an empty state with a suggestion to broaden their preferences.

**DynamoDB operations for Stage 3:** Zero. All filtering uses data already fetched in Stage 1.

---

## Stage 4: SCORE — Ranking Profiles by Match Quality

This is the heart of the algorithm. Every profile that survived the filters receives a numerical score. The score determines which profiles appear first. Higher score means better match, shown at the top.

The system checks two things for each profile that require DynamoDB reads: whether the profile has an active boost, and whether the profile owner is a Platinum subscriber. These are two DynamoDB GET operations per profile. If there are 20 profiles remaining after filtering, that's 40 DynamoDB operations.

**Active Boost: +100 points.** If the profile owner activated a boost (Gold gets 1 per month, Platinum gets 3 per month), the system reads the BOOST#ACTIVE record from DynamoDB. If it exists and hasn't expired (24-hour duration), the profile gets 100 bonus points. This is the single largest score bonus and guarantees the profile appears at or near the top of results.

**Platinum Priority: +50 points.** If the profile owner has an active Platinum subscription, the system reads the SUBSCRIPTION#ACTIVE record from DynamoDB. Platinum subscribers get a permanent 50-point bonus that's always active regardless of whether they used a boost. This means Platinum users naturally appear higher than Free, Silver, or Gold users even without doing anything extra.

**Religion matches preference: +30 points.** If the profile's religion is in the viewer's preferred religions list, it gets 30 points. For example, if the viewer prefers Hindu and Christian, and the profile is Hindu, it gets +30. This doesn't require any database read because the viewer's preferences were already fetched in Stage 1.

**Same religion (no preference set): +20 points.** If the viewer didn't set any religion preference, but the profile has the same religion as the viewer, it gets 20 points. This is a fallback — if you didn't tell us what you want, we assume you'd prefer someone from your own religion.

**Caste matches preference: +20 points.** If the profile's caste is in the viewer's preferred castes list, it gets 20 points. Same logic as religion matching.

**Same country: +15 points.** If the profile is from the same country as the viewer, it gets 15 points. Note this is not about the viewer's preferred countries — it's specifically about whether they live in the same country. A viewer in the UK looking at a profile also in the UK gets +15. A viewer in the UK looking at a profile in Canada gets +0, even if Canada is in their preferred countries.

**Education matches preference: +10 points.** If the profile's education level is in the viewer's preferred education list, it gets 10 points.

**Has profile photo: +10 points.** If the profile has at least one uploaded photo, it gets 10 points. Profiles without photos rank lower.

**Profile completion: +1 to +9 points.** The score is calculated as the profile completion percentage divided by 10, rounded down. A profile that is 85% complete gets +8. A profile that is 100% complete gets +10. A profile that is only 40% complete gets +4. This encourages users to fill out their entire profile.

**Maximum possible score.** A Platinum user with an active boost who perfectly matches the viewer's religion, caste, country, and education preferences, has a photo, and a complete profile would score: 100 (boost) + 50 (platinum) + 30 (religion) + 20 (caste) + 15 (country) + 10 (education) + 10 (photo) + 9 (completion) = 244 points.

**Typical good match.** A Free user who matches religion, is in the same country, has a photo, and a good profile scores around 30 + 15 + 10 + 8 = 63 points.

**DynamoDB operations for Stage 4:** 2 reads per profile (boost check + subscription check). With 20 profiles: 40 DynamoDB operations.

---

## Stage 5: SORT and RETURN

All scored profiles are sorted in descending order — highest score first. The top profiles are returned to the frontend. By default, 20 profiles are returned per page.

If there are more profiles than the page limit, a cursor is included in the response. The frontend can request the next page by passing this cursor to the next API call.

Each profile in the response includes a flag called `isBoosted` which tells the frontend whether to show the gold "Boosted" badge, and a flag called `phoneVerified` which tells the frontend whether to show the green "Verified" badge.

**DynamoDB operations for Stage 5:** Zero. Sorting happens in memory.

---

## Complete Operation Count for One Discover Page Load

When a user opens the Discover page, the frontend makes 3 HTTP API calls to the backend. The main discovery call triggers the algorithm described above. Here is the complete breakdown.

**Frontend makes 3 API calls.** The first is `GET /discover` which triggers the matching algorithm. The second is `GET /subscriptions/usage` which loads the usage bar showing how many profile views and interests remain today. The third is `GET /subscriptions/me` which loads the user's current plan for the header badge, though this is usually cached from a previous page load.

**The `GET /discover` Lambda performs approximately 50 DynamoDB operations for a typical user.** This breaks down as follows. Three reads to get the user's profile, preferences, and blocked list. Up to 7 queries to search by countries, religions, and the fallback index. And approximately 40 reads to check boost and subscription status for each of the 20 resulting profiles (2 reads per profile).

**The `GET /subscriptions/usage` Lambda performs 3 DynamoDB operations.** One read to get the user's subscription record, and two reads to get today's usage counts for profile views and interests.

**The `GET /subscriptions/me` Lambda performs 2 DynamoDB operations.** One read for the subscription record and one read for the plan's entitlement details.

**Grand total for one Discover page load: 3 API calls from the frontend, resulting in approximately 55 DynamoDB operations on the backend.** At DynamoDB's on-demand pricing of $0.00000125 per read, this costs approximately $0.00007 per page load — effectively free.

---

## How Boost Changes the Order — Worked Example

Imagine four profiles that survived the filter, all viewed by the same user.

**Without any boosts or premium plans.** Saranya is Hindu from Sri Lanka with a bachelor's degree and a complete profile. She scores 30 for religion match, 15 for same country, 10 for education match, 10 for photo, and 9 for completion. Total: 74 points. Priya is Hindu from the UK with a bachelor's degree. She scores 30 for religion, 0 for different country, 10 for education, 10 for photo, and 9 for completion. Total: 59 points. Kavitha is Christian from the UK with a master's degree. She scores 30 for religion match, 0 for different country, 0 for education (masters not in viewer's preference), 10 for photo, and 7 for completion. Total: 47 points. The order is Saranya (74), Priya (59), Kavitha (47).

**Now Priya activates a boost.** Her score becomes 59 + 100 = 159 points. She jumps to first place. The new order is Priya (159), Saranya (74), Kavitha (47). Priya stays at the top for 24 hours until the boost expires, then drops back to her organic score of 59.

**Now imagine Sowmya is a Platinum subscriber.** Without a boost, she gets a permanent +50 bonus. If her organic match score is 59 (same as Priya), her total is 109. She naturally appears above Saranya (74) and Priya (59), but below boosted Priya (159). If Sowmya also activates a boost, she scores 59 + 50 + 100 = 209 — the highest possible for her match quality.

This system creates a clear value proposition for premium plans. Free users can still appear high with strong organic matches, but Gold and Platinum users have tools to increase their visibility when they want to.
