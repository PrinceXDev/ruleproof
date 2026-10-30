"""Generate narration with the offline Windows voice (System.Speech) and write src/generated/vo.json.
To use your own recordings, drop WAV files named public/vo/<id>.wav and run with --keep."""
import array, json, os, re, subprocess, sys, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = "Microsoft David Desktop"
RATE = 2  # -10..10
KEEP = "--keep" in sys.argv
tl = json.load(open(os.path.join(ROOT, "timeline.json")))
FPS = tl["fps"]
out = []

PS = r'''
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice($env:RP_VOICE)
$s.Rate = [int]$env:RP_RATE
$s.SetOutputToWaveFile($env:RP_OUT, (New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(44100, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)))
$s.Speak($env:RP_TEXT)
$s.Dispose()
'''

for item in tl["voice"]:
    path = os.path.join(ROOT, "public", "vo", item["id"] + ".wav")
    text = item["text"].replace("[pause]", ",")
    if not (KEEP and os.path.exists(path)):
        env = dict(os.environ, RP_VOICE=VOICE, RP_RATE=str(RATE), RP_OUT=path, RP_TEXT=text)
        subprocess.run(["powershell", "-NoProfile", "-Command", PS], env=env, check=True)
    with wave.open(path) as w:
        sr, nch = w.getframerate(), w.getnchannels()
        dur = w.getnframes() / sr
        pcm = array.array("h", w.readframes(w.getnframes()))
    # loudness envelope, one value per video frame, drives the speaking animation
    hop = int(sr * nch / FPS)
    rms = [(sum(x * x for x in pcm[i:i + hop]) / max(1, len(pcm[i:i + hop]))) ** 0.5 for i in range(0, len(pcm), hop)]
    ref = sorted(rms)[int(len(rms) * 0.95)] or 1
    envl = [round(min(1.0, r / ref), 2) for r in rms]
    # SAPI exposes no word timings offline; spread words by character weight across the clip
    words = text.split()
    weights = [len(re.sub(r"\W", "", x)) + 2 for x in words]
    total, t, timed = sum(weights), 0.0, []
    for x, wgt in zip(words, weights):
        d = dur * wgt / total
        timed.append({"w": x, "s": round(t, 3), "e": round(t + d, 3)})
        t += d
    scene = tl["scenes"].get(item["scene"]) or tl["long"]["scenes"][item["scene"]]
    out.append({"id": item["id"], "file": "vo/%s.wav" % item["id"], "scene": item["scene"],
                "start": scene["from"] + item["offset"], "offset": item["offset"], "durationSec": round(dur, 3),
                "durationFrames": int(dur * FPS) + 1, "words": timed, "env": envl})
    print(item["id"], round(dur, 2), "s | scene window", round(scene["dur"] / FPS - item["offset"] / FPS, 1), "s")

json.dump(out, open(os.path.join(ROOT, "src", "generated", "vo.json"), "w"), indent=1)
