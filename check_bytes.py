import os

files = ['index.html', 'activities.html', 'js/activities.js']

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            raw = f.read(1000)
        
        # Chercher les emojis (bytes UTF-8)
        # 🎨 = F0 9F 8E A8
        if b'\xf0\x9f' in raw:
            print(f"✓ {file_path}: contient des emojis UTF-8 valides")
        elif b'\xc3' in raw:
            print(f"~ {file_path}: contient des accents UTF-8")
        else:
            print(f"✗ {file_path}: pas de UTF-8 détecté")
