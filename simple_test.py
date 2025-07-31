#!/usr/bin/env python3

print("Testing MusicGen import...")

try:
    from transformers import pipeline
    print("✓ transformers imported")
    
    import scipy.io.wavfile
    print("✓ scipy imported")
    
    print("Loading MusicGen model...")
    synthesiser = pipeline("text-to-audio", "facebook/musicgen-small")
    print("✓ Model loaded successfully!")
    
    print("Generating test music...")
    music = synthesiser("happy upbeat melody", forward_params={"do_sample": True})
    print("✓ Music generated!")
    
    print("Saving audio file...")
    scipy.io.wavfile.write("test_output.wav", rate=music["sampling_rate"], data=music["audio"])
    print("✓ Audio saved to test_output.wav")
    
    print("🎵 SUCCESS: MusicGen is working!")
    
except Exception as e:
    print(f"❌ ERROR: {e}")