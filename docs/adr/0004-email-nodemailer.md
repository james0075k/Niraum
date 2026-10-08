# 0004 — Email via Nodemailer (SMTP)

- Status: Accepted · 2026-10-08

## Decision

Use Nodemailer over SMTP behind a small `config/mailer.ts` interface (`send({to, subject, html,
text})`). Mailpit catches mail in local dev. Resend remains a drop-in alternative by swapping the
implementation behind the same interface if the company has no reliable SMTP.

## Consequences

Works with any provider (company mail host, SES, Brevo…). Deliverability (SPF/DKIM/DMARC on the
company domain) is an operations task listed in DEPLOYMENT.md.
