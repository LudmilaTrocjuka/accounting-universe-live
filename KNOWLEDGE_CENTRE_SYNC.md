# Knowledge Centre publication sync

Authorised by the user on 20 November 2026: already-published AU LinkedIn and X materials must also appear on the website. This authorises website republication of the approved published text; it does not authorise new social posts, replies, deletions or changes to the meaning of the published material.

## Source and scope

- Buffer organisation `6adb9976a35a024926063dd9` (My organization, info@accounting-universe.co.uk).
- LinkedIn company page channel `6adba694778b240e2fa13488`.
- X channel `6adba3e3778b240e2fa11314`.
- Read both channels, including available records imported from the networks. Only `sent` posts with `sentAt` and a verified original `externalLink` qualify. Do not import drafts, scheduled posts, errors, private messages, replies by other people or unsent proposals.
- The initial backfill contains 51 verified sent records grouped into 22 social topics, plus one existing AU restaurant guide. A profile-picture-only update is explicitly excluded.
- `data/knowledge-centre.json` is the persistent registry. Preserve processed IDs, exclusions, existing entries and original full text. Store no account author email, access tokens or internal notes.

## Each sync

1. Read the registry and the current main branch. Use the Buffer connector to list sent AU posts, newest first, following pagination until previously processed posts are reached. Periodically inspect the complete available history. Use `get_post` for new records to obtain original links, approved media and complete X threads.
2. Compare post IDs to both `processedPostIds` and `excludedPostIds`. Do not use creation dates as proof of publication. Add only newly published records.
3. Group LinkedIn and X versions of the same material in one topic. Match topic/content, not publication date alone: two different subjects on the same day must remain separate. Repeated sends of the same material add source IDs to the existing topic rather than duplicating a visible card. Preserve the latest published version per platform for display. Thread parts belong to the same material, not individual topics.
4. Preserve the original approved full text. Normalise presentation only: remove literal Markdown bold markers, safely escape HTML, and join complete X thread parts in their original order. Do not invent or expand legal/tax claims. Provide a concise factual title and a one-sentence abstract faithful to the published material. Any suspected factual error must be flagged and investigated, not silently rewritten or called verified.
5. Preserve existing guide links and attach a related AU guide when its exact live URL is already known. Never restore `/christmas-cash-flow.html`, which remains withdrawn, or add it to the sitemap. Do not repost old seasonal material to social channels. Historical social texts retain their actual original publication dates.
6. If no new records exist, make no repository commit. If new records exist, update the registry and `lastCheckedAt`; run `node scripts/build-knowledge-centre.cjs` from the repository root. This regenerates the homepage Knowledge Centre section (six latest topics), full `/knowledge-centre.html` archive and sitemap entry. The output is static HTML, so it does not depend on client-side API access for reading or indexing.
7. Commit the registry and generated files together against the freshly read main branch; avoid overwriting concurrent edits. Do not edit other homepage sections or meta tags. Publish through the existing GitHub-to-Vercel production workflow.
8. Verify Vercel production status READY, the expected commit and the actual public archive/homepage. Confirm every new topic and original link appears. Report a failed access/build/deployment check accurately; a saved registry or a scheduled check alone is not proof of live publication.

## Cadence and limits

- After publishing any newly approved social package, sync its sent records in the same work session.
- Hourly checks within the existing AU UK Accounting Content Studio automation provide catch-up for posts published at other times; the original editorial briefing remains Monday–Friday at 08:00 Europe/London. Other hourly runs perform only the sync. It uses the connected Buffer, GitHub and Vercel tools; no browser session or shared API token is required.
- This is scheduled checking, not a real-time webhook. Actual completion depends on tool access and deployment success; do not promise an exact one-hour publication deadline.
- Buffer history covers records available through its connected channels. If a directly published network post is absent from Buffer history, it cannot be inferred or invented. Report any confirmed coverage gap.
- User-facing summaries are concise and in Russian. All website text remains British English. Send a notification only for newly published website material or a concrete failure; remain quiet when nothing has changed.
