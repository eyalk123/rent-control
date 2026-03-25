const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Explicitly sets android:launchMode="singleTask" on MainActivity.
 *
 * Required for expo-web-browser's openAuthSessionAsync (used by Clerk's startSSOFlow)
 * to resolve on Android. Without singleTask, Chrome Custom Tabs dispatches the OAuth
 * redirect as an Android Intent that creates a NEW activity, and the BroadcastReceiver
 * in the original activity never fires.
 *
 * Placed last in plugins array so it runs after expo-router (which may set its own launchMode).
 */
module.exports = function withAndroidLaunchMode(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application?.activity) {
      console.warn('[withAndroidLaunchMode] No activities found in AndroidManifest');
      return config;
    }

    const activityNames = application.activity.map((a) => a.$['android:name']);
    console.log('[withAndroidLaunchMode] All activities:', activityNames.join(' | '));

    let found = false;
    for (const activity of application.activity) {
      const name = activity.$['android:name'] ?? '';
      if (
        name === '.MainActivity' ||
        name === 'MainActivity' ||
        name.endsWith('.MainActivity')
      ) {
        const prev = activity.$['android:launchMode'] ?? '(none)';
        activity.$['android:launchMode'] = 'singleTask';
        console.log(
          `[withAndroidLaunchMode] Set singleTask on "${name}" (was: ${prev})`
        );
        found = true;
      }
    }

    if (!found) {
      console.warn(
        '[withAndroidLaunchMode] WARNING: MainActivity not found! Activities:',
        activityNames.join(' | ')
      );
    }

    return config;
  });
};
