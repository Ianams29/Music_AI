#!/usr/bin/env python3
import sys
import json
import os
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write

def generate_music(prompt, duration=8, output_path="output.wav"):
    try:
        # Load the model
        model = MusicGen.get_pretrained("small")
        model.set_generation_params(duration=duration)
        
        # Generate music
        wav = model.generate([prompt])
        
        # Save the audio file
        audio_write(output_path.replace('.wav', ''), wav[0].cpu(), model.sample_rate, strategy="loudness")
        
        return {"success": True, "file": f"{output_path.replace('.wav', '')}.wav"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No prompt provided"}))
        sys.exit(1)
    
    prompt = sys.argv[1]
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    output_path = sys.argv[3] if len(sys.argv) > 3 else "output.wav"
    
    result = generate_music(prompt, duration, output_path)
    print(json.dumps(result))