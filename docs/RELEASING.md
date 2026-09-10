# Releasing the mobile app to Google Play

How to cut an Android build and get it onto Play. Everything here is already set up —
this is the repeatable procedure, plus the traps that cost time the first time round.

**Run every command from `rent-control/`.** From anywhere else (your home directory, the
workspace root) `eas` cannot find the app config, derives a slug from the folder name, and
offers to create a *new* EAS project such as `@eyalk123/eyalk`. Always answer **no** —
saying yes uploads credentials to a project the builds do not use, and the failure surfaces
much later as an unrelated-looking permissions error. The real project is
`@eyalk123/rent-control` (`projectId` is pinned in `app.config.js`).

## The pieces that already exist

| Thing | Value |
|---|---|
| Play app | `com.eyalk123.rentcontrol` — Play display name is **"Karka"**, not "Rent Control" |
| Play developer account | `6600455956480709835` |
| Service account | `rent-control-eas-submit@rent-control-5c5da.iam.gserviceaccount.com` |
| Key location (local) | `C:\Users\eyalk\.secrets\rent-control-play.json` — outside the repo, deliberately |
| Key location (used by builds) | Uploaded to EAS servers, so `eas.json` needs no path and CI needs no file |

The service account is scoped to this app only and has **release to testing tracks +
view app information**. It deliberately does **not** have production release permission.
That costs nothing today: production is gated behind Google's requirement of 12 testers
opted in for 14 days, and the account currently has 2, so "Apply for production" is greyed
out regardless. Promotion to production is a manual step in the Play Console.

## The procedure

1. **Decide the version name.** `versionCode` increments by itself — `eas.json` sets
   `autoIncrement: true` and `appVersionSource: "remote"`, so EAS tracks it server-side.
   The *version name* is manual: edit `expo.version` in `app.json`. It sat at `1.0.0` for
   eleven builds, which made tester bug reports ambiguous. Bump it.

2. **Commit first.** EAS refuses to build from a dirty tree. It offers to commit for you —
   decline and commit yourself, so the message is meaningful.

3. **Build.**
   ```
   eas build --platform android --profile production --non-interactive
   ```
   Roughly 15–25 minutes. Credentials (upload keystore) are already on EAS; no prompts.

4. **Submit.**
   ```
   eas submit --platform android --latest
   ```
   `eas.json` sets `submit.production.android.track` to `internal`. **Keep it there unless
   you have a reason to change it** — the *Closed testing (Alpha)* track has a draft release
   sitting on it, and submitting into a track with a draft can collide. Internal testing is
   clean.

5. **Add the release notes by hand.** `eas submit` **cannot** set Play's "What's new" text —
   its `--what-to-test` flag is iOS/TestFlight only. Either paste into the Play Console
   release, or script it against the Play Developer API (`edits.tracks.update`) using the
   same service account key. Play caps this at 500 characters per language; the listing is
   English + Hebrew.

6. **Verify.** Play Console → Testing → Internal testing shows the new version code.
   Credentials can be checked any time at
   `https://expo.dev/accounts/eyalk123/projects/rent-control/credentials`.

## Writing the release notes

Derive them from `git log` since the previous build's date rather than writing something
generic — `eas build:list --platform android --limit 5 --non-interactive --json` gives the
date of the last production build. Do not describe improvements that are not in the diff:
this text is a public claim about what the software does.

**Check what is actually enabled in the build before describing it.** The onboarding tours
are the standing example — `src/features/onboarding/flags.ts` keeps them off in release
builds unless `EXPO_PUBLIC_ONBOARDING_TOURS=on`, which the `preview` and `simulator`
profiles set and `production` does not. Tour work can land in a build and be invisible to
testers, so it does not belong in the notes unless the flag is on.

## Things an agent cannot do

- **`eas credentials` is an arrow-key menu.** Anything credential-related — rotating the
  service account key, changing the keystore — is yours to drive.
- **Creating Google credentials in a browser is blocked** by the permission classifier, even
  with an allow rule for the browser tool. If the key ever needs replacing, do it yourself
  or via `gcloud`. Clicking and navigating are fine; typing into those forms is not.
- **Play Console has no `/api-access` page** on this account. Service accounts are managed in
  Google Cloud Console and then invited under Play Console → Users and permissions
  (משתמשים והרשאות — the console renders in Hebrew, RTL).

## Unrelated but time-boxed

Android developer verification: the app is registered, but one of the three signing keys is
still in draft. Apps not registered are removed from Play globally after **Sep 30, 2026**.
