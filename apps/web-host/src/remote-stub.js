// Placeholder for federated remote modules when Module Federation is disabled
// (the default standalone build). `@module-federation/nextjs-mf` only supports
// the Pages Router, so with the App Router the remotes are opt-in via
// ENABLE_MODULE_FEDERATION=true. When disabled, the host aliases each remote
// specifier to this module; importing it rejects so the consuming page renders
// its built-in "remote unavailable" fallback (see each dashboard page).
throw new Error(
  'Module Federation is disabled. Set ENABLE_MODULE_FEDERATION=true and run the remote apps to load this module.',
);
