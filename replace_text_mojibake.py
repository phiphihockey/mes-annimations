#!/usr/bin/env python3
from pathlib import Path

mappings = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã¢': 'â',
    'Ã´': 'ô',
    'Ã»': 'û',
    'Ã§': 'ç',
    'Ã ': 'à',
    'Ã‰': 'É',
    'IntÃ©rieur': 'Intérieur',
    'ExtÃ©rieur': 'Extérieur',
    'Ã‰tÃ©': 'Été',
    'BÃ¢che': 'Bâche',
    'â˜°': '☰',
    'Å“': 'œ',
}

# Also remove or replace mojibake emoji prefixes starting with 'ðŸ'

root = Path('.')
files = list(root.rglob('*'))
count = 0
for p in files:
    if p.is_file() and p.suffix.lower() in ['.html', '.js', '.json', '.css']:
        s = p.read_text(encoding='utf-8', errors='replace')
        orig = s
        for k,v in mappings.items():
            s = s.replace(k, v)
        # remove lone mojibake emoji fragments starting with 'ðŸ'
        s = s.replace('ðŸ', '')
        # also remove replacement artifacts like '\u00ef\u00bf\u00bd' if present
        s = s.replace('\ufffd', '')
        if s != orig:
            p.write_text(s, encoding='utf-8')
            print(f"Fixed {p}")
            count += 1
print(f"Completed. Files changed: {count}")
