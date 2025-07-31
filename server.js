const express = require('express');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const hf = new HfInference(process.env.HF_TOKEN || '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');

app.post('/generate-music', async (req, res) => {
  try {
    const { prompt, duration = 8 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Generating music for prompt: "${prompt}"`);
    
    const response = await fetch('https://api-inference.huggingface.co/models/suno/bark', {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="generated_music.wav"');
    res.send(audioBuffer);
    
  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ 
      error: 'Failed to generate music',
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', model: 'facebook/musicgen-small' });
});

app.listen(port, () => {
  console.log(`MusicGen server running on port ${port}`);
  console.log('Make sure to set HF_TOKEN environment variable');
  console.log('Example: export HF_TOKEN=your_huggingface_token');
});