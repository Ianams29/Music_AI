// src/components/beat/SampleKit.js
// 깨끗한 드럼 사운드를 위해 샘플 기반 킷(Players) → 실패 시 신스 폴백
import { getTone, ensureAudioStart } from '../../lib/toneCompat';

const dbToGain = (db) => Math.pow(10, db / 20);

// Tone.js GitHub Pages의 경량 드럼 샘플 (CR78 계열)
// 네트워크 문제 시 자동 폴백(신스)로 전환됨.
const SAMPLE_URLS = {
  kick:  "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
  snare: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
  hat:   "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
};

/**
 * createKit({ volume, useSamples })
 * - volume: 마스터 볼륨(dB, 기본 -6)
 * - useSamples: true면 샘플 사용(권장). 로딩 실패시 자동 폴백.
 *
 * 반환
 * { trigger(track, time), setMasterGain(db) }
 */
export async function createKit({ volume = -6, useSamples = true } = {}) {
  const Tone = getTone();
  if (!Tone) throw new Error("Tone not available");

  await ensureAudioStart();

  // 공통 마스터
  const master = new Tone.Gain(dbToGain(volume)).toDestination();

  // ────────────────────────────────────────────────
  // 1) 샘플 킷 (권장): 아주 깔끔하고 CPU 가벼움
  // ────────────────────────────────────────────────
  if (useSamples) {
    try {
      const players = new Tone.Players(
        {
          kick: SAMPLE_URLS.kick,
          snare: SAMPLE_URLS.snare,
          hat: SAMPLE_URLS.hat,
        },
        // onload
        () => {}
      ).connect(master);

      // 로딩 대기 (Tone v14: loaded() Promise 제공)
      if (typeof players.loaded === "function") {
        await players.loaded();
      } else {
        // 일부 빌드에선 loaded() 없을 수 있음 → 약간 대기
        await new Promise((r) => setTimeout(r, 250));
      }

      function trigger(track, time) {
        const p = players.player(track);
        if (!p) return;
        // 시작: 전체 원샷 길이로 재생(필요시 length를 짧게 줄여도 됨)
        p.start(time);
      }

      function setMasterGain(db) {
        master.gain.value = dbToGain(db);
      }

      return { trigger, setMasterGain };
    } catch (e) {
      console.warn("[SampleKit] sample load failed, falling back to synth.", e);
      // 아래 신스 폴백으로 계속 진행
    }
  }

  // ────────────────────────────────────────────────
  // 2) 신스 폴백 킷 (샘플 부재/오프라인 대비)
  // ────────────────────────────────────────────────
  // 짧은 퍼커시브로 '치지직' 최소화
  function triggerKick(time) {
    const osc = new Tone.Oscillator(120, 'sine');
    const amp = new Tone.Gain(0);
    osc.connect(amp).connect(master);
    osc.start(time);

    amp.gain.setValueAtTime(0.001, time);
    amp.gain.exponentialRampToValueAtTime(0.9, time + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.16);

    osc.stop(time + 0.2);
    setTimeout(() => { try { osc.dispose(); amp.dispose(); } catch {} }, 260);
  }

  function triggerSnare(time) {
    if (Tone.Noise) {
      const noise = new Tone.Noise('white');
      const hp = new Tone.Filter(1000, 'highpass');
      const lp = new Tone.Filter(6500, 'lowpass');
      const amp = new Tone.Gain(0);
      noise.connect(hp).connect(lp).connect(amp).connect(master);
      noise.start(time);

      amp.gain.setValueAtTime(0.001, time);
      amp.gain.exponentialRampToValueAtTime(0.8, time + 0.003);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

      noise.stop(time + 0.1);
      setTimeout(() => { try { noise.dispose(); hp.dispose(); lp.dispose(); amp.dispose(); } catch {} }, 200);
    }
  }

  function triggerHat(time) {
    if (Tone.Noise) {
      const noise = new Tone.Noise('white');
      const hp = new Tone.Filter(9000, 'highpass');
      const amp = new Tone.Gain(0);
      noise.connect(hp).connect(amp).connect(master);
      noise.start(time);

      amp.gain.setValueAtTime(0.001, time);
      amp.gain.exponentialRampToValueAtTime(0.5, time + 0.0015);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

      noise.stop(time + 0.035);
      setTimeout(() => { try { noise.dispose(); hp.dispose(); amp.dispose(); } catch {} }, 100);
    }
  }

  function trigger(track, time) {
    if (track === 'kick') return triggerKick(time);
    if (track === 'snare') return triggerSnare(time);
    if (track === 'hat') return triggerHat(time);
  }

  function setMasterGain(db) {
    master.gain.value = dbToGain(db);
  }

  return { trigger, setMasterGain };
}

export default createKit;
