// HireMe submission delivery. Each inquiry is sent to every configured channel:
//   • Web3Forms  → emails the submission to the owner (record of truth). The
//     access key is a genuine public submission key, so it's fine client-side.
//   • Discord    → posted via the portal provider's /api/inquiry endpoint, which
//     holds the Discord webhook server-side. The webhook is a WRITE-CAPABLE
//     secret and must NOT ship in the client bundle, so we never read it here;
//     the client only knows the provider origin (VITE_PORTAL_ORIGIN).
// If NEITHER channel is configured (e.g. local dev without keys / no provider),
// it falls back to opening a prefilled mail draft so the form is never a dead
// end. Config comes from Vite env (see .env.example).

import { PROJECT_TYPES, type HireMeValues, type ProjectType } from './types'
import { social } from '../../data/social'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined
// Origin of the deployed portal provider (e.g. https://portal.example.com). When
// set, Discord delivery goes through ${PORTAL_ORIGIN}/api/inquiry. Unset → the
// Discord channel is simply skipped (Web3Forms still captures the inquiry).
const PORTAL_ORIGIN = import.meta.env.VITE_PORTAL_ORIGIN as string | undefined
// Mirrors ROUTES.inquiry in @layerdynamics/portal/contract (kept inline to avoid
// coupling the client build to the provider package).
const INQUIRY_PATH = '/api/inquiry'

const CONTACT_EMAIL =
  social.find((s) => s.id === 'email')?.value ?? 'layerdynamics@proton.me'

/** Human-readable label for a project-type value. */
function projectTypeLabel(value: ProjectType): string {
  return PROJECT_TYPES.find((p) => p.value === value)?.label ?? value
}

/** Mail-client fallback used only when no delivery channel is configured. */
function buildMailto(values: HireMeValues): string {
  const subject = `Project inquiry — ${values.name}`
  const body = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Project type: ${projectTypeLabel(values.projectType)}`,
    values.budget ? `Budget: ${values.budget}` : null,
    '',
    values.message,
  ]
    .filter((line) => line !== null)
    .join('\n')
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Email the submission via Web3Forms. Uses FormData (multipart) deliberately:
 *  it's a "simple" CORS request with no preflight, which the Web3Forms free
 *  endpoint requires (a JSON Content-Type triggers an OPTIONS preflight it
 *  rejects with 403). Throws if the request is rejected. */
async function sendWeb3Forms(values: HireMeValues): Promise<void> {
  const form = new FormData()
  form.append('access_key', WEB3FORMS_KEY ?? '')
  form.append('subject', `Hire inquiry — ${values.name}`)
  form.append('from_name', 'Layer Dynamics — Hire Me')
  form.append('name', values.name)
  form.append('email', values.email)
  form.append('replyto', values.email)
  form.append('project_type', projectTypeLabel(values.projectType))
  form.append('budget', values.budget || '—')
  form.append('message', values.message)

  // No explicit headers — the browser sets multipart/form-data, keeping this a
  // preflight-free simple request.
  const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: form })
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
  if (!res.ok || !data.success) {
    throw new Error(data.message || `Email delivery failed (${res.status})`)
  }
}

/** Send the inquiry to the portal provider's /api/inquiry endpoint, which holds
 *  the Discord webhook server-side and posts the rich embed. We send only the
 *  raw field values (the provider builds the embed and truncates). Throws on a
 *  non-2xx response. */
async function sendDiscord(values: HireMeValues): Promise<void> {
  const res = await fetch(`${PORTAL_ORIGIN}${INQUIRY_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: values.name,
      email: values.email,
      projectType: projectTypeLabel(values.projectType),
      budget: values.budget || '',
      message: values.message,
    }),
  })
  if (!res.ok) throw new Error(`Discord alert failed (${res.status})`)
}

/** Outcome of a delivery attempt. `sent` means a configured channel actually
 *  accepted the inquiry; `mailto` means no channel was configured so we only
 *  opened a prefilled mail draft — delivery is NOT confirmed until the visitor
 *  sends it. The caller must surface these differently. */
export type DeliveryOutcome = 'sent' | 'mailto'

/**
 * Deliver an inquiry to every configured channel. Web3Forms (the emailed record
 * of truth) must succeed; when it's also on, a Discord failure is logged but does
 * not fail the submission (the email already captured it). With only Discord
 * configured, Discord must succeed. With neither, fall back to a mail draft.
 *
 * Returns which path ran so the UI never claims a confirmed send for the draft
 * fallback (where nothing leaves the browser until the visitor hits send).
 */
export async function deliverInquiry(values: HireMeValues): Promise<DeliveryOutcome> {
  const haveEmail = !!WEB3FORMS_KEY
  const haveDiscord = !!PORTAL_ORIGIN

  if (!haveEmail && !haveDiscord) {
    window.location.href = buildMailto(values)
    return 'mailto'
  }

  const jobs: Promise<void>[] = []
  if (haveEmail) jobs.push(sendWeb3Forms(values))
  if (haveDiscord) {
    const discord = sendDiscord(values)
    jobs.push(
      haveEmail
        ? discord.catch((err) => console.warn('Discord alert failed (email still sent):', err))
        : discord,
    )
  }
  await Promise.all(jobs)
  return 'sent'
}
