import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, FormControl, Select, MenuItem, Stack,
  Switch, FormControlLabel, Tooltip, Chip
} from '@mui/material';
import { PRESETS, clonePattern } from './presets';
import { loadDrumsVAE, encodeCorners, decodeAtPosition } from '../../lib/drumsVAE';
import { generate4PointGradient, toCSSString } from '../../lib/beatblender/color';

// ── 코너 색 (모듈 레벨 상수: deps 경고 없음) ─────────────────────────────
const DEFAULT_CORNER_COLORS = {
  A: [255, 72, 88, 1],    // top-left
  B: [72, 160, 255, 1],   // top-right
  C: [88, 232, 160, 1],   // bottom-left
  D: [255, 216, 88, 1],   // bottom-right
};

const weights = (x, y) => ({
  A: (1 - x) * (1 - y),
  B: x * (1 - y),
  C: (1 - x) * y,
  D: x * y,
});

function blendPatterns(corners, x, y, thresh = 0.5) {
  const w = weights(x, y);
  const tracks = ['kick', 'snare', 'hat'];
  const out = {};
  tracks.forEach((t) => {
    out[t] = Array.from({ length: 16 }, (_, i) => {
      const v =
        w.A * (corners.A[t][i] ? 1 : 0) +
        w.B * (corners.B[t][i] ? 1 : 0) +
        w.C * (corners.C[t][i] ? 1 : 0) +
        w.D * (corners.D[t][i] ? 1 : 0);
      return v >= thresh;
    });
  });
  return out;
}

function useDebouncedCallback(fn, delay = 120) {
  const tRef = useRef(null);
  return (...args) => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => fn(...args), delay);
  };
}

