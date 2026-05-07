import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* 3D */
function MarsTerrain() {
  const { scene } = useGLTF('./mars_landscape.glb');

  React.useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        if (mat.color) {
          mat.color.setHex(0xC15A2E);
        }
        if (mat.roughness !== undefined) mat.roughness = 0.95;
        if (mat.metalness !== undefined) mat.metalness = 0.05;
        if (mat.emissive) {
          mat.emissive.setHex(0x3A1F0F);
          mat.emissiveIntensity = 0.18;
        }
      }
    });
  }, [scene]);

  return (
    <group position={[0, -50, 0]}>
      <primitive object={scene} scale={50} />
    </group>
  );
}

function ScanLine() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.z = Math.sin(clock.getElapsedTime() * 0.4) * 45;
  });
  return (
    <mesh ref={ref} position={[0, 4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 0.12]} />
      <meshBasicMaterial color="#ff9988" transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ScanRing({ totalArea }) {
  const ref = useRef();
  const radius = 8 + (totalArea / 100) * 38;
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 1.6) * 0.07;
  });
  return (
    <mesh ref={ref} position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <ringGeometry args={[radius - 1, radius, 80]} />
      <meshBasicMaterial 
        color="#ff6655" 
        transparent 
        opacity={0.18} 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        depthTest={false} 
      />
    </mesh>
  );
}

function DroneBody() {
  const ref = useRef();
  let scene = null;
  try { scene = useGLTF('./dron.glb').scene; } catch { }
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 80 + Math.sin(clock.getElapsedTime() * 1.8) * 0.6;
  });
  return (
    <group ref={ref} position={[0, 80, 0]}>
      {scene && <primitive object={scene} scale={5} />}
      <spotLight position={[0, -1, 0]} angle={Math.PI / 3.5} penumbra={0.6}
        intensity={3.5} color="#ffaa99" castShadow />
      <pointLight position={[0, 0, 0]} intensity={1.3} color="#ff6655" distance={28} />
    </group>
  );
}

function DroneController({ totalArea, controlsRef }) {
  const groupRef = useRef();
  const keys = useRef({ w:false,a:false,s:false,d:false,q:false,e:false,
    ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false });

  useEffect(() => {
    const skip = e => ['input','textarea'].includes(e.target.tagName.toLowerCase());
    const dn = e => { if (skip(e)) return; const k=e.key,lk=k.toLowerCase(); 
      if(k in keys.current)keys.current[k]=true; else if(lk in keys.current)keys.current[lk]=true; };
    const up = e => { if (skip(e)) return; const k=e.key,lk=k.toLowerCase(); 
      if(k in keys.current)keys.current[k]=false; else if(lk in keys.current)keys.current[lk]=false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((state, delta) => {
    const sp = 38 * delta;
    let dx=0,dz=0,dy=0;
    if (keys.current.w||keys.current.ArrowUp)    dz -= sp;
    if (keys.current.s||keys.current.ArrowDown)  dz += sp;
    if (keys.current.a||keys.current.ArrowLeft)  dx -= sp;
    if (keys.current.d||keys.current.ArrowRight) dx += sp;
    if (keys.current.q) dy -= sp;
    if (keys.current.e) dy += sp;

    if (dx||dz||dy) {
      groupRef.current.position.x += dx;
      groupRef.current.position.z += dz;
      groupRef.current.position.y += dy;
      if (controlsRef.current) {
        controlsRef.current.target.x += dx;
        controlsRef.current.target.z += dz;
        controlsRef.current.target.y += dy;
        state.camera.position.x += dx;
        state.camera.position.z += dz;
        state.camera.position.y += dy;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <ScanRing totalArea={totalArea} />
      <Suspense fallback={null}><DroneBody /></Suspense>
    </group>
  );
}

/*  Rojo opaco */
const T = {
  bg: '#000000',
  bgSurface: 'rgba(10, 10, 10, 0.75)',
  border: 'rgba(255, 255, 255, 0.06)',
  accent: '#C14A38',
  accentDim: 'rgba(193, 74, 56, 0.14)',
  textMax: '#FFFFFF',
  textPrimary: 'rgba(255, 255, 255, 0.92)',
  textSecondary: 'rgba(255, 255, 255, 0.55)',
  textTertiary: 'rgba(255, 255, 255, 0.25)',
  blue: '#5b8aff',
  teal: '#34d0a4',
  rose: '#f06090',
  amber: '#f0a844',
  purple: '#9b7aff',
  sans: "'Inter', 'SF Pro Display', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  serif: "'Cormorant Garamond', 'Times New Roman', serif",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes breathe { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.accentDim}; border-radius: 100px; }
  input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; cursor: pointer; }
  input[type=range]::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; border: none; cursor: pointer; }
`;

function GlassPanel({ children, style = {} }) {
  return (
    <div style={{
      background: T.bgSurface,
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.4, 1)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function EyeBrow({ children }) {
  return (
    <div style={{
      fontFamily: T.mono,
      fontSize: 8,
      fontWeight: 400,
      letterSpacing: '0.2em',
      color: T.textTertiary,
      textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function SliderGold({ label, value, min, max, onChange, unit, color = T.accent }) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <EyeBrow>{label}</EyeBrow>
        <span style={{ fontFamily: T.mono, fontSize: 10, color }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 1,
          background: `linear-gradient(to right, ${color} ${percent}%, ${T.border} ${percent}%)`,
          cursor: 'pointer',
          outline: 'none',
        }}
      />
    </div>
  );
}

function StatusDot({ color, blink = false, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%', background: color,
        animation: blink ? 'breathe 1.5s infinite' : 'none',
      }} />
      <span style={{ fontFamily: T.mono, fontSize: 9, color }}>{children}</span>
    </div>
  );
}

function MetricCard({ label, value, unit, subtitle }) {
  return (
    <GlassPanel style={{ padding: '14px 18px' }}>
      <EyeBrow>{label}</EyeBrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, color: T.textMax }}>{value}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textSecondary }}>{unit}</span>
      </div>
      {subtitle && <div style={{ fontFamily: T.mono, fontSize: 8, color: T.accent, marginTop: 6 }}>{subtitle}</div>}
    </GlassPanel>
  );
}

function Spin({ size = 14, color = T.accent }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1.5px solid ${color}22`, borderTop: `1.5px solid ${color}`,
      animation: 'spin 0.85s linear infinite', display: 'inline-block'
    }} />
  );
}

function HudTag({ children, color = T.textTertiary }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
      border: `1px solid ${T.border}`, borderRadius: 99,
      fontFamily: T.mono, fontSize: 8.5, fontWeight: 400, letterSpacing: '0.16em',
      color, whiteSpace: 'nowrap',
    }}>
      {children}
    </div>
  );
}

