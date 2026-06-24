#!/usr/bin/env python3
import os

# Vérifier l'encodage réel des fichiers
files = ['activities.html', 'data/activities.json']

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            raw = f.read(500)
        
        print(f"\n=== {file_path} ===")
        # Chercher le mot "Activit"
        search = b'Activit'
        idx = raw.find(search)
        if idx >= 0:
            # Afficher les bytes autour
            snippet = raw[idx:idx+20]
            print(f"Bytes: {snippet}")
            print(f"Hex: {snippet.hex()}")
            
            # Essayer différents encodages
            print("\nEssai de décodage:")
            try:
                print(f"UTF-8: {snippet.decode('utf-8')}")
            except:
                print(f"UTF-8: Erreur")
            try:
                print(f"ISO-8859-1: {snippet.decode('iso-8859-1')}")
            except:
                print(f"ISO-8859-1: Erreur")
