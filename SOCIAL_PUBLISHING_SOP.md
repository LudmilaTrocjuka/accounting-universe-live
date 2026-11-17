# AU Finance & Advisory — Social Publishing SOP
Effective 16 November 2026. Applies to Buffer publishing on LinkedIn (AU Finance & Advisory) and X (@Accounting_Uni).

## Non-negotiable principle
NEVER publish, schedule or replace an AU social post without the user's explicit approval of the FINAL text, FINAL image OR video and destination URL. Approval of a concept or older version is not permission to swap attachments later. Prepare a complete post package and conduct QA before requesting approval. If user explicitly approves publishing, post promptly but do not report success until status is verified.

## 1. Editorial accuracy
- Find a genuinely current, relevant UK accounting/finance/business development topic; check recent AU publishing history and avoid duplication.
- Verify material facts, laws, scope, applicability and dates against official sources. Avoid unsupported claims.
- Write clear, natural British English. LinkedIn: substantive, engaging, readable and specific, with a client-relevant takeaway. X: concise, well under the platform character limit after URL treatment, one or two relevant hashtags.
- Do not confuse social post keywords with website SEO fields. No promises of guaranteed organic reach.

## 2. SEO and landing page
- Point to the most relevant working AU landing page or article, rather than homepage by default.
- If a new SEO article is part of the campaign, create it with clear H1, unique meta title/description, canonical, helpful main content, FAQ where useful, structured data when appropriate, internal links, sitemap entry, and visible navigation from the site's Insights/Knowledge Centre.
- Verify GitHub commit AND production deployment ready AND actual public link loads before social publication. Do not assert that a page is live merely because a repo file exists.

## 3. Tracking
- Use platform-specific UTM links: utm_source=linkedin or x, utm_medium=social, consistent campaign; verify destination works and all query parameters survive.
- UTM enables attribution; it does not improve reach by itself.
- Do not misrepresent tracking unless analytics is enabled and checked.

## 4. Visual asset — critical error prevention
- Use ONE specifically approved illustration for the topic. Never replace it with a different generated image, generic logo, thumbnail, or mock-up.
- Use a legible, landscape social graphic (typically 1200x675 or a format validated for both platforms); check actual pixel size, visual composition, spelling, company name, dates, mobile crop, and contrast.
- NEVER upload the tiny 256x256 square AU logo as the primary graphic; it rendered huge and blurry on 16 Nov 2026.
- Upload the EXACT approved image to a stable public HTTPS file URL, compare it visually with approved image, and confirm Buffer asset.source is EXACTLY that URL. A valid-looking filename is insufficient.
- Add accurate descriptive ALT text referring to the ACTUAL picture. Check ALT saved in Buffer.
- Do not claim the generated thematic image was posted if the actual post asset is the logo.

## 4A. Video-first option for AU posts (added 17 November 2026)
- We have planned to create short original videos for AU social posts. Do NOT omit this planned format and present a static picture as the only possible visual. For each new topic, propose a short video alongside/where more useful than a static image; the user chooses the final approved format.
- Use the approved brand style for LinkedIn and X: DARK NAVY background, WHITE lettering and restrained corporate accents. Avoid unexpected green/cream designs or generic stock logos. Brand taglines: "Accounting, Financial Control & Advisory for UK Businesses" and "Less paperwork. More progress." where appropriate.
- Produce a real, playable MP4, normally 15–30 seconds, with compelling first 2 seconds, mobile-legible on-screen captions, correct UK terminology, useful information, one focused takeaway, and company branding. Verify exact frame content, spelling, dimensions, duration, file playback, and display without audio. Check platform-upload constraints.
- Ensure financial/legal/tax statements in video are checked against primary official sources; distinguish 'new today' from evergreen policy. Avoid oversimplified VAT claims.
- Present the FINAL video (or a verified playable file) and text, ALT/accessibility text and UTM links to user for explicit approval BEFORE publishing.
- Video asset must be hosted on a stable direct-download HTTPS URL and attached as {video} in Buffer for each platform; visually verify published media and status SENT. No substituting a 256x256 static company logo as the primary media. Do not claim a draft was posted.
- If MP4 upload/storage is unavailable, report the blocker and deliver an approved playable MP4 for manual upload; NEVER silently publish an image instead.

## 5. Platform-specific final checks
- LinkedIn: text, opening hook, formatting, company branding, 2-3 relevant hashtags, CTA, working UTM link, image asset and ALT text. Inspect Buffer preview.
- X: separate short copy, 1-2 hashtags, CTA, UTM link, checked post length, image asset, ALT text. Inspect Buffer preview.
- Avoid duplicate posts and confirm channel/account IDs.
- Render a final approval package to the user: full texts, the exact final image, link destinations and planned timing. Ask for single publication approval; no additional piecemeal tasks required.

## 6. Publishing, verification and remediation
- Publish via Buffer only after approval. Use create_post(mode=shareNow) for immediate posting; editing a draft with shareNow previously left status 'draft' and did NOT send.
- Check each new post via get_post: status='sent', sentAt, externalLink, media URL, alt text. Open or otherwise verify actual platform display where supported. 'sending', 'scheduled' and 'draft' are NOT published.
- Report live links and accurate status for EACH platform; do not invent posts, impressions, leads, or outcomes.
- After posting, monitor authentic engagement and draft human-sounding replies for user approval.
- When wrong media is posted, do NOT silently delete. Confirm replacement first, protect reactions if feasible; explain that deleted X/LinkedIn posts lose existing engagement. Never promise to replace a live attachment using Edit without first confirming the platform supports it.

## 7. Final gate: all PASS before sending
[ ] Verified facts and no repeat topic
[ ] Proofread LinkedIn copy
[ ] Proofread X copy/character limit
[ ] Correct hashtags and concise CTA
[ ] Landing article/page is LIVE and linked visibly from site where relevant
[ ] Separate, tested platform UTM links
[ ] EXACT user-approved image or MP4 video, good format/resolution/crop
[ ] Correct file at stable HTTPS media URL
[ ] ALT text saved and matches image
[ ] Buffer preview reviewed for each channel
[ ] No duplicates
[ ] User approved FINAL package
Post-publication gate: [ ] LinkedIn sent + verified media [ ] X sent + verified media [ ] direct links supplied.
