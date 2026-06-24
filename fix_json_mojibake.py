from pathlib import Path
p = Path('data/activities.json')
s = p.read_text(encoding='utf-8', errors='replace')
replacements = {
    'IntÃ©rieur': 'Intérieur',
    'ExtÃ©rieur': 'Extérieur',
    'Ã‰tÃ©': 'Été',
    'BÃ¢che': 'Bâche',
    'Ã ': 'à ',
}
orig = s
for k,v in replacements.items():
    s = s.replace(k,v)
if s!=orig:
    p.write_text(s, encoding='utf-8')
    print('Updated data/activities.json')
else:
    print('No changes')
