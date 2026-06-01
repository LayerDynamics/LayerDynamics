// HireMe submission delivery. Each inquiry is sent to every configured channel:
//   • Web3Forms  → emails the submission to the owner (record of truth)
//   • Discord    → posts a formatted alert to a channel webhook (instant ping)
// Both are real client-side integrations (no backend). If NEITHER is configured
// (e.g. local dev without keys), it falls back to opening a prefilled mail draft
// so the form is never a dead end. Keys come from Vite env (see .env.example).

import { PROJECT_TYPES, type HireMeValues, type ProjectType } from './types'
import { social } from '../../data/social'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined
const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL as string | undefined

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

/** Post the submission to a Discord channel webhook as a rich embed. Throws on
 *  a non-2xx response. */
async function sendDiscord(values: HireMeValues): Promise<void> {
  // Discord embed field values cap at 1024 chars.
  const message = values.message.length > 1000 ? `${values.message.slice(0, 1000)}…` : values.message
  const res = await fetch(DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Layer Dynamics — Hire Me',
      embeds: [
        {
          title: `New inquiry — ${values.name}`,
          color: 0x863bff,
          fields: [
            { name: 'Name', value: values.name || '—', inline: true },
            { name: 'Email', value: values.email || '—', inline: true },
            { name: 'Project type', value: projectTypeLabel(values.projectType), inline: true },
            { name: 'Budget', value: values.budget || '—', inline: true },
            { name: 'Message', value: message || '—' },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Discord alert failed (${res.status})`)
}

/**
 * Deliver an inquiry to every configured channel. Web3Forms (the emailed record
 * of truth) must succeed; when it's also on, a Discord failure is logged but does
 * not fail the submission (the email already captured it). With only Discord
 * configured, Discord must succeed. With neither, fall back to a mail draft.
 */
export async function deliverInquiry(values: HireMeValues): Promise<void> {
  const haveEmail = !!WEB3FORMS_KEY
  const haveDiscord = !!DISCORD_WEBHOOK_URL

  if (!haveEmail && !haveDiscord) {
    window.location.href = buildMailto(values)
    return
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
}
