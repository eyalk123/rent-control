"""Set Play's "What's new" text on a release that is already on a track.

`eas submit` cannot do this - its --what-to-test flag is TestFlight only - so the step was
manual, and manual meant skipped: build 12 (v1.0.1) went out with no release notes at all.

Runs inspect-only by default and prints the track before touching it. Pass --apply to open
an edit, attach the notes to the matching release and commit. Uses the same service account
key as `eas submit`, which is scoped to testing tracks and cannot publish to production.

    python scripts/play-release-notes.py
    python scripts/play-release-notes.py --apply --version-code 13 --en "en-US=notes-en.txt"

Note the listing currently carries only en-US. Passing a language the listing does not have
will not surface it to users.
"""
import argparse, io, sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\Users\eyalk\.secrets\rent-control-play.json"
PKG = "com.eyalk123.rentcontrol"
TRACK = "internal"

ap = argparse.ArgumentParser()
ap.add_argument("--apply", action="store_true", help="commit the edit (default: inspect only)")
ap.add_argument("--version-code", type=int, help="release to annotate; default = highest on the track")
ap.add_argument("--en"); ap.add_argument("--he")
a = ap.parse_args()

creds = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/androidpublisher"])
svc = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
edits = svc.edits()

eid = edits.insert(packageName=PKG, body={}).execute()["id"]
try:
    langs = [l["language"] for l in
             edits.listings().list(packageName=PKG, editId=eid).execute().get("listings", [])]
    print("listing languages:", langs or "(none)")

    track = edits.tracks().get(packageName=PKG, editId=eid, track=TRACK).execute()
    releases = track.get("releases", [])
    print(f"\n{TRACK} track has {len(releases)} release(s):")
    for r in releases:
        print(f"  status={r.get('status'):<10} versionCodes={r.get('versionCodes')} "
              f"name={r.get('name')} notes={[n['language'] for n in r.get('releaseNotes', [])]}")
    if not a.apply:
        print("\n(inspect only - pass --apply to write)")
        sys.exit(0)

    if not releases:
        sys.exit("no release on the track; run `eas submit` first")
    target = max(releases, key=lambda r: max(int(v) for v in r.get("versionCodes", [0])))
    if a.version_code:
        target = next(r for r in releases
                      if str(a.version_code) in [str(v) for v in r.get("versionCodes", [])])

    notes = []
    if a.en: notes.append({"language": a.en.split("=")[0], "text": io.open(a.en.split("=",1)[1], encoding="utf-8").read()})
    if a.he: notes.append({"language": a.he.split("=")[0], "text": io.open(a.he.split("=",1)[1], encoding="utf-8").read()})
    target["releaseNotes"] = notes

    edits.tracks().update(packageName=PKG, editId=eid, track=TRACK,
                          body={"track": TRACK, "releases": releases}).execute()
    edits.commit(packageName=PKG, editId=eid).execute()
    print(f"\ncommitted: notes set on versionCodes={target.get('versionCodes')} "
          f"for {[n['language'] for n in notes]}")
    eid = None
finally:
    if eid:
        try: edits.delete(packageName=PKG, editId=eid)
        except Exception: pass