export default function BlendPad({ colors, corners, onChangeCorners, onBlend }) {
  const padRef = useRef(null);
  const canvasRef = useRef(null);
  const [pos, setPos] = useState({ x: 0.2, y: 0.3 });
  const [dragging, setDragging] = useState(false);

  const [sel, setSel] = useState({ A: '', B: '', C: '', D: '' });
  const presetNames = useMemo(() => Object.keys(PRESETS), []);

  const [useML, setUseML] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [encoded, setEncoded] = useState(null);
  const [decoding, setDecoding] = useState(false);

  // 모델 로딩
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadDrumsVAE();
        if (mounted) setModelReady(true);
      } catch (e) {
        console.warn('[BlendPad] VAE load failed, fallback to simple blend.', e);
        if (mounted) {
          setModelReady(false);
          setUseML(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 코너 변경 시 인코딩
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!useML || !modelReady) return;
      try {
        const enc = await encodeCorners(corners);
        if (!cancelled) setEncoded(enc);
      } catch (e) {
        console.warn('[BlendPad] encode failed, fallback to simple blend.', e);
        if (!cancelled) {
          setEncoded(null);
          setUseML(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [corners, useML, modelReady]);

  const getXY = (clientX, clientY) => {
    const el = padRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    return { x, y };
  };

  // 디코드 (디바운스)
  const debouncedDecode = useDebouncedCallback(async (p) => {
    if (!useML || !modelReady || !encoded) return;
    setDecoding(true);
    try {
      const pat = await decodeAtPosition(encoded, p.x, p.y, 0.85);
      onBlend(pat);
    } catch (e) {
      console.warn('[BlendPad] decode failed, fallback to simple blend.', e);
      onBlend(blendPatterns(corners, p.x, p.y));
    } finally {
      setDecoding(false);
    }
  }, 120);

  const startDrag = (e) => {
    const p = getXY(e.clientX, e.clientY);
    if (!p) return;
    setDragging(true);
    setPos(p);
    if (useML && modelReady && encoded) debouncedDecode(p);
    else onBlend(blendPatterns(corners, p.x, p.y));
  };

  // 드래그 리스너
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      const p = getXY(e.clientX, e.clientY);
      if (!p) return;
      setPos(p);
      if (useML && modelReady && encoded) debouncedDecode(p);
      else onBlend(blendPatterns(corners, p.x, p.y));
    };
    const onUp = () => setDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, useML, modelReady, encoded, corners, onBlend, debouncedDecode]);

  useEffect(() => () => setDragging(false), []);

  const handlePreset = (key, name) => {
    if (!name) return;
    const next = {
      A: clonePattern(corners.A),
      B: clonePattern(corners.B),
      C: clonePattern(corners.C),
      D: clonePattern(corners.D),
    };
    next[key] = clonePattern(PRESETS[name]);
    onChangeCorners(next);
    setSel((s) => ({ ...s, [key]: '' }));
    const p = pos;
    onBlend(blendPatterns(next, p.x, p.y));
  };

  // ── 캔버스 4-포인트 그라데이션 ──────
  useEffect(() => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;

    const rect = pad.getBoundingClientRect();
    const w = Math.max(2, Math.floor(rect.width));
    const h = Math.max(2, Math.floor(rect.height));
    const ctx = canvas.getContext('2d');

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COLS = 56;
    const ROWS = 56;

    const tl = DEFAULT_CORNER_COLORS.A;
    const tr = DEFAULT_CORNER_COLORS.B;
    const bl = DEFAULT_CORNER_COLORS.C;
    const br = DEFAULT_CORNER_COLORS.D;

    const grid = generate4PointGradient(tl, tr, bl, br, COLS, ROWS);
    const cw = w / COLS;
    const ch = h / ROWS;

    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillStyle = toCSSString(grid[x][y]);
        ctx.fillRect(Math.floor(x * cw), Math.floor(y * ch), Math.ceil(cw) + 1, Math.ceil(ch) + 1);
      }
    }
  }, [pos, sel, corners]);

  const Status = () => (
    <Tooltip
      title={modelReady ? 'AI가 코너 프리셋을 학습해 중간 지점을 더 음악적으로 보간해요.' : '모델이 준비되면 더 자연스러운 보간이 가능해요.'}
      arrow
      placement="right"
    >
      <Chip
        label={modelReady ? 'AI 보간 켜짐' : 'AI 보간 준비 중'}
        size="small"
        sx={{
          ml: 1,
          bgcolor: modelReady ? 'rgba(70,180,120,.15)' : 'rgba(180,180,180,.12)',
          color: modelReady ? '#7be1ad' : '#bdbdbd',
          border: theme => `1px solid ${theme.palette.divider}`,
          '& .MuiChip-label': { px: .75 }
        }}
      />
    </Tooltip>
  );

  return (
    <Stack spacing={1.75}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
          패드 블렌딩
        </Typography>
        <Box sx={{ display:'flex', alignItems:'center' }}>
          <FormControlLabel
            control={<Switch checked={useML && modelReady} onChange={(e)=>setUseML(e.target.checked)} />}
            label=""
            sx={{ mr: .5 }}
          />
          <Status />
        </Box>
      </Box>

      <Box
        ref={padRef}
        onMouseDown={startDrag}
        sx={{
          position: 'relative',
          width: '100%', aspectRatio: '1 / 1',
          borderRadius: 2, border: `1px solid ${colors.border}`,
          overflow: 'hidden', userSelect: 'none', cursor: 'pointer',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,.35)'
        }}
        title="패드에서 드래그해 프리셋을 섞어보세요"
        role="application"
        aria-label="블렌딩 패드"
      >
        {/* 캔버스 배경 */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, display: 'block' }}
          aria-hidden
        />

        {/* 그리드 오버레이: 더 옅게 */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(#0000 96%, rgba(255,255,255,0.035) 96%),' +
            'linear-gradient(90deg, #0000 96%, rgba(255,255,255,0.035) 96%)',
          backgroundSize: '20px 20px', pointerEvents: 'none'
        }} />

        {/* 코너 라벨 */}
        <CornerLabel pos="topLeft" label="A" colors={colors} />
        <CornerLabel pos="topRight" label="B" colors={colors} />
        <CornerLabel pos="bottomLeft" label="C" colors={colors} />
        <CornerLabel pos="bottomRight" label="D" colors={colors} />

        {/* puck */}
        <Box sx={{
          position: 'absolute', width: 18, height: 18,
          borderRadius: '50%', border: '2px solid white', background: colors.accent,
          left: `calc(${pos.x * 100}% - 9px)`, top: `calc(${pos.y * 100}% - 9px)`,
          boxShadow: `0 0 20px ${colors.shadow}`, pointerEvents: 'none'
        }} />

        {decoding && (
          <Box sx={{
            position:'absolute', right:8, bottom:8,
            fontSize:12, color: colors.textLight, bgcolor:'rgba(0,0,0,.35)',
            border:`1px solid ${colors.border}`, borderRadius:1, px:1, py:.25
          }}>
            AI 보간 중...
          </Box>
        )}
      </Box>

      {/* 코너 프리셋 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {(['A','B','C','D']).map((k) => (
          <FormControl key={k} size="small" sx={{ bgcolor:'#101010', borderRadius: 1.25, px: .5, py: .4 }}>
            <Typography sx={{ color: colors.textLight, fontSize: 12, mb: .5, mx: .5 }}>
              Corner {k}
            </Typography>
            <Select
              aria-label={`코너 ${k} 프리셋 선택`}
              value={sel[k]}
              displayEmpty
              renderValue={() => '프리셋 선택'}
              onChange={(e)=> handlePreset(k, e.target.value)}
              sx={{
                color:'#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent }
              }}
              MenuProps={{ PaperProps: { sx: { bgcolor:'#0f0f0f', color:'#fff' } } }}
            >
              {presetNames.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Box>
    </Stack>
  );
}

function CornerLabel({ pos, label, colors }) {
  const style = {
    position: 'absolute', color: colors.textLight, fontSize: 12,
    px: .75, py: .25, borderRadius: 1, bgcolor: 'rgba(0,0,0,.35)', border: `1px solid ${colors.border}`
  };
  const map = {
    topLeft: { left: 8, top: 6 },
    topRight: { right: 8, top: 6 },
    bottomLeft: { left: 8, bottom: 6 },
    bottomRight: { right: 8, bottom: 6 },
  };
  return <Box sx={{ ...style, ...map[pos] }}>{label}</Box>;
}
