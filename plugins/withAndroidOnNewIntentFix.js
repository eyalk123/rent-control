const { withMainActivity } = require('@expo/config-plugins');

/**
 * Patches MainActivity to forward deep-link intents to React Native's Linking module.
 *
 * In the Expo dev client, onNewIntent is handled by the dev-launcher before ReactActivity
 * can process it. As a result:
 *   - Linking.addEventListener('url', ...) never fires in JS
 *   - Linking.getInitialURL() returns the original dev-client launch URL, not the OAuth URL
 *
 * Fix: override onNewIntent to explicitly call super (which triggers ReactActivity's
 * LinkingManager path → emits the 'url' event to JS) AND call setIntent(intent) so
 * getInitialURL() returns the new URL.
 *
 * This is required for Google OAuth (and any other deep-link-based auth) to work inside
 * the Expo dev client on Android.
 */
module.exports = function withAndroidOnNewIntentFix(config) {
  return withMainActivity(config, (config) => {
    const isKotlin = config.modResults.language === 'kt';
    let contents = config.modResults.contents;

    if (contents.includes('onNewIntent')) {
      // An override already exists (added by another plugin or manually).
      // Ensure setIntent(intent) is present so getInitialURL() works.
      if (!contents.includes('setIntent(intent)')) {
        if (isKotlin) {
          contents = contents.replace(
            /(override fun onNewIntent\([^)]*\)\s*\{)/,
            '$1\n    setIntent(intent)',
          );
        } else {
          contents = contents.replace(
            /(public void onNewIntent\([^)]*\)\s*\{)/,
            '$1\n    setIntent(intent);',
          );
        }
        config.modResults.contents = contents;
        console.log('[withAndroidOnNewIntentFix] Added setIntent() to existing onNewIntent');
      } else {
        console.log('[withAndroidOnNewIntentFix] onNewIntent already contains setIntent — no change needed');
      }
      return config;
    }

    // No override yet — inject one.
    const kotlinOverride = `
  /**
   * Forward deep-link intents to React Native's Linking module.
   * Without this the Expo dev client consumes onNewIntent for its own routing and
   * Linking.addEventListener / getInitialURL() never see OAuth callback URLs.
   */
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
`;

    const javaOverride = `
  /**
   * Forward deep-link intents to React Native's Linking module.
   */
  @Override
  public void onNewIntent(android.content.Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }
`;

    // Insert before the final closing brace of the class
    const override = isKotlin ? kotlinOverride : javaOverride;
    contents = contents.replace(/\n}\s*$/, `\n${override}\n}`);
    config.modResults.contents = contents;
    console.log('[withAndroidOnNewIntentFix] Injected onNewIntent override into MainActivity');
    return config;
  });
};
