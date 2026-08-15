const trialEndsAt = new Date("2026-07-15T00:00:00Z"); // 1 month ago
const now = new Date();
const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
const isTrialExpired = trialEnd ? now > trialEnd : false;

console.log({
  now: now.toISOString(),
  trialEnd: trialEnd.toISOString(),
  isTrialExpired
});
