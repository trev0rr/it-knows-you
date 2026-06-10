// Generative room tone — no audio files. A filtered brown-noise bed
// (empty-room air) and a 55Hz hum pair that beats slowly, like a
// refrigerator in another room. During the threshold, an LFO at
// breathing rate moves the noise filter. The whole bed is mixed so
// low you only notice it when it stops — and it stops, hard, when
// the first story paragraph appears.
//
// Module-level singleton (init once, not per mount).

const LEVEL = 0.05

let ctx = null
let master = null
let breathDepth = null
let started = false
let ended = false
let muted = false

export function startAudio() {
  if (started) return
  started = true
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()

    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    // Brown noise bed -> lowpass -> master
    const seconds = 4
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 320
    noiseFilter.Q.value = 0.4
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.5
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(master)
    noise.start()

    // 55Hz hum + slightly detuned partner — a slow, uneasy beat
    const humGain = ctx.createGain()
    humGain.gain.value = 0.32
    for (const freq of [55, 55.35]) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = 0.5
      osc.connect(g)
      g.connect(humGain)
      osc.start()
    }
    humGain.connect(master)

    // Breathing LFO on the noise filter — dormant until the threshold
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.22
    breathDepth = ctx.createGain()
    breathDepth.gain.value = 0
    lfo.connect(breathDepth)
    breathDepth.connect(noiseFilter.frequency)
    lfo.start()

    // Surface slowly — nothing should announce itself
    master.gain.linearRampToValueAtTime(muted ? 0 : LEVEL, ctx.currentTime + 4)
  } catch {
    started = false
    ctx = null
  }
}

export function setThresholdBreathing(on) {
  if (!ctx || ended || !breathDepth) return
  breathDepth.gain.setTargetAtTime(on ? 90 : 0, ctx.currentTime, 1.5)
}

// The hard cut. The room gets quieter; the reader leans in.
export function cutToSilence() {
  if (!ctx || ended) return
  ended = true
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setValueAtTime(0, ctx.currentTime)
}

export function setMuted(next) {
  muted = next
  if (!ctx || ended) return
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ctx.currentTime, 0.3)
}

export function isMuted() {
  return muted
}

export function isLive() {
  return started && !ended
}
