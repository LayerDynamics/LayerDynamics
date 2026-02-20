#!/usr/bin/env python3
"""Generate styled SVG repo cards for GitHub profile README."""

import json
import os
import urllib.request

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
USERNAME = "LayerDynamics"

REPOS = [
    "BrowserX",
    "forge",
    "node-rust-pty",
    "Echelon",
    "smlx",
    "stega",
]

LANG_COLORS = {
    "TypeScript": "#3178C6",
    "Rust": "#DEA584",
    "Python": "#3572A5",
    "Go": "#00ADD8",
    "JavaScript": "#F1E05A",
    "C++": "#F34B7D",
    "Shell": "#89E051",
    "HTML": "#E34C26",
    "CSS": "#563D7C",
    "C": "#555555",
}

THEME = {
    "bg": "#1a1b27",
    "border": "#383d5f",
    "title": "#70a5fd",
    "text": "#a9b1d6",
    "icon": "#bf91f3",
}


def fetch_repo(name):
    url = f"https://api.github.com/repos/{USERNAME}/{name}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def truncate(text, max_len=80):
    if not text:
        return "No description provided."
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def escape_xml(text):
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def generate_card(repo_data):
    name = repo_data["name"]
    desc = escape_xml(truncate(repo_data.get("description") or ""))
    lang = repo_data.get("language") or ""
    lang_color = LANG_COLORS.get(lang, "#8b8b8b")
    stars = repo_data.get("stargazers_count", 0)
    forks = repo_data.get("forks_count", 0)

    bg = THEME["bg"]
    border = THEME["border"]
    title_color = THEME["title"]
    text_color = THEME["text"]
    icon_color = THEME["icon"]

    # Wrap description if needed
    desc_lines = []
    words = desc.split()
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if len(test) > 45:
            desc_lines.append(line)
            line = word
        else:
            line = test
    if line:
        desc_lines.append(line)

    desc_y_start = 60
    desc_svg = ""
    for i, dl in enumerate(desc_lines[:3]):
        desc_svg += f'    <text x="25" y="{desc_y_start + i * 18}" fill="{text_color}" font-size="12.5" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{dl}</text>\n'

    card_height = 120 + max(0, (len(desc_lines[:3]) - 1) * 18)
    bottom_y = card_height - 18

    lang_section = ""
    if lang:
        lang_section = f'''<circle cx="25" cy="{bottom_y}" r="6" fill="{lang_color}"/>
    <text x="37" y="{bottom_y + 4}" fill="{text_color}" font-size="12" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{escape_xml(lang)}</text>'''

    svg = f'''<svg width="400" height="{card_height}" viewBox="0 0 400 {card_height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="399" height="{card_height - 1}" rx="6" fill="{bg}" stroke="{border}" stroke-width="1"/>
  <g>
    <svg x="25" y="22" width="16" height="16" viewBox="0 0 16 16" fill="{icon_color}">
      <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
    </svg>
    <text x="48" y="36" fill="{title_color}" font-size="14" font-weight="bold" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{escape_xml(name)}</text>
{desc_svg}
    {lang_section}
  </g>
</svg>'''
    return svg


def main():
    out_dir = os.environ.get("OUTPUT_DIR", "assets/repo-cards")
    os.makedirs(out_dir, exist_ok=True)

    for repo_name in REPOS:
        print(f"Fetching {repo_name}...")
        data = fetch_repo(repo_name)
        svg = generate_card(data)
        path = os.path.join(out_dir, f"{repo_name}.svg")
        with open(path, "w") as f:
            f.write(svg)
        print(f"  -> {path}")

    print("Done.")


if __name__ == "__main__":
    main()
