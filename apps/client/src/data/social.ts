// Contact / social links for the landing Contact section and detail footers.

export interface SocialLink {
  id: string
  label: string
  href: string
  /** Short handle/value shown beside the label. */
  value: string
}

export const social: SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/LayerDynamics',
    value: '@LayerDynamics',
  },
  {
    id: 'email',
    label: 'Email',
    href: 'mailto:layerdynamics@proton.me',
    value: 'layerdynamics@proton.me',
  },
]

export const owner = {
  name: 'Ryan O’Boyle',
  brand: 'Layer Dynamics',
  tagline: 'Framework architecture · polyglot systems · 3D, agents, and ML',
  intro:
    'I build things from scratch — runtimes, frameworks, CLI tools. If I can’t find something that works the way I need, I make it. Most of it is cross-language, because different problems call for different tools.',
}