/* MAIN DASHBOARD */
export default function Dashboard({ totalArea, setTotalArea }) {
  const [temperature, setTemperature] = useState(-15);
  const [humidity, setHumidity] = useState(15);
  const [pressure, setPressure] = useState(600);
  const [currentWater, setCurrentWater] = useState(2500000);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeView, setActiveView] = useState('vision3d');
  const [showVisionCard, setShowVisionCard] = useState(true);
  const audioRef = useRef(null);
  const controlsRef = useRef();

  async function handleCalculate() {
    setIsCalculating(true); setResult(null);
    audioRef.current?.pause(); setIsPlayingAudio(false);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/api/analizar-terreno`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, humidity, pressure, totalArea, currentWater }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.audioBase64) {
          const audio = new Audio('data:audio/mp3;base64,' + data.audioBase64);
          audioRef.current = audio; audio.play(); setIsPlayingAudio(true);
          audio.onended = () => setIsPlayingAudio(false);
        }
        setActiveView('results');
      } else {
        setResult({ aguaRequeridaLitros: 0, explicacion: 'Error del servidor.', estado: 'OPTIMO' });
        setActiveView('results');
      }
    } catch {
      setResult({ aguaRequeridaLitros: 0, explicacion: 'Sin conexión.', estado: 'OPTIMO' });
      setActiveView('results');
    }
    setIsCalculating(false);
  }

  async function handleChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const msg = { role: 'user', content: chatInput.trim() };
    setChatMsgs(p => [...p, msg]); setChatInput(''); setIsChatLoading(true);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMsgs, msg],
          telemetry: { temperature, humidity, pressure, totalArea, currentWater, requiredWater: result?.aguaRequeridaLitros || 0 },
        }),
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: 'assistant', content: res.ok ? data.response : 'Error de comunicación.' }]);
    } catch {
      setChatMsgs(p => [...p, { role: 'assistant', content: 'Sin señal.' }]);
    }
    setIsChatLoading(false);
  }

  const STATUS = {
    INSUFICIENTE: { label: 'Insuficiente', color: T.rose },
    EXCESIVO: { label: 'Excesivo', color: T.amber },
    OPTIMO: { label: 'Óptimo', color: T.teal },
  };
  const st = result ? (STATUS[result.estado] || STATUS.OPTIMO) : null;
  const pct = result?.aguaRequeridaLitros > 0 ? Math.min((currentWater / result.aguaRequeridaLitros) * 100, 100) : 100;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: T.bg }}>
      <style>{globalStyles}</style>

      {/* Ambient gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(193,74,56,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* 3D CANVAS */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Canvas shadows camera={{ position: [0, 85, 22], fov: 48 }}>
          <color attach="background" args={['#1a0f08']} />
          <fog attach="fog" args={['#1a0f08', 80, 280]} />
          <ambientLight intensity={0.13} color="#ffaa77" />
          <directionalLight position={[120, 80, 60]} intensity={0.68} color="#ffccaa" castShadow />
          <pointLight position={[-60, 40, -60]} intensity={0.75} color="#ff7744" distance={190} />
          <pointLight position={[60, 25, 60]} intensity={0.4} color="#aa6644" distance={130} />
          <Stars radius={130} depth={65} count={8000} factor={3} saturation={0} fade speed={0.3} />
          <ScanLine />
          <DroneController totalArea={totalArea} controlsRef={controlsRef} />
          <Suspense fallback={null}><MarsTerrain /></Suspense>
          <OrbitControls ref={controlsRef} enablePan={false}
            maxPolarAngle={Math.PI / 2 - 0.04} minDistance={5} maxDistance={115} target={[0, 80, 0]} />
        </Canvas>
      </div>

      {/* CRT scanlines */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.018) 3px,rgba(0,0,0,0.018) 4px)' }} />

      {/* HUD OVERLAYS */}
      <div style={{ position: 'absolute', top: 90, left: 24, zIndex: 20, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <HudTag color={T.rose}>● REC</HudTag>
        <HudTag>ALT 80.4 m</HudTag>
        <HudTag>ESCANEO · MULTIESPECTRAL</HudTag>
        <HudTag color={T.accent}>WASD + Q/E — MOVER DRON</HudTag>
      </div>

      <div style={{ position: 'absolute', top: 90, right: 24, zIndex: 20, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end' }}>
        <HudTag>VALLES MARINERIS · B-42</HudTag>
        <HudTag>14.5°S · 55.7°W</HudTag>
      </div>

      <div style={{ position: 'absolute', bottom: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
        <HudTag>ÁREA {totalArea} km² · E1 {(totalArea * 0.5).toFixed(1)} km² · E2 {(totalArea * 0.5).toFixed(1)} km²</HudTag>
      </div>

      {/* Corner brackets */}
      {[{ top: 76, left: 14 }, { top: 76, right: 14 }, { bottom: 14, left: 14 }, { bottom: 14, right: 14 }].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, zIndex: 20, pointerEvents: 'none', width: 12, height: 12,
          borderTop: pos.top !== undefined ? `1px solid ${T.accentDim}` : 'none',
          borderBottom: pos.bottom !== undefined ? `1px solid ${T.accentDim}` : 'none',
          borderLeft: pos.left !== undefined ? `1px solid ${T.accentDim}` : 'none',
          borderRight: pos.right !== undefined ? `1px solid ${T.accentDim}` : 'none',
        }} />
      ))}

      {/* SIDEBAR */}
      <aside style={{ position: 'absolute', left: 20, top: 20, bottom: 20, width: 180, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GlassPanel style={{ padding: '20px 16px' }}>
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.textMax, letterSpacing: '-0.02em' }}>A.R.E.S.</span>
            <EyeBrow>MARS MISSION</EyeBrow>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'vision3d', label: 'Visión 3D', icon: '◈' },
              { id: 'controls', label: 'Sistema', icon: '◎' },
              { id: 'results', label: 'Análisis', icon: '⌭' },
              { id: 'chat', label: 'DaLiA', icon: '◍' },
            ].map(item => (
              <button key={item.id} onClick={() => {
                setActiveView(item.id);
                if (item.id !== 'vision3d') setShowVisionCard(false);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', width: '100%',
                background: activeView === item.id ? T.accentDim : 'transparent',
                border: activeView === item.id ? `1px solid ${T.accentDim}` : '1px solid transparent',
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                color: activeView === item.id ? T.accent : T.textSecondary,
                fontFamily: T.sans, fontSize: 12, fontWeight: activeView === item.id ? 500 : 400,
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </GlassPanel>

        <GlassPanel style={{ padding: '14px 16px' }}>
          <StatusDot color={T.teal} blink>SISTEMA ACTIVO</StatusDot>
          <div style={{ marginTop: 10, fontFamily: T.mono, fontSize: 8, color: T.textTertiary }}>UPTIME 47d · 12h</div>
        </GlassPanel>
      </aside>

      {/* RIGHT PANEL */}
      <div style={{ position: 'absolute', right: 20, top: 20, bottom: 20, width: 230, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GlassPanel style={{ padding: '16px 18px' }}>
          <EyeBrow>Telemetría</EyeBrow>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textTertiary }}>Temperatura</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.rose }}>{temperature}°C</span>
              </div>
              <div style={{ height: 1, background: T.border, marginTop: 4 }}>
                <div style={{ height: 1, width: `${((temperature + 80) / 100) * 100}%`, background: T.rose }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textTertiary }}>Humedad</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue }}>{humidity}%</span>
              </div>
              <div style={{ height: 1, background: T.border, marginTop: 4 }}>
                <div style={{ height: 1, width: `${humidity}%`, background: T.blue }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textTertiary }}>Presión</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.purple }}>{pressure} Pa</span>
              </div>
              <div style={{ height: 1, background: T.border, marginTop: 4 }}>
                <div style={{ height: 1, width: `${((pressure - 100) / 900) * 100}%`, background: T.purple }} />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: '16px 18px' }}>
          <EyeBrow>Reservas</EyeBrow>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 400, color: T.blue }}>{(currentWater / 1_000_000).toFixed(2)}</span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textTertiary, marginLeft: 6 }}>M L</span>
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: '16px 18px' }}>
          <EyeBrow>Estado</EyeBrow>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatusDot color={T.teal} blink>Motor IA online</StatusDot>
            <StatusDot color={T.teal}>Sensores nominal</StatusDot>
            <StatusDot color={T.amber}>Dron en vuelo</StatusDot>
            {isPlayingAudio && (
              <button onClick={() => { audioRef.current?.pause(); setIsPlayingAudio(false); }}
                style={{ marginTop: 6, background: 'rgba(240,96,144,0.1)', border: `1px solid ${T.rose}33`, borderRadius: 30, padding: '4px 8px', color: T.rose, fontFamily: T.mono, fontSize: 8, cursor: 'pointer' }}>
                ✕ SILENCIAR
              </button>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ position: 'absolute', left: 220, right: 270, top: 20, zIndex: 15 }}>

        {/* VISION 3D */}
        {activeView === 'vision3d' && showVisionCard && (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', justifyContent: 'center', marginTop: '160px' }}>
            <GlassPanel style={{ padding: '28px 36px', maxWidth: 400, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
              <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.textMax, marginBottom: 12 }}>
                Modo Visión 3D
              </h2>
              <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textSecondary, lineHeight: 1.5, marginBottom: 20 }}>
                El dron está en vuelo autónomo sobre la superficie marciana rojiza.
                Puedes controlarlo con las teclas <strong style={{ color: T.accent }}>WASD</strong> y 
                <strong style={{ color: T.accent }}> Q/E</strong>.
              </p>
              <button
                onClick={() => setShowVisionCard(false)}
                style={{
                  width: '100%', background: T.accentDim, border: `1px solid ${T.accent}`,
                  borderRadius: 40, padding: '10px 0', color: T.textMax,
                  fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
              >
                ACEPTAR
              </button>
            </GlassPanel>
          </div>
        )}

        {/* CONTROLS  */}
        {activeView === 'controls' && (
          <GlassPanel style={{ padding: '28px 32px', width: 400 }}>
            <h2 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 400, color: T.textMax, marginBottom: 24 }}>
              Configuración del sistema
            </h2>
            <SliderGold label="Cuadrante total" value={totalArea} min={1} max={100} onChange={setTotalArea} unit=" km²" />
            <SliderGold label="Temperatura" value={temperature} min={-80} max={20} onChange={setTemperature} unit="°C" color={T.rose} />
            <SliderGold label="Humedad" value={humidity} min={0} max={100} onChange={setHumidity} unit="%" color={T.blue} />
            <SliderGold label="Presión" value={pressure} min={100} max={1000} step={10} onChange={setPressure} unit=" Pa" color={T.purple} />
            
            <div style={{ marginBottom: 24 }}>
              <EyeBrow>Reservas de agua (L)</EyeBrow>
              <input type="number" value={currentWater} onChange={e => setCurrentWater(Number(e.target.value))} style={{
                width: '100%', marginTop: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '10px 14px', color: T.textMax, fontFamily: T.mono, fontSize: 13, outline: 'none',
              }} />
            </div>
            
            <button onClick={handleCalculate} disabled={isCalculating} style={{
              width: '100%', background: isCalculating ? 'rgba(255,255,255,0.03)' : T.accentDim,
              border: `1px solid ${T.accent}`, borderRadius: 40, padding: '12px 0',
              color: isCalculating ? T.textTertiary : T.textMax, fontFamily: T.mono, fontSize: 10,
              letterSpacing: '0.1em', cursor: isCalculating ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
            }}>
              {isCalculating ? <><Spin size={12} /> PROCESANDO...</> : 'EJECUTAR ANÁLISIS'}
            </button>
          </GlassPanel>
        )}

        {/* RESULTS  */}
        {activeView === 'results' && result && (
          <GlassPanel style={{ padding: '28px 32px', width: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, animation: 'breathe 1.5s infinite' }} />
              <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 400, color: st.color }}>{st.label}</span>
            </div>
            
            <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textSecondary, lineHeight: 1.5, marginBottom: 24 }}>
              {result.explicacion?.slice(0, 140)}...
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <MetricCard label="Requerida" value={(result.aguaRequeridaLitros / 1000).toFixed(0)} unit="kL" />
              <MetricCard label="Disponible" value={(currentWater / 1000).toFixed(0)} unit="kL" />
              <MetricCard label="Sector A" value={(totalArea * 0.5).toFixed(0)} unit="km²" />
              <MetricCard label="Sector B" value={(totalArea * 0.5).toFixed(0)} unit="km²" />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <EyeBrow>Cobertura hídrica</EyeBrow>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: st.color }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 2, background: T.border, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: st.color, borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
            </div>
          </GlassPanel>
        )}
      </main>

      {/* DaLiA */}
      {activeView === 'chat' && (
        <GlassPanel style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 460,
          zIndex: 30,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: T.accent, fontSize: 12 }}>◍</span>
              </div>
              <div>
                <span style={{ fontFamily: T.serif, fontSize: 15, color: T.textMax }}>DaLiA</span>
                <EyeBrow>Asistente IA</EyeBrow>
              </div>
            </div>
            <StatusDot color={T.teal} blink>activo</StatusDot>
          </div>
          
          <div style={{ height: 240, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMsgs.length === 0 && (
              <div style={{ textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', color: T.textTertiary, fontSize: 12, padding: '30px 0' }}>
                Canal abierto. DaLiA está en línea.
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '8px 14px', borderRadius: 14, fontSize: 11, lineHeight: 1.5,
                  background: m.role === 'user' ? T.accentDim : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${m.role === 'user' ? T.accentDim : T.border}`,
                  color: m.role === 'user' ? T.textMax : T.textSecondary,
                }}>
                  <EyeBrow style={{ marginBottom: 4 }}>{m.role === 'user' ? 'COMANDANTE' : 'DALIA'}</EyeBrow>
                  {m.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div style={{ display: 'flex' }}>
                <div style={{ padding: '8px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ animation: 'breathe 1s infinite' }}>transmitiendo...</span>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChat} style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              placeholder="Pregunta a DaLiA..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.textMax, fontSize: 12, fontFamily: T.sans }} />
            <button type="submit" disabled={isChatLoading || !chatInput.trim()} style={{
              padding: '6px 18px', borderRadius: 30,
              background: chatInput.trim() ? T.accentDim : 'transparent',
              border: `1px solid ${chatInput.trim() ? T.accent : T.border}`,
              color: chatInput.trim() ? T.accent : T.textTertiary,
              fontFamily: T.mono, fontSize: 9, cursor: chatInput.trim() ? 'pointer' : 'default',
            }}>ENVIAR</button>
          </form>
        </GlassPanel>
      )}

      {/* Bottom status bar */}
      <GlassPanel style={{
        position: 'absolute', bottom: 18, left: 20, zIndex: 20,
        padding: '8px 16px', display: 'flex', gap: 20, alignItems: 'center',
      }}>
        {[
          { l: 'Motor IA', v: 'online', c: T.teal },
          { l: 'Sensores', v: 'nominal', c: T.teal },
          { l: 'Dron', v: 'en vuelo', c: T.amber },
          { l: 'Dalia', v: 'activo', c: T.teal },
        ].map(s => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.c }} />
            <div>
              <EyeBrow>{s.l}</EyeBrow>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: s.c, marginTop: 1 }}>{s.v}</div>
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}