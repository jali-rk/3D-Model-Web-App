'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string;
  showGrid?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
  onLoad?: () => void;
}

function Model({ url, onLoad }: { url: string; onLoad?: () => void }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!scene) {
      setError('Failed to load model scene');
      return;
    }

    try {
      // Clone the scene to avoid modifying the cached version
      const sceneClone = scene.clone();
      
      // Center the model
      const box = new THREE.Box3().setFromObject(sceneClone);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Move model to center
      sceneClone.position.sub(center);
      
      // Scale to a consistent size for viewing
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.0; // Target size in world units
      if (maxDim > 0 && maxDim !== targetSize) {
        sceneClone.scale.setScalar(targetSize / maxDim);
      }
      
      // Ensure materials are visible
      sceneClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            });
          } else if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });

      // Replace the ref's current object
      if (meshRef.current) {
        meshRef.current.clear();
        meshRef.current.add(sceneClone);
      }

      console.log('✅ Model loaded successfully:', {
        dimensions: `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
        scaledTo: targetSize
      });

      // Count meshes
      let meshCount = 0;
      sceneClone.traverse((child) => {
        if (child instanceof THREE.Mesh) meshCount++;
      });
      console.log(`📊 Model contains ${meshCount} meshes`);

      if (!loaded) {
        setLoaded(true);
        onLoad?.();
      }

    } catch (err) {
      console.error('Error processing model:', err);
      setError('Error processing model');
    }
  }, [scene, onLoad, loaded]);

  if (error) {
    return (
      <Html center>
        <div style={styles.errorOverlay}>
          <p>Error: {error}</p>
        </div>
      </Html>
    );
  }

  return <group ref={meshRef} />;
}

export default function ModelViewer({ 
  modelUrl, 
  showGrid = true, 
  autoRotate = true,
  backgroundColor = '#1a1a1a',
  onLoad 
}: ModelViewerProps) {
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        setError('WebGL is not supported in your browser');
      }
    } catch (e) {
      setWebglSupported(false);
      setError('WebGL initialization failed');
    }
  }, []);

  // Load the model through proxy
  useEffect(() => {
    if (!modelUrl || !webglSupported) return;

    const loadModel = async () => {
      setLoading(true);
      setError(null);
      setDownloadProgress(10);
      setModelLoaded(false);

      try {
        // Check if it's already a local URL or needs proxying
        let finalUrl = modelUrl;
        
        // If it's a Tripo URL (not from our API), use proxy
        if (modelUrl.includes('tripo3d.com') && !modelUrl.includes('/api/proxy-model')) {
          const encodedUrl = encodeURIComponent(modelUrl);
          finalUrl = `/api/proxy-model?url=${encodedUrl}`;
          console.log('🔄 Using proxy for Tripo URL');
        } else {
          console.log('📁 Using direct URL');
        }
        
        setDownloadProgress(30);
        
        // Test if the URL is accessible
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const headResponse = await fetch(finalUrl, { 
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          setDownloadProgress(60);

          if (headResponse.ok) {
            console.log('✅ URL is accessible');
            setProxyUrl(finalUrl);
            setDownloadProgress(100);
          } else {
            throw new Error(`Failed to access model: ${headResponse.status}`);
          }
        } catch (headErr) {
          clearTimeout(timeoutId);
          throw headErr;
        }
      } catch (err) {
        console.error('Failed to load model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load 3D model');
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [modelUrl, retryCount, webglSupported]);

  const handleModelLoad = useCallback(() => {
    setModelLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (!webglSupported) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>WebGL is not supported in your browser</p>
        <p style={styles.errorHint}>Please try using Chrome, Firefox, or Edge</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading 3D model... {downloadProgress}%</p>
        <p style={styles.loadingHint}>This may take 30-60 seconds for large models</p>
      </div>
    );
  }

  if (error || !proxyUrl) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error || 'Failed to load 3D model'}</p>
        <p style={styles.errorHint}>The model may be large or the service is temporarily unavailable.</p>
        <button onClick={handleRetry} style={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Canvas
        camera={{ position: [3, 2, 5], fov: 45 }}
        style={styles.canvas}
        onCreated={({ scene, gl }) => {
          console.log('🎨 Canvas created successfully');
          gl.setClearColor(backgroundColor);
        }}
        onError={(event) => {
          console.error('Canvas error:', event);
          setError('WebGL rendering error occurred');
        }}
      >
        {/* Basic lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} />
        <pointLight position={[0, 2, 2]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* Grid helper for reference */}
        {showGrid && (
          <gridHelper args={[10, 20, '#888888', '#444444']} position={[0, -0.01, 0]} />
        )}
        
        {/* Model with suspense fallback */}
        <Suspense fallback={
          <Html center>
            <div style={styles.fallbackLoader}>
              <div style={styles.spinner}></div>
              <p>Rendering 3D model...</p>
            </div>
          </Html>
        }>
          <Model url={proxyUrl} onLoad={handleModelLoad} />
        </Suspense>
        
        <OrbitControls 
          autoRotate={autoRotate && modelLoaded}
          autoRotateSpeed={2}
          enableZoom={true}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      
      {/* Status overlay */}
      <div style={styles.statusOverlay}>
        <span style={styles.statusDot(modelLoaded ? '#4caf50' : '#ff9800')}></span>
        <span style={styles.statusText}>
          {modelLoaded ? 'Model loaded' : 'Loading model...'}
        </span>
      </div>
      
      {/* Debug info (keeping your existing debug) */}
      <div style={styles.debugInfo}>
        <span>Model: {proxyUrl ? '✅' : '❌'}</span>
        <span> | WebGL: {webglSupported ? '✅' : '❌'}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '500px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#1a1a1a',
    marginTop: '20px',
    position: 'relative' as const
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '500px',
    background: '#1a1a1a',
    color: 'white',
    borderRadius: '10px'
  },
  loadingHint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '10px'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '500px',
    background: '#1a1a1a',
    color: '#ff6b6b',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center' as const
  },
  errorText: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '10px'
  },
  errorHint: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '8px 16px',
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  errorOverlay: {
    background: 'rgba(255,0,0,0.7)',
    padding: '10px',
    borderRadius: '4px',
    color: 'white'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 10px'
  },
  fallbackLoader: {
    background: 'rgba(0,0,0,0.7)',
    padding: '20px',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center' as const
  },
  debugInfo: {
    position: 'absolute' as const,
    bottom: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#0f0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 100
  },
  statusOverlay: {
    position: 'absolute' as const,
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    zIndex: 100
  },
  statusDot: (color: string) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block'
  }),
  statusText: {
    fontSize: '11px'
  }
};