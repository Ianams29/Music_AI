// src/components/beat/BeatGrid.jsx
import React from 'react';
import { Box } from '@mui/material';

const tracks = ['kick', 'snare', 'hat'];

export default function BeatGrid({ pattern, currentStep, onToggle }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(16, 1fr)', gap: 1.25 }}>
      {/* 헤더 */}
      <Box />
      {Array.from({ length: 16 }).map((_, i) => (
        <Box key={`h${i}`} sx={{
          textAlign: 'center', fontSize: '0.875rem', color: '#aaa'
        }}>{i + 1}</Box>
      ))}

      {tracks.map((t) => (
        <React.Fragment key={t}>
          <Box sx={{ color: '#ddd', fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: '1rem' }}>{labelOf(t)}</Box>
          {pattern[t].map((on, step) => {
            const isNow = step === currentStep;
            return (
              <Box
                key={`${t}-${step}`}
                onClick={() => onToggle(t, step)}
                sx={{
                  cursor: 'pointer',
                  height: 44,
                  borderRadius: 1.5,
                  border: '1px solid #333',
                  bgcolor: on ? (isNow ? '#2DD4BF' : '#1e8f7e') : (isNow ? '#333' : '#111'),
                  boxShadow: on ? '0 0 8px rgba(45,212,191,0.35)' : 'none',
                  transition: 'background-color .12s, box-shadow .12s',
                }}
              />
            );
          })}
        </React.Fragment>
      ))}
    </Box>
  );
}

function labelOf(key) {
  if (key === 'kick') return 'Kick';
  if (key === 'snare') return 'Snare';
  if (key === 'hat') return 'Hi-Hat';
  return key;
}