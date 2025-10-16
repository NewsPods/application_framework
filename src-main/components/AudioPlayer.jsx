import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:3000";

function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [currentKey, setCurrentKey] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef(null);

    const src = useMemo(() => {
        return currentKey ? `${API_BASE}/stream?key=${encodeURIComponent(currentKey)}` : undefined;
    }, [currentKey]);

    // fetch the list of audios
    useEffect(() => {
        async function loadList() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/audios`, { cache: "no-store" });
                if (!res.ok) throw new Error(`Failed to load audios: ${res.status}`);
                const data = await res.json();
                const list = (data.files || []).filter(f =>
                    (f.contentType || "").startsWith("audio/")
                );
                setFiles(list);
                if (list.length && !currentKey) {
                    setCurrentKey(list[0].key);
                }
            } catch (e) {
                setError(e.message || "Failed to fetch audio list");
            } finally {
                setLoading(false);
            }
        }
        loadList();
    }, []);

    // wire audio events
    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;

        function onLoaded() {
            setDuration(el.duration || 0);
        }
        function onTime() {
            setCurrentTime(el.currentTime || 0);
        }
        function onPlay() {
            setIsPlaying(true);
        }
        function onPause() {
            setIsPlaying(false);
        }
        function onEnded() {
            setIsPlaying(false);
        }

        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("timeupdate", onTime);
        el.addEventListener("play", onPlay);
        el.addEventListener("pause", onPause);
        el.addEventListener("ended", onEnded);

        return () => {
            el.removeEventListener("loadedmetadata", onLoaded);
            el.removeEventListener("timeupdate", onTime);
            el.removeEventListener("play", onPlay);
            el.removeEventListener("pause", onPause);
            el.removeEventListener("ended", onEnded);
        };
    }, [src]);

    function play() {
        const el = audioRef.current;
        if (!el) return;
        el.play().catch(e => console.error("play() failed:", e));
    }

    function pause() {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }

    function togglePlayPause() {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }

    function skip(delta) {
        const el = audioRef.current;
        if (!el) return;
        const newTime = el.currentTime + delta;
        if (newTime < 0) {
            el.currentTime = 0;
        } else if (el.duration && newTime > el.duration) {
            el.currentTime = el.duration;
        } else {
            el.currentTime = newTime;
        }
    }

    function onSeek(e) {
        const el = audioRef.current;
        if (!el) return;
        const t = Number(e.target.value);
        el.currentTime = t;
    }

    function onSelectTrack(key) {
        setCurrentKey(key);
        // optionally auto-play when switching
        setTimeout(() => {
            play();
        }, 0);
    }

    return (
        <div style={{ maxWidth: 720, margin: "24px auto", fontFamily: "sans-serif" }}>
            <h2>Newspods Player</h2>

            {loading && <p>Loading audio list…</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 2 }}>
                    <label>Select track:</label>
                    <select
                        value={currentKey || ""}
                        onChange={e => onSelectTrack(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", margin: "6px 0 12px" }}
                    >
                        {files.map(f => (
                            <option key={f.key} value={f.key}>
                                {f.name || f.key}
                            </option>
                        ))}
                    </select>

                    <audio
                        ref={audioRef}
                        src={src}
                        preload="metadata"
                        style={{ width: "100%" }}
                        controls={false}  // we’re building custom controls
                    />

                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        <button onClick={() => skip(-10)}>« 10s</button>
                        <button onClick={togglePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
                        <button onClick={() => skip(10)}>10s »</button>
                        <div style={{ marginLeft: "auto" }}>
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </div>
                    </div>

                    <input
                        type="range"
                        min={0}
                        max={duration ? duration : 0}
                        step={0.01}
                        value={currentTime}
                        onChange={onSeek}
                        style={{ width: "100%", marginTop: 10 }}
                    />
                </div>

                <div style={{ flex: 1, borderLeft: "1px solid #ccc", paddingLeft: 12 }}>
                    <div style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>Tracks</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 300, overflowY: "auto" }}>
                        {files.map(f => (
                            <li key={f.key} style={{ marginBottom: 6 }}>
                                <button
                                    onClick={() => onSelectTrack(f.key)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        color: currentKey === f.key ? "blue" : "black"
                                    }}
                                >
                                    {f.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
                Tip: Scrub anywhere — your backend supports HTTP Range for near-instant seeking.
            </p>
        </div>
    );
}
