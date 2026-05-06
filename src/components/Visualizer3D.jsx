import React, { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Componente para el terreno de Marte
const MarsTerrain = () => {
  const { scene } = useGLTF('./mars_landscape.glb');
  return (
    <group position={[0, -50, 0]}>
      <primitive object={scene} scale={50} />
    </group>
  );
};

// Componente para el efecto de escáner del dron
const ScannerRadar = () => {
  const scannerRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    scannerRef.current.position.z = Math.sin(t * 0.5) * 40;
  });

  return (
    <mesh ref={scannerRef} position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 0.2]} />
      <meshBasicMaterial
        color="#00ff00"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Componente para resaltar el área de "Lavado" directamente bajo el dron
const WashingZone = ({ totalArea }) => {
  const radius = 10 + (totalArea / 100) * 40;

  return (
    <mesh position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <ringGeometry args={[0, radius, 64]} />
      <meshBasicMaterial
        color="#0066ff"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// Componente para el Dron
const DroneBody = () => {
  const droneRef = useRef();
  const { scene } = useGLTF('./dron.glb');

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    droneRef.current.position.y = 80 + Math.sin(t * 2) * 0.5;
  });

  return (
    <group ref={droneRef} position={[0, 80, 0]}>
      <primitive object={scene} scale={5} />
      <spotLight
        position={[0, -0.5, 0]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={2}
        color="#00f3ff"
        castShadow
      />
    </group>
  );
};

// Controlador para mover el dron y la zona de lavado juntos
const DroneController = ({ totalArea, controlsRef }) => {
  const groupRef = useRef();
  const keys = useRef({ 
    w: false, a: false, s: false, d: false, 
    q: false, e: false, 
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false 
  });

  useEffect(() => {
    const isInputActive = (e) => {
      const tag = e.target.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea';
    };

    const handleKeyDown = (e) => { 
      if (isInputActive(e)) return;
      const key = e.key;
      const lowerKey = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) keys.current[key] = true; 
      else if (keys.current.hasOwnProperty(lowerKey)) keys.current[lowerKey] = true;
    };
    const handleKeyUp = (e) => { 
      if (isInputActive(e)) return;
      const key = e.key;
      const lowerKey = e.key.toLowerCase();
      if (keys.current.hasOwnProperty(key)) keys.current[key] = false; 
      else if (keys.current.hasOwnProperty(lowerKey)) keys.current[lowerKey] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 40 * delta;
    let dx = 0;
    let dz = 0;
    let dy = 0;
    
    if (keys.current.w || keys.current.ArrowUp) dz -= speed;
    if (keys.current.s || keys.current.ArrowDown) dz += speed;
    if (keys.current.a || keys.current.ArrowLeft) dx -= speed;
    if (keys.current.d || keys.current.ArrowRight) dx += speed;
    if (keys.current.q) dy -= speed;
    if (keys.current.e) dy += speed;
    
    if (dx !== 0 || dz !== 0 || dy !== 0) {
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
      <WashingZone totalArea={totalArea} />
      <Suspense fallback={null}>
        <DroneBody />
      </Suspense>
    </group>
  );
};

export default function Visualizer3D({ totalArea = 100 }) {
  const controlsRef = useRef();

  return (
    <div className="relative w-full h-full bg-mars-dark">
      {/* Overlay HUD 2D */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between border-4 border-cyber-cyan/20">
        <div className="flex justify-between items-start text-cyber-cyan font-mono text-sm tracking-widest text-shadow-glow">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              REC
            </span>
            <span>ALTITUD: 80.4m</span>
            <span>VELOCIDAD: 12.5 km/h</span>
            <span className="text-mars-light mt-2 animate-pulse bg-mars-dark/80 px-2 py-1 rounded">Usa WASD (Flechas) y Q/E para volar</span>
          </div>
          <div className="text-right">
            <span className="block text-mars-light">MODO: ESCANEO MULTIESPECTRAL</span>
            <span className="block mt-1">OBJETIVO: DETECCIÓN DE HUMEDAD</span>
          </div>
        </div>

        <div className="flex justify-between items-end text-cyber-cyan font-mono text-xs opacity-70">
          <div>SECTOR: Valles Marineris - Cuadrante B-42</div>
          <div>COORDENADAS: 14.5°S 55.7°W</div>
        </div>
      </div>

      {/* Canvas 3D */}
      <Canvas shadows camera={{ position: [0, 85, 20], fov: 50 }}>
        <color attach="background" args={['#1a0b08']} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[100, 100, 50]} intensity={1} color="#ffaa88" castShadow />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <ScannerRadar />
        <DroneController totalArea={totalArea} controlsRef={controlsRef} />
        
        <Suspense fallback={null}>
          <MarsTerrain />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={5}
          maxDistance={100}
          target={[0, 80, 0]}
        />
      </Canvas>
    </div>
  );
}
