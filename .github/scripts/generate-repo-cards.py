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


def github_api(path):
    url = f"https://api.github.com{path}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    if GITHUB_TOKEN:
        req.add_header("Authorization", f"Bearer {GITHUB_TOKEN}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def fetch_all_repos():
    repos = []
    page = 1
    while True:
        data = github_api(f"/users/{USERNAME}/repos?per_page=100&page={page}")
        if not data:
            break
        repos.extend(data)
        if len(data) < 100:
            break
        page += 1
    return repos


def fetch_user_stats():
    """Fetch contribution stats from user profile and repos."""
    user = github_api(f"/users/{USERNAME}")
    repos = fetch_all_repos()

    total_stars = sum(r.get("stargazers_count", 0) for r in repos)
    total_forks = sum(r.get("forks_count", 0) for r in repos)
    public_repos = user.get("public_repos", 0)

    # Count total commits across repos (limited to top repos for API efficiency)
    total_commits = 0
    for repo in sorted(repos, key=lambda r: r.get("pushed_at", ""), reverse=True)[:20]:
        try:
            contribs = github_api(
                f"/repos/{USERNAME}/{repo['name']}/contributors?per_page=1"
            )
            for c in contribs:
                if c.get("login", "").lower() == USERNAME.lower():
                    total_commits += c.get("contributions", 0)
        except Exception:
            pass

    return {
        "total_stars": total_stars,
        "total_forks": total_forks,
        "public_repos": public_repos,
        "total_commits": total_commits,
        "followers": user.get("followers", 0),
    }


def generate_stats_card(stats):
    bg = THEME["bg"]
    border = THEME["border"]
    title_color = THEME["title"]
    text_color = THEME["text"]
    icon_color = THEME["icon"]

    items = [
        ("Total Stars", stats["total_stars"], "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"),
        ("Total Commits", stats["total_commits"], "M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"),
        ("Public Repos", stats["public_repos"], "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"),
        ("Total Forks", stats["total_forks"], "M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"),
        ("Followers", stats["followers"], "M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a.75.75 0 100 1.5 1.5 1.5 0 01.666 2.844.75.75 0 00-.416.672v.352a.75.75 0 00.574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 101.434-.44 5.01 5.01 0 00-2.56-3.012A3 3 0 0011 4z"),
    ]

    rows_svg = ""
    for i, (label, value, icon_path) in enumerate(items):
        y = 55 + i * 32
        rows_svg += f'''    <svg x="25" y="{y - 8}" width="16" height="16" viewBox="0 0 16 16" fill="{icon_color}">
      <path fill-rule="evenodd" d="{icon_path}"/>
    </svg>
    <text x="50" y="{y + 4}" fill="{text_color}" font-size="13" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{label}:</text>
    <text x="355" y="{y + 4}" fill="{title_color}" font-size="13" font-weight="bold" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif" text-anchor="end">{value}</text>
'''

    return f'''<svg width="380" height="230" viewBox="0 0 380 230" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="379" height="229" rx="6" fill="{bg}" stroke="{border}" stroke-width="1"/>
  <text x="25" y="35" fill="{title_color}" font-size="16" font-weight="bold" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{USERNAME}&apos;s GitHub Stats</text>
{rows_svg}</svg>'''


def generate_top_langs_card(repos):
    bg = THEME["bg"]
    border = THEME["border"]
    title_color = THEME["title"]
    text_color = THEME["text"]

    # Aggregate language bytes across repos
    lang_bytes = {}
    for repo in repos:
        try:
            langs = github_api(f"/repos/{USERNAME}/{repo['name']}/languages")
            for lang, bytes_count in langs.items():
                lang_bytes[lang] = lang_bytes.get(lang, 0) + bytes_count
        except Exception:
            pass

    total = sum(lang_bytes.values()) or 1
    sorted_langs = sorted(lang_bytes.items(), key=lambda x: x[1], reverse=True)[:8]

    # Progress bars
    bars_svg = ""
    bar_y = 50
    for lang, count in sorted_langs:
        pct = count / total * 100
        color = LANG_COLORS.get(lang, "#8b8b8b")
        bar_width = pct / 100 * 310
        bars_svg += f'''    <text x="25" y="{bar_y}" fill="{text_color}" font-size="12" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">{escape_xml(lang)}</text>
    <text x="355" y="{bar_y}" fill="{text_color}" font-size="11" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif" text-anchor="end">{pct:.1f}%</text>
    <rect x="25" y="{bar_y + 5}" width="310" height="8" rx="4" fill="{THEME['border']}"/>
    <rect x="25" y="{bar_y + 5}" width="{bar_width:.1f}" height="8" rx="4" fill="{color}"/>
'''
        bar_y += 32

    card_height = 50 + len(sorted_langs) * 32 + 10

    return f'''<svg width="380" height="{card_height}" viewBox="0 0 380 {card_height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="379" height="{card_height - 1}" rx="6" fill="{bg}" stroke="{border}" stroke-width="1"/>
  <text x="25" y="35" fill="{title_color}" font-size="16" font-weight="bold" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">Top Languages</text>
{bars_svg}</svg>'''


def generate_trophy_card(stats):
    bg = THEME["bg"]
    border = THEME["border"]
    title_color = THEME["title"]
    text_color = THEME["text"]
    gold = "#FFD700"
    silver = "#C0C0C0"
    bronze = "#CD7F32"

    trophies = []

    # Repos trophy
    repos = stats["public_repos"]
    if repos >= 50:
        trophies.append(("Repositories", "SSS", gold, repos, "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"))
    elif repos >= 20:
        trophies.append(("Repositories", "SS", silver, repos, "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"))
    elif repos >= 5:
        trophies.append(("Repositories", "S", bronze, repos, "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"))

    # Commits trophy
    commits = stats["total_commits"]
    if commits >= 1000:
        trophies.append(("Commits", "SSS", gold, commits, "M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"))
    elif commits >= 500:
        trophies.append(("Commits", "SS", silver, commits, "M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"))
    elif commits >= 100:
        trophies.append(("Commits", "S", bronze, commits, "M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"))

    # Stars trophy
    stars = stats["total_stars"]
    if stars >= 50:
        trophies.append(("Stars", "SSS", gold, stars, "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"))
    elif stars >= 10:
        trophies.append(("Stars", "SS", silver, stars, "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"))
    elif stars >= 1:
        trophies.append(("Stars", "S", bronze, stars, "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"))

    # Followers trophy
    followers = stats["followers"]
    if followers >= 50:
        trophies.append(("Followers", "SSS", gold, followers, "M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5z"))
    elif followers >= 10:
        trophies.append(("Followers", "SS", silver, followers, "M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5z"))
    elif followers >= 1:
        trophies.append(("Followers", "S", bronze, followers, "M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5z"))

    if not trophies:
        return None

    trophy_w = 110
    card_width = len(trophies) * trophy_w + 20
    trophies_svg = ""

    for i, (label, rank, color, value, icon_path) in enumerate(trophies):
        x = 10 + i * trophy_w
        cx = x + trophy_w // 2
        trophies_svg += f'''    <rect x="{x}" y="10" width="{trophy_w - 5}" height="100" rx="6" fill="none" stroke="{color}" stroke-width="1.5" opacity="0.6"/>
    <svg x="{cx - 10}" y="22" width="20" height="20" viewBox="0 0 16 16" fill="{color}">
      <path fill-rule="evenodd" d="{icon_path}"/>
    </svg>
    <text x="{cx}" y="60" fill="{color}" font-size="12" font-weight="bold" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif" text-anchor="middle">{rank}</text>
    <text x="{cx}" y="78" fill="{THEME['text']}" font-size="11" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif" text-anchor="middle">{label}</text>
    <text x="{cx}" y="95" fill="{THEME['text']}" font-size="10" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif" text-anchor="middle" opacity="0.7">{value}</text>
'''

    return f'''<svg width="{card_width}" height="120" viewBox="0 0 {card_width} 120" xmlns="http://www.w3.org/2000/svg">
{trophies_svg}</svg>'''


def main():
    out_dir = os.environ.get("OUTPUT_DIR", "assets/repo-cards")
    os.makedirs(out_dir, exist_ok=True)

    # Generate repo cards
    for repo_name in REPOS:
        print(f"Fetching {repo_name}...")
        data = fetch_repo(repo_name)
        svg = generate_card(data)
        path = os.path.join(out_dir, f"{repo_name}.svg")
        with open(path, "w") as f:
            f.write(svg)
        print(f"  -> {path}")

    # Generate stats card
    print("Fetching user stats...")
    stats = fetch_user_stats()
    print(f"  Stars: {stats['total_stars']}, Commits: {stats['total_commits']}, Repos: {stats['public_repos']}")

    stats_svg = generate_stats_card(stats)
    stats_path = os.path.join(out_dir, "stats.svg")
    with open(stats_path, "w") as f:
        f.write(stats_svg)
    print(f"  -> {stats_path}")

    # Generate top languages card
    print("Fetching language data...")
    all_repos = fetch_all_repos()
    langs_svg = generate_top_langs_card(all_repos)
    langs_path = os.path.join(out_dir, "top-langs.svg")
    with open(langs_path, "w") as f:
        f.write(langs_svg)
    print(f"  -> {langs_path}")

    # Generate trophy card
    print("Generating trophies...")
    trophy_svg = generate_trophy_card(stats)
    if trophy_svg:
        trophy_path = os.path.join(out_dir, "trophies.svg")
        with open(trophy_path, "w") as f:
            f.write(trophy_svg)
        print(f"  -> {trophy_path}")

    print("Done.")


if __name__ == "__main__":
    main()
