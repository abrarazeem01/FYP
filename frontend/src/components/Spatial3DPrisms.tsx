import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Spatial3DPrismsProps {
  className?: string;
  intensity?: number;
}

export const Spatial3DPrisms: React.FC<Spatial3DPrismsProps> = ({
  className = '',
  intensity = 0.35,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Cursor Proximity Light Source (Dynamic Volumetric Rim Light)
    const cursorLight = new THREE.PointLight(0xd4ff00, 2.5 * intensity, 18);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25 * intensity);
    scene.add(ambientLight);

    const secondaryCrimsonLight = new THREE.PointLight(0xff2a4b, 1.8 * intensity, 16);
    secondaryCrimsonLight.position.set(6, -4, 2);
    scene.add(secondaryCrimsonLight);

    // 3. Floating Frosted-Glass Prisms with Holographic Fresnel Sheen
    const prismGroup = new THREE.Group();
    scene.add(prismGroup);

    const prismGeometry = new THREE.OctahedronGeometry(1.2, 0);
    const tetraGeometry = new THREE.TetrahedronGeometry(1.0, 0);
    const icosaGeometry = new THREE.IcosahedronGeometry(0.8, 0);

    const prismMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.28 * intensity,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      ior: 1.58,
      thickness: 1.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xd4ff00,
      transparent: true,
      opacity: 0.38 * intensity,
    });

    const prisms: Array<{
      mesh: THREE.Mesh;
      wireframe: THREE.LineSegments;
      rotSpeed: THREE.Vector3;
      basePos: THREE.Vector3;
      floatSpeed: number;
    }> = [];

    const prismConfigs = [
      { geo: prismGeometry, x: -9, y: 4, z: -2, s: 1.2 },
      { geo: tetraGeometry, x: 9.5, y: 3.5, z: -1, s: 1.0 },
      { geo: icosaGeometry, x: -8.5, y: -4, z: 1, s: 0.9 },
      { geo: prismGeometry, x: 10, y: -3.8, z: 0, s: 1.1 },
      { geo: tetraGeometry, x: 0, y: 6.5, z: -3, s: 0.8 },
      { geo: icosaGeometry, x: 6, y: -6, z: -2, s: 0.7 },
      { geo: prismGeometry, x: -4, y: 7, z: -1, s: 0.85 },
    ];

    prismConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(cfg.geo, prismMaterial.clone());
      mesh.scale.setScalar(cfg.s);
      mesh.position.set(cfg.x, cfg.y, cfg.z);

      const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(cfg.geo), wireframeMat);
      wireframe.scale.setScalar(cfg.s * 1.005);
      wireframe.position.copy(mesh.position);

      prismGroup.add(mesh);
      prismGroup.add(wireframe);

      prisms.push({
        mesh,
        wireframe,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.005
        ),
        basePos: new THREE.Vector3(cfg.x, cfg.y, cfg.z),
        floatSpeed: 0.6 + Math.random() * 0.8,
      });
    });

    // 4. Expanding 3D Geometric Node-Matrix Pulse (Radial grid of 3D cubes / nodes)
    const nodeMatrixGroup = new THREE.Group();
    scene.add(nodeMatrixGroup);

    const cubeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0xd4ff00,
      transparent: true,
      opacity: 0.12 * intensity,
    });

    const matrixNodes: Array<{
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
    }> = [];

    const GRID_X = 14;
    const GRID_Y = 8;
    const SPACING_X = 1.8;
    const SPACING_Y = 1.8;

    for (let ix = -GRID_X / 2; ix <= GRID_X / 2; ix++) {
      for (let iy = -GRID_Y / 2; iy <= GRID_Y / 2; iy++) {
        const mesh = new THREE.Mesh(cubeGeo, cubeMat.clone());
        const bx = ix * SPACING_X;
        const by = iy * SPACING_Y;
        const bz = -5;
        mesh.position.set(bx, by, bz);
        nodeMatrixGroup.add(mesh);
        matrixNodes.push({ mesh, baseX: bx, baseY: by, baseZ: bz });
      }
    }

    // 5. Live Interactive Particle & Ember Drift Field (130 Z-Depth Data-Motes)
    const moteCount = 130;
    const moteGeo = new THREE.BufferGeometry();
    const motePositions = new Float32Array(moteCount * 3);
    const moteVelocities: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3] = (Math.random() - 0.5) * 28;
      motePositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      motePositions[i * 3 + 2] = -8 + Math.random() * 12;

      moteVelocities.push({
        x: (Math.random() - 0.5) * 0.006,
        y: 0.003 + Math.random() * 0.008, // gentle upward drift
        z: (Math.random() - 0.5) * 0.004,
      });
    }

    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xd4ff00,
      size: 0.065,
      transparent: true,
      opacity: 0.38 * intensity,
    });
    const motePoints = new THREE.Points(moteGeo, moteMat);
    scene.add(motePoints);

    // Ripple wave state
    const pulses: Array<{ x: number; y: number; startTime: number }> = [];

    let mouseX = 0;
    let mouseY = 0;
    let pointerSpeed = 0;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let scrollImpulse = 0;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      mouseX = normX * 12;
      mouseY = normY * 7;

      const dx = e.clientX - prevPointerX;
      const dy = e.clientY - prevPointerY;
      pointerSpeed = Math.min(1.5, Math.hypot(dx, dy) * 0.02);
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      cursorLight.position.x = mouseX;
      cursorLight.position.y = mouseY;
    };

    const triggerPulse = (clientX: number, clientY: number) => {
      const normX = (clientX / window.innerWidth) * 2 - 1;
      const normY = -(clientY / window.innerHeight) * 2 + 1;
      pulses.push({
        x: normX * 12,
        y: normY * 7,
        startTime: performance.now(),
      });
      if (pulses.length > 5) pulses.shift();
    };

    const onClick = (e: MouseEvent) => triggerPulse(e.clientX, e.clientY);
    const onScroll = () => {
      scrollImpulse = 0.08;
      triggerPulse(window.innerWidth / 2, window.innerHeight / 2);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 60fps Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const now = performance.now();

      pointerSpeed *= 0.94;
      scrollImpulse *= 0.92;

      // Animate floating prisms with Holographic Rim Shift
      prisms.forEach((p, idx) => {
        p.mesh.rotation.x += p.rotSpeed.x;
        p.mesh.rotation.y += p.rotSpeed.y;
        p.mesh.rotation.z += p.rotSpeed.z;

        p.wireframe.rotation.copy(p.mesh.rotation);

        p.mesh.position.y = p.basePos.y + Math.sin(elapsed * p.floatSpeed + idx) * 0.45;
        p.wireframe.position.y = p.mesh.position.y;

        const distToCursor = p.mesh.position.distanceTo(cursorLight.position);
        if (distToCursor < 6) {
          const proximityFactor = 1 - distToCursor / 6;
          (p.mesh.material as THREE.MeshPhysicalMaterial).opacity =
            (0.28 + proximityFactor * 0.35 + pointerSpeed * 0.15) * intensity;
        } else {
          (p.mesh.material as THREE.MeshPhysicalMaterial).opacity = 0.28 * intensity;
        }
      });

      // Animate 3D geometric node-matrix pulses
      matrixNodes.forEach((node) => {
        let displacementZ = 0;
        let activeScale = 1;

        pulses.forEach((pulse) => {
          const timeSincePulse = (now - pulse.startTime) / 1000;
          if (timeSincePulse > 0 && timeSincePulse < 2.0) {
            const dx = node.baseX - pulse.x;
            const dy = node.baseY - pulse.y;
            const dist = Math.hypot(dx, dy);

            const waveRadius = timeSincePulse * 9;
            const distFromWavefront = Math.abs(dist - waveRadius);

            if (distFromWavefront < 2.2) {
              const strength = (1 - distFromWavefront / 2.2) * (1 - timeSincePulse / 2.0);
              displacementZ += strength * 1.6;
              activeScale += strength * 1.4;
            }
          }
        });

        node.mesh.position.z = node.baseZ + displacementZ;
        node.mesh.scale.setScalar(activeScale);
      });

      // Animate Live Interactive Particle & Ember Drift Field
      const pos = moteGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        let mx = pos.getX(i);
        let my = pos.getY(i) + moteVelocities[i].y + scrollImpulse;
        let mz = pos.getZ(i);

        // Gentle cursor gravity attraction
        const dx = cursorLight.position.x - mx;
        const dy = cursorLight.position.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 5 && d > 0.5) {
          mx += (dx / d) * 0.008;
          my += (dy / d) * 0.008;
        }

        // Loop boundaries
        if (my > 9) my = -9;
        if (mx > 15) mx = -15;
        if (mx < -15) mx = 15;

        pos.setXYZ(i, mx, my, mz);
      }
      pos.needsUpdate = true;

      // Subtle parallax camera sway
      camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 0.05 - camera.position.y) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      prismGeometry.dispose();
      tetraGeometry.dispose();
      icosaGeometry.dispose();
      cubeGeo.dispose();
      moteGeo.dispose();
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none -z-5 w-full h-full overflow-hidden ${className}`}
    />
  );
};

export default Spatial3DPrisms;
