# AU Client Demand Radar — internal prototype

The Sales Agent is **separate from the public Chatling assistant** and must not be linked from the public website.

## Features (MVP 0.1)
- Searches public UK Contracts Finder notices using its documented search API (source availability and field mapping require live validation).
- Imports a CSV of independently verified opportunities.
- De-duplicates leads, checks deadlines, flags employment offers and missing source evidence.
- Produces a local HTML dashboard with A/B/C triage grades, source links and review statuses.
- Does not send emails, submit bids, access private platforms or create fictional leads.

## Run
```sh
python3 tools/au-sales-agent/agent.py discover --query "accountancy services" --query "financial modelling"
python3 tools/au-sales-agent/agent.py report
python3 tools/au-sales-agent/agent.py import --input manually_verified.csv
```

Run from the folder where you want `opportunities.csv` and `dashboard.html` to be generated. These contain research data and must remain private; do not commit them to this public website repository.

The downloadable local MVP includes the source code, empty dashboard and a CSV template. It is not yet an always-on autonomous agent or a deployed private web app.

## Approval and privacy
New records are always marked Unverified until human review. Grade A means prioritise research, not approval to contact. Never send outreach without Ludmila's explicit approval. Respect UK GDPR/PECR and website access restrictions.

## Next
Validate live source responses, add UK practice subcontract and hospitality demand channels, build private authenticated dashboard, add approved drafts and scheduling.
