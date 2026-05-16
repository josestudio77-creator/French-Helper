import os
import io
from gtts import gTTS
from pydub import AudioSegment
from pydub.effects import normalize

# 1. Setup both output folders
folder_raw = "french_with_silence"
folder_trimmed = "french_trimmed_silence"

for folder in [folder_raw, folder_trimmed]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# 2. Define the COMPLETE Master List
alphabet = {f"{chr(i)}": chr(i) for i in range(ord('a'), ord('z') + 1)}
double_letters = {f"deux_{chr(i)}": f"deux {chr(i)}" for i in range(ord('a'), ord('z') + 1)}

special_chars = {
    # Accents
    "e_accent_aigu": "E accent aigu", "e_accent_grave": "E accent grave", 
    "e_accent_circonflexe": "E accent circonflexe", "e_accent_trema": "E tréma",
    "a_accent_grave": "A accent grave", "a_accent_circonflexe": "A accent circonflexe", 
    "i_accent_circonflexe": "I accent circonflexe", "i_accent_trema": "I tréma",
    "o_accent_circonflexe": "O accent circonflexe", "u_accent_grave": "U accent grave", 
    "u_accent_circonflexe": "U accent circonflexe", "c_cedille": "C cédille",
    # Ligatures (New additions)
    "oe_ligature": "E dans l'O",
    "ae_ligature": "E dans l'A"
}

master_map = {**alphabet, **double_letters, **special_chars}

print(f"Generating {len(master_map)} assets for BOTH folders (Raw vs Trimmed)...")

for filename, text in master_map.items():
    # Generate speech
    tts = gTTS(text=text, lang='fr')
    mp3_fp = io.BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    # Convert to base audio object
    base_audio = AudioSegment.from_file(mp3_fp, format="mp3")
    
    # --- VERSION 1: RAW (No trimming - just volume normalized) ---
    raw_audio = normalize(base_audio)
    raw_audio.export(os.path.join(folder_raw, f"{filename}.wav"), format="wav")

    # --- VERSION 2: TRIMMED (Snappy - trimmed, normalized, and faded) ---
    # Using the fix: silence_len=50, padding=10
    trimmed_audio = base_audio.strip_silence(silence_thresh=-50, silence_len=50, padding=10)
    trimmed_audio = normalize(trimmed_audio)
    trimmed_audio = trimmed_audio.fade_in(5).fade_out(5)
    trimmed_audio.export(os.path.join(folder_trimmed, f"{filename}.wav"), format="wav")

    print(f"  ✓ Processed: {filename}.wav")

print("\nSuccess! Both folders are updated with the full set including ligatures.")