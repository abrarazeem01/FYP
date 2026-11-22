import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Maximize2, Sparkles, Eye, Shield } from 'lucide-react';

interface Interactive3DCenterpieceProps {
  className?: string;
  wireframeOnly?: boolean;
  accentColor?: string;
  title?: string;
}

export const Interactive3DCenterpiece: React.FC<Interactive3DCenterpieceProps> = ({
  className = '',
  wireframeOnly = false,
  accentColor = '#D4FF00',
  title = 'SPATIAL TELEMETRY 3D MESH',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(wireframeOnly);
  const [rotationSpeed, setRotationSpeed] = useState(0.005);
  const [angles, setAngles] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Group for dragging and tilting
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Aerodynamic / Geometric Inner Core (Icosahedron with subdivision)
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x060708,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: wireframeMode,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    mainGroup.add(coreMesh);

    // 2. Wireframe Cage Highlight in Acid Volt
    const wireframeGeo = new THREE.WireframeGeometry(coreGeometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accentColor),
      linewidth: 1.5,
      transparent: true,
      opacity: 0.7,
    });
    const wireframeLine = new THREE.LineSegments(wireframeGeo, wireframeMat);
    mainGroup.add(wireframeLine);

    // 3. Vertex Nodes (Glowing sensor blips at vertices)
    const posAttribute = coreGeometry.attributes.position;
    const vertices: number[] = [];
    for (let i = 0; i < posAttribute.count; i++) {
      vertices.push(posAttribute.getX(i), posAttribute.getY(i), posAttribute.getZ(i));
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: new THREE.Color(accentColor),
      size: 0.08,
      transparent: true,
      opacity: 0.9,
    });
    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    mainGroup.add(pointsMesh);

    // 4. Outer Orbital Gyroscopic Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.3, 0.012, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff2a4b, // Telemetry Crimson
      transparent: true,
      opacity: 0.4,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLightVolt = new THREE.PointLight(new THREE.Color(accentColor), 2.5, 10);
    pointLightVolt.position.set(3, 3, 4);
    scene.add(pointLightVolt);

    const pointLightCrimson = new THREE.PointLight(0xff2a4b, 1.8, 10);
    pointLightCrimson.position.set(-3, -2, -2);
    scene.add(pointLightCrimson);

    // Interaction State
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      setIsDragging(true);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouseX = normX;
      mouseY = normY;

      if (isMouseDown) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        velocityX = deltaX * 0.005;
        velocityY = deltaY * 0.005;

        targetRotationY += velocityX;
        targetRotationX += velocityY;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
      setIsDragging(false);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 60fps Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!isMouseDown) {
        // Natural inertia decay + subtle auto-rotation
        targetRotationY += rotationSpeed;
        velocityX *= 0.95;
        velocityY *= 0.95;
        targetRotationY += velocityX;
        targetRotationX += velocityY;
      }

      // Smooth damping toward target orientation
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.08;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.08;

      // Parallax cursor depth reaction
      mainGroup.position.x += (mouseX * 0.2 - mainGroup.position.x) * 0.05;
      mainGroup.position.y += (mouseY * 0.2 - mainGroup.position.y) * 0.05;

      // Secondary counter-rotation for gyroscopic rings
      ring1.rotation.z += 0.008;
      ring2.rotation.x += 0.006;

      // Breathing scale pulse
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 1.5) * 0.02;
      coreMesh.scale.set(scale, scale, scale);
      wireframeLine.scale.set(scale, scale, scale);

      renderer.render(scene, camera);

      // Periodically update coordinates state for display
      if (Math.random() < 0.1) {
        setAngles({
          x: Math.round(mainGroup.rotation.x * 57.29),
          y: Math.round(mainGroup.rotation.y * 57.29),
        });
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
    };
  }, [wireframeMode, rotationSpeed, accentColor]);

  return (
    <div className={`relative w-full h-[320px] bg-[#060708] border border-white/[0.08] chamfer-md overflow-hidden bracket-box ${className}`}>
      
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
        title="Click and drag to orbit 3D wireframe mesh"
      />

      {/* Top Telemetry Header Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 font-mono text-[10px]">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0d0f12]/90 border border-white/[0.08] chamfer-badge text-[#F4F6F8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
          <span className="font-bold text-[#D4FF00]">// 3D_SPATIAL_TOPOLOGY</span>
          <span className="text-[#8A94A6]">60 FPS</span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-0.5 border chamfer-badge transition-colors ${
              wireframeMode
                ? 'bg-[#D4FF00] text-black font-bold border-[#D4FF00]'
                : 'bg-[#14171c] text-[#8A94A6] hover:text-white border-white/10'
            }`}
            title="Toggle Wireframe Mesh"
          >
            WIREFRAME
          </button>
          <button
            onClick={() => setRotationSpeed(rotationSpeed === 0 ? 0.005 : 0)}
            className={`px-2 py-0.5 border chamfer-badge transition-colors ${
              rotationSpeed === 0
                ? 'bg-[#FF2A4B] text-white font-bold border-[#FF2A4B]'
                : 'bg-[#14171c] text-[#8A94A6] hover:text-white border-white/10'
            }`}
            title="Toggle Auto Rotation"
          >
            {rotationSpeed === 0 ? 'FROZEN' : 'ORBITING'}
          </button>
        </div>
      </div>

      {/* Bottom Status Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 font-mono text-[10px] text-[#8A94A6]">
        <div className="flex items-center gap-3">
          <span>PITCH: <strong className="text-[#F4F6F8]">{angles.x}°</strong></span>
          <span>YAW: <strong className="text-[#D4FF00]">{angles.y}°</strong></span>
        </div>
        <span className="hidden sm:inline text-[9px] text-zinc-500">
          DRAG TO ROTATE // CURSOR REACTIVE DEPTH
        </span>
      </div>

    </div>
  );
};

export default Interactive3DCenterpiece;
