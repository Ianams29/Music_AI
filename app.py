from flask import Flask, request, jsonify, send_file
import os
import tempfile
import uuid
import scipy.io.wavfile
from transformers import pipeline

app = Flask(__name__)

# Load model once when server starts
print("Loading MusicGen model...")
synthesiser = pipeline("text-to-audio", "facebook/musicgen-small")
print("Model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'model': 'facebook/musicgen-small'
    })

@app.route('/generate-music', methods=['POST'])
def generate_music():
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Prompt is required'}), 400
        
        prompt = data['prompt']
        duration = min(data.get('duration', 8), 30)  # Max 30 seconds
        
        print(f"Generating music for prompt: '{prompt}' (duration: {duration}s)")
        
        # Generate music
        music = synthesiser(prompt, forward_params={"do_sample": True})
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        file_id = str(uuid.uuid4())
        wav_file = os.path.join(temp_dir, f"music_{file_id}.wav")
        
        # Save audio file
        scipy.io.wavfile.write(wav_file, rate=music["sampling_rate"], data=music["audio"])
        
        if not os.path.exists(wav_file):
            return jsonify({'error': 'Failed to generate audio file'}), 500
        
        return send_file(
            wav_file,
            as_attachment=True,
            download_name=f"generated_music_{file_id}.wav",
            mimetype='audio/wav'
        )
        
    except Exception as e:
        print(f"Error generating music: {str(e)}")
        return jsonify({
            'error': 'Failed to generate music',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)