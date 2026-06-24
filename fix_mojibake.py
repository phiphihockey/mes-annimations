#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path

files = [
    'activities.html',
    'activity.html',
    'admin.html',
    'index.html',
    'data/activities.json',
    'js/activities.js',
    'data/activities.js'
]

def score_mojibake(s):
    # higher score = more mojibake-like
    bad_tokens = ['Ã', 'â', 'Å', '�', 'ðŸ']
    return sum(s.count(t) for t in bad_tokens)

for f in files:
    p = Path(f)
    if not p.exists():
        print(f"- {f} not found")
        continue
    raw = p.read_bytes()
    try:
        text = raw.decode('utf-8')
    except Exception:
        text = raw.decode('utf-8', errors='replace')
    orig_score = score_mojibake(text)

    # attempt fix: re-encode as latin1 then decode utf-8
    try:
        fixed = text.encode('latin-1', errors='replace').decode('utf-8', errors='replace')
    except Exception:
        fixed = text
    fixed_score = score_mojibake(fixed)

    if fixed_score < orig_score:
        # write fixed as UTF-8 bytes
        p.write_text(fixed, encoding='utf-8')
        print(f"✓ Fixed {f}: score {orig_score} -> {fixed_score}")
    else:
        print(f"- No change for {f} (score {orig_score})")
