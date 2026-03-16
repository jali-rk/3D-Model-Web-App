import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Environment, 
  Html, 
  useProgress 
} from '@react-three/drei';
import * as THREE from 'three';

interface AvatarViewerProps {
  url: string | null;
  garments?: string[];
}

// Loader component
const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '12px 24px', 
        borderRadius: '30px',
        fontSize: '16px',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        Loading... {Math.round(progress)}%
      </div>
    </Html>
  );
};

// Model component
const Model: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      // Center and scale model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.5 / maxDim;
      
      scene.scale.setScalar(scale);
      scene.position.sub(center.multiplyScalar(scale));
      
      // Rotate to face camera
      scene.rotation.y = 0.2;
      
      // Enhance materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                m.side = THREE.DoubleSide;
                m.roughness = 0.4;
                m.metalness = 0.1;
                if (m instanceof THREE.MeshStandardMaterial) {
                  m.emissive = new THREE.Color(0x000000);
                }
              });
            } else {
              child.material.side = THREE.DoubleSide;
              child.material.roughness = 0.4;
              child.material.metalness = 0.1;
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0x000000);
              }
            }
          }
        }
      });
    }
  }, [scene]);

  return <primitive ref={groupRef} object={scene} />;
};

const AvatarViewer: React.FC<AvatarViewerProps> = ({ url, garments = [] }) => {
  if (!url) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '15px'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <span style={{ fontSize: '5em', display: 'block', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>👕</span>
          <h3 style={{ fontSize: '1.8em', marginBottom: '10px' }}>No Avatar Generated</h3>
          <p style={{ opacity: 0.9, fontSize: '1.1em' }}>Adjust measurements and click Generate</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      shadows="soft"
      camera={{ position: [3, 1.5, 4], fov: 45 }}
      gl={{ 
        preserveDrawingBuffer: true, 
        antialias: true,
        powerPreference: "high-performance"
      }}
      style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '15px',
        width: '100%',
        height: '100%'
      }}
    >
      <Suspense fallback={<Loader />}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={1024}
        />
        <directionalLight position={[-5, 3, 5]} intensity={0.6} />
        <directionalLight position={[0, 5, -5]} intensity={0.4} />
        
        {/* Environment */}
        <Environment preset="city" background={false} />
        
        {/* Avatar */}
        <Model url={url} />
        
        {/* Garment indicator */}
        {garments.length > 0 && (
          <Html position={[0, 2.5, 0]} center>
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.95)', 
              color: 'white', 
              padding: '6px 16px', 
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              border: '2px solid white'
            }}>
              {garments.length} Garment(s): {garments.join(', ')}
            </div>
          </Html>
        )}
        
        {/* Controls */}
        <OrbitControls
          enableZoom
          enableRotate
          enablePan
          minDistance={2}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={1.5}
          rotateSpeed={0.8}
          zoomSpeed={1.2}
        />
        
        {/* Grid */}
        <gridHelper args={[8, 20, '#888888', '#444444']} position={[0, -1.2, 0]} />
      </Suspense>
    </Canvas>
  );
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

export default AvatarViewer;