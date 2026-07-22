'use strict';

/**
 * Talent Marketplace search ranking - tunable in one place, per Phase 4's
 * "make the weights constants in one config file so they are tunable."
 * Final score = textRank*TEXT_RANK + freshness*FRESHNESS + completeness*COMPLETENESS,
 * each of the three signals pre-normalized to 0-1 before weighting (see
 * scoreCandidate() in talent.js).
 */
module.exports = {
  WEIGHTS: {
    TEXT_RANK: 0.5,
    FRESHNESS: 0.2,
    COMPLETENESS: 0.3,
  },
  // Freshness decays linearly from 1 (updated today) to 0 at this many days old.
  FRESHNESS_HALF_LIFE_DAYS: 90,
  RESULTS_PER_PAGE: 20,
  // How many SQL-native candidates to pull per page before applying the
  // legacy-store-only filters (courses/certificates/min gems) and final
  // scoring in application code - see talent.js's searchProfiles().
  CANDIDATE_BATCH_SIZE: 300,
  // How often the gems/level/completed-courses/certificates cache on
  // talent_profiles is refreshed in the background for every published
  // profile (minutes). Search results for these specific fields can be
  // this stale in the worst case - see migrations/0004_talent_search.sql.
  CACHE_REFRESH_MINUTES: 30,
  CONTACT_REQUESTS_DAILY_LIMIT: Number(process.env.CONTACT_REQUESTS_DAILY_LIMIT) || 25,
};
