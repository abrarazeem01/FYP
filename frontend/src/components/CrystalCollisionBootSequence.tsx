import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface CrystalCollisionBootSequenceProps {
  onComplete: () => void;
}

export const CrystalCollisionBootSequence: React.FC<CrystalCollisionBootSequenceProps> = ({
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [impactOccurred, setImpactOccurred] = useState(false);
  const [vaultOpened, setVaultOpened] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.getMuted());
  const [systemStage, setSystemStage] = useState('INITIALIZING SPATIAL CORE');

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060708, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xd4ff00, 3.5, 16);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const impactFlashLight = new THREE.PointLight(0xffffff, 0, 25);
    impactFlashLight.position.set(0, 0, 0);
    scene.add(impactFlashLight);

    const portalCoreLight = new THREE.PointLight(0xd4ff00, 0, 18);
    portalCoreLight.position.set(0, 0, -0.2);
    scene.add(portalCoreLight);

    // 3. Futuristic Split Vault-Door Architectural Monolith
    const vaultGroup = new THREE.Group();
    scene.add(vaultGroup);

    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x181b1e, // Matte grey obsidian
      roughness: 0.65,
      metalness: 0.45,
      flatShading: true,
    });

    const edgeMat = new THREE.LineBasicMaterial({ color: 0x5a6572, linewidth: 1.5 });

    // Left Vault Door Leaf
    const doorGeo = new THREE.BoxGeometry(0.82, 3.4, 0.85);
    const leftDoor = new THREE.Mesh(doorGeo, monolithMat);
    leftDoor.position.set(-0.41, 0, 0);
    const leftEdges = new THREE.LineSegments(new THREE.EdgesGeometry(doorGeo), edgeMat);
    leftDoor.add(leftEdges);
    vaultGroup.add(leftDoor);

    // Right Vault Door Leaf
    const rightDoor = new THREE.Mesh(doorGeo, monolithMat);
    rightDoor.position.set(0.41, 0, 0);
    const rightEdges = new THREE.LineSegments(new THREE.EdgesGeometry(doorGeo), edgeMat);
    rightDoor.add(rightEdges);
    vaultGroup.add(rightDoor);

    // Flanking Heavy Blast Pillars
    const flankGeo = new THREE.BoxGeometry(0.75, 2.6, 0.65);
    const flank1 = new THREE.Mesh(flankGeo, monolithMat);
    flank1.position.set(-1.6, -0.4, -0.3);
    flank1.rotation.y = 0.25;
    vaultGroup.add(flank1);

    const flank2 = new THREE.Mesh(flankGeo, monolithMat);
    flank2.position.set(1.6, -0.4, -0.3);
    flank2.rotation.y = -0.25;
    vaultGroup.add(flank2);

    // Glowing Inner Portal Core (revealed as vault opens)
    const portalGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0xd4ff00,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 0, -0.5);
    scene.add(portalMesh);

    // 4. Refractive Crystal Prism
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    const crystalGeo = new THREE.OctahedronGeometry(1.15, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4ff00,
      transmission: 0.9,
      opacity: 0.95,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.68,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalGroup.add(crystalMesh);

    const innerCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    crystalGroup.add(innerCore);

    // Initial starting trajectory
    crystalGroup.position.set(6.8, 3.4, 3.6);
    crystalGroup.scale.setScalar(0.85);

    // 5. Expanding Concentric Shockwave Rings
    const ringGeo = new THREE.RingGeometry(0.1, 0.16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwaveRing1 = new THREE.Mesh(ringGeo, ringMat.clone());
    const shockwaveRing2 = new THREE.Mesh(ringGeo, ringMat.clone());
    const shockwaveRing3 = new THREE.Mesh(ringGeo, ringMat.clone());
    shockwaveRing1.position.set(0, 0, 0.4);
    shockwaveRing2.position.set(0, 0, 0.4);
    shockwaveRing3.position.set(0, 0, 0.4);
    scene.add(shockwaveRing1);
    scene.add(shockwaveRing2);
    scene.add(shockwaveRing3);

    // 6. Fracture Debris Field (80 Particles)
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0.4;

      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6.5,
          (Math.random() - 0.5) * 6.5,
          (Math.random() - 0.15) * 5.5
        )
      );
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleSystem = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        color: 0xd4ff00,
        size: 0.08,
        transparent: true,
        opacity: 0,
      })
    );
    scene.add(particleSystem);

    // Animation & Timing
    const startTime = performance.now();
    const collisionTime = 1100; // ms to crystal collision
    const vaultOpenTime = 1350; // ms to vault door opening
    const totalDuration = 3200; // ms total
    let impactSoundTriggered = false;
    let vaultSoundTriggered = false;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = performance.now() - startTime;
      const progressFraction = Math.min(1, elapsed / totalDuration);
      setProgress(Math.round(progressFraction * 100));

      if (elapsed < 600) {
        setSystemStage('SYNCHRONIZING SPATIAL MESH');
      } else if (elapsed < collisionTime) {
        setSystemStage('ENGAGING ENCRYPTED SESSION HANDSHAKE');
      } else if (elapsed < vaultOpenTime + 600) {
        setSystemStage('COLLISION LOCK // BREACHING VAULT DOORS');
      } else {
        setSystemStage('NEXUS COMMAND DECK UNLOCKED');
      }

      // Camera gentle cinematic dolly
      camera.position.z = 8.5 - progressFraction * 1.6;

      // Phase 1: Pre-Collision Crystal Trajectory (0 to 1.1s)
      if (elapsed < collisionTime) {
        const t = elapsed / collisionTime;
        const easeT = Math.pow(t, 2.3);

        crystalGroup.position.x = 6.8 * (1 - easeT);
        crystalGroup.position.y = 3.4 * (1 - easeT);
        crystalGroup.position.z = 3.6 * (1 - easeT) + 0.4;

        crystalGroup.rotation.x += 0.07;
        crystalGroup.rotation.y += 0.1;

        vaultGroup.rotation.y = Math.sin(elapsed * 0.002) * 0.06;
      }
      // Phase 2: Impact & Vault Door Split (1.1s onward)
      else {
        // Trigger Crystal Impact Chime exactly at collision!
        if (!impactSoundTriggered) {
          impactSoundTriggered = true;
          setImpactOccurred(true);
          soundEngine.playCrystalImpact();

          // Flash burst
          impactFlashLight.intensity = 10;
          (particleSystem.material as THREE.PointsMaterial).opacity = 1;
        }

        const postImpactTime = elapsed - collisionTime;
        impactFlashLight.intensity *= 0.87;

        // Crystal settles into center of vault seam
        crystalGroup.position.set(0, 0, 0.4);
        crystalGroup.scale.setScalar(0.75 + Math.sin(postImpactTime * 0.01) * 0.07);
        crystalGroup.rotation.x += 0.02;
        crystalGroup.rotation.y += 0.03;

        // Monolith impact shudder
        const shakeDecay = Math.max(0, 1 - postImpactTime / 500);
        vaultGroup.position.x = (Math.random() - 0.5) * 0.14 * shakeDecay;
        vaultGroup.position.y = (Math.random() - 0.5) * 0.14 * shakeDecay;

        // Trigger Vault Door Rumble Sound
        if (elapsed >= vaultOpenTime && !vaultSoundTriggered) {
          vaultSoundTriggered = true;
          setVaultOpened(true);
          soundEngine.playVaultDoorRumble();
        }

        // Vault Door Opening Split (Sliding apart horizontally)
        if (elapsed >= vaultOpenTime) {
          const openDuration = 1200;
          const openT = Math.min(1, (elapsed - vaultOpenTime) / openDuration);
          const easeOpen = Math.pow(openT, 2.8);

          // Left door slides left & swings back
          leftDoor.position.x = -0.41 - easeOpen * 2.8;
          leftDoor.rotation.y = -easeOpen * 0.35;

          // Right door slides right & swings back
          rightDoor.position.x = 0.41 + easeOpen * 2.8;
          rightDoor.rotation.y = easeOpen * 0.35;

          // Flanking pillars shift slightly with hydraulic recoil
          flank1.position.x = -1.6 - easeOpen * 0.8;
          flank2.position.x = 1.6 + easeOpen * 0.8;

          // Portal Core Illuminates
          portalMat.opacity = Math.min(0.7, easeOpen * 0.8);
          portalMesh.rotation.y += 0.015;
          portalMesh.rotation.x += 0.01;
          portalCoreLight.intensity = easeOpen * 5;
        }

        // Expanding concentric shockwave rings
        const ringTime1 = postImpactTime / 850;
        if (ringTime1 < 1) {
          const s1 = 1 + ringTime1 * 15;
          shockwaveRing1.scale.set(s1, s1, 1);
          (shockwaveRing1.material as THREE.MeshBasicMaterial).opacity = (1 - ringTime1) * 0.95;
        } else {
          (shockwaveRing1.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        const ringTime2 = (postImpactTime - 110) / 850;
        if (ringTime2 > 0 && ringTime2 < 1) {
          const s2 = 1 + ringTime2 * 12;
          shockwaveRing2.scale.set(s2, s2, 1);
          (shockwaveRing2.material as THREE.MeshBasicMaterial).opacity = (1 - ringTime2) * 0.75;
        } else {
          (shockwaveRing2.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        const ringTime3 = (postImpactTime - 220) / 850;
        if (ringTime3 > 0 && ringTime3 < 1) {
          const s3 = 1 + ringTime3 * 9;
          shockwaveRing3.scale.set(s3, s3, 1);
          (shockwaveRing3.material as THREE.MeshBasicMaterial).opacity = (1 - ringTime3) * 0.55;
        } else {
          (shockwaveRing3.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        // Particle debris trajectory
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          const vel = particleVelocities[i];
          posAttr.setXYZ(
            i,
            posAttr.getX(i) + vel.x * 0.02,
            posAttr.getY(i) + vel.y * 0.02,
            posAttr.getZ(i) + vel.z * 0.02
          );
        }
        posAttr.needsUpdate = true;
        (particleSystem.material as THREE.PointsMaterial).opacity = Math.max(
          0,
          1 - postImpactTime / 1300
        );
      }

      renderer.render(scene, camera);

      if (elapsed >= totalDuration) {
        cancelAnimationFrame(animId);
        onComplete();
      }
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      doorGeo.dispose();
      monolithMat.dispose();
      edgeMat.dispose();
      flankGeo.dispose();
      portalGeo.dispose();
      portalMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      ringGeo.dispose();
      particleGeo.dispose();
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[99999] bg-[#060708] flex items-center justify-center select-none overflow-hidden"
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Optical Shockwave Flash & Chromatic Aberration Dispersion Overlay */}
      <AnimatePresence>
        {impactOccurred && (
          <motion.div
            initial={{ opacity: 1, scale: 0.85 }}
            animate={{ opacity: 0, scale: 2.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(212,255,0,0.35) 0%, rgba(255,42,75,0.18) 40%, transparent 75%)',
              filter: 'drop-shadow(-4px 0px 0px rgba(255,42,75,0.6)) drop-shadow(4px 0px 0px rgba(0,240,255,0.6))',
            }}
          />
        )}
      </AnimatePresence>

      {/* Dead-Center Brand Reveal */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <AnimatePresence>
          {impactOccurred && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Telemetry Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d0f12]/90 border border-white/10 chamfer-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-ping" />
                <span className="font-mono text-[10px] text-[#D4FF00] tracking-widest uppercase font-bold">
                  {vaultOpened ? '// VAULT_DOORS_BREACHED' : '// IMPACT_COLLISION_VERIFIED'}
                </span>
              </div>

              {/* Central Bold Kinetic Title with Chromatic Aberration Flare */}
              <div className="relative overflow-hidden">
                <h1
                  className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.02em] text-[#F4F6F8] uppercase leading-none drop-shadow-2xl"
                  style={{
                    textShadow: impactOccurred
                      ? '-2px 0 rgba(255,42,75,0.5), 2px 0 rgba(0,240,255,0.5)'
                      : 'none',
                  }}
                >
                  NEXUS <span className="text-[#D4FF00]">SENTINEL</span>
                </h1>

                {/* Optical Light Sweep across letters */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.15, ease: 'easeInOut', delay: 0.1 }}
                  className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
                />
              </div>

              {/* Subtitle */}
              <p className="font-sans text-xs tracking-wider uppercase text-[#8A94A6]">
                COUNTER-CONTRABAND VEHICLE MARKET INTELLIGENCE
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Telemetry Progress Bar 0% -> 100% */}
        <div className="w-72 sm:w-80 mt-8 space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#8A94A6] uppercase tracking-wider truncate max-w-[200px]">
              {systemStage}
            </span>
            <span className="text-[#D4FF00] font-bold">{progress}%</span>
          </div>

          <div className="w-full h-1 bg-white/10 overflow-hidden chamfer-sm relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4FF00] via-white to-[#D4FF00] shadow-[0_0_14px_#D4FF00]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Top Header Utilities */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between font-mono text-[10px] text-[#8A94A6] z-30">
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
          <span>CRYSTAL_COLLISION_VAULT_ENGINE_v2.5</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Web Audio' : 'Mute Web Audio'}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d0f12]/90 hover:bg-white/10 text-[#8A94A6] hover:text-[#D4FF00] border border-white/10 chamfer-sm transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />}
            <span className="text-[9px] uppercase font-bold">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>

          {/* Skip Button */}
          <button
            onClick={onComplete}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 chamfer-sm transition-colors cursor-pointer"
          >
            SKIP [ESC]
          </button>
        </div>
      </div>

      {/* Bottom Technical Status */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between font-mono text-[9px] text-[#8A94A6] pointer-events-none z-30">
        <span>AUDIO_ENGINE: WEB AUDIO SYNTHESIZER (0 EXTERNAL ASSETS)</span>
        <span className="text-[#D4FF00]">FRAME_RATE: 60 FPS SOLID</span>
      </div>
    </motion.div>
  );
};

export default CrystalCollisionBootSequence;
