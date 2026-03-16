'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { UploadResponse, TaskResponse, TaskStatusResponse } from './types/tripo.types';
import SizeSelector from './components/SizeSelector';
import ScaledModelDownloader from './components/ScaleModelDownloader';

const ModelViewer = dynamic(() => import('./components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div style={styles.loadingModel}>
      <div style={styles.spinner}></div>
      <p>Loading 3D Viewer...</p>
    </div>
  )
});

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']); // Default sizes to generate
  const [showScaler, setShowScaler] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setModelUrl(null);
      setShowScaler(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
      setModelUrl(null);
      setShowScaler(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const generateModel = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Uploading image...');

    try {
      // Upload image to Tripo
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedImage);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const uploadData: UploadResponse = await uploadRes.json();
      
      if (uploadData.code !== 0) {
        throw new Error(uploadData.message || 'Upload failed');
      }

      const imageToken = uploadData.data.image_token;
      setStatus('Creating task...');

      // Create Tripo task
      const taskRes = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image_to_model',
          file: { file_token: imageToken },
          pbr: true
        })
      });

      const taskData: TaskResponse = await taskRes.json();
      
      if (taskData.code !== 0) {
        throw new Error(taskData.message || 'Task creation failed');
      }

      const taskId = taskData.data.task_id;
      setStatus('Generating 3D model...');

      // Poll for result
      let attempts = 0;
      const maxAttempts = 60;
      
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/task/${taskId}`);
          const statusData: TaskStatusResponse = await statusRes.json();

          if (statusData.code === 0) {
            if (statusData.data.status === 'success') {
              clearInterval(pollInterval);
              
              const modelOutput = statusData.data.output?.pbr_model || statusData.data.output?.model;
              if (modelOutput) {
                const fullModelUrl = modelOutput.startsWith('http') 
                  ? modelOutput 
                  : `https://api.tripo3d.ai${modelOutput}`;
                
                setModelUrl(fullModelUrl);
                setStatus('Model generated!');
                setLoading(false);
                setShowScaler(true);
              } else {
                throw new Error('No model URL in response');
              }
            } else if (statusData.data.status === 'failed') {
              clearInterval(pollInterval);
              throw new Error('Generation failed');
            }
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error('Generation timeout - please try again');
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreview(null);
    setModelUrl(null);
    setError('');
    setStatus('');
    setShowScaler(false);
    setSelectedSizes(['M', 'L', 'XL']);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>AI 3D Garment Generator</h1>
        <p style={styles.subtitle}>Upload image → Generate base model → Scale to any size</p>

        {/* Upload Area */}
        <div
          style={{
            ...styles.uploadArea,
            ...(loading ? styles.uploadAreaDisabled : {})
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            disabled={loading}
          />

          {preview ? (
            <div style={styles.previewContainer}>
              <Image
                src={preview}
                alt="Preview"
                width={200}
                height={200}
                style={{
                  ...styles.preview,
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '200px',
                  maxHeight: '200px'
                }}
              />
              {!loading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    setPreview(null);
                  }}
                  style={styles.removeButton}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div style={styles.uploadPrompt}>
              <p style={styles.uploadText}>Drop image here or click to upload</p>
              <p style={styles.uploadHint}>Supports: JPG, PNG, WEBP</p>
            </div>
          )}
        </div>

        {/* Generate Base Model Button */}
        {selectedImage && !modelUrl && !loading && (
          <button
            onClick={generateModel}
            style={styles.generateButton}
          >
            🚀 Generate 3D Model with Tripo
          </button>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.statusText}>{status}</p>
            <p style={styles.hintText}>This usually takes 1-2 minutes...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button onClick={resetForm} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {/* Base Model Result */}
        {modelUrl && (
          <div style={styles.resultContainer}>
            <h3 style={styles.successTitle}>✓ Base Model Generated!</h3>
            
            <ModelViewer modelUrl={modelUrl} />
            
            <div style={styles.buttonGroup}>
              <a
                href={modelUrl}
                download="base_model.glb"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.downloadButton}
              >
                📥 Download Base Model (Size M)
              </a>
            </div>

            {/* Size Selection for Scaling */}
            {showScaler && (
              <div style={styles.scaleSection}>
                <h4>Step 2: Select Sizes to Generate</h4>
                <SizeSelector 
                  onSizeChange={setSelectedSizes}
                  disabled={false}
                  selectedSizes={selectedSizes}
                />
                
                <ScaledModelDownloader 
                  baseModelUrl={modelUrl}
                  availableSizes={selectedSizes}
                />
              </div>
            )}
            
            <div style={styles.buttonGroup}>
              <button onClick={resetForm} style={styles.newButton}>
                Generate New Garment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center' as const,
    color: '#333',
    marginBottom: '10px',
    fontSize: '2.5em'
  },
  subtitle: {
    textAlign: 'center' as const,
    color: '#666',
    marginBottom: '30px'
  },
  uploadArea: {
    border: '2px dashed #ddd',
    borderRadius: '10px',
    padding: '30px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '20px',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadAreaDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  uploadPrompt: {
    textAlign: 'center' as const
  },
  uploadText: {
    color: '#333',
    marginBottom: '5px'
  },
  uploadHint: {
    color: '#999',
    fontSize: '12px'
  },
  previewContainer: {
    position: 'relative' as const,
    display: 'inline-block'
  },
  preview: {
    borderRadius: '8px',
    objectFit: 'contain' as const
  },
  removeButton: {
    position: 'absolute' as const,
    top: '-10px',
    right: '-10px',
    width: '25px',
    height: '25px',
    borderRadius: '50%',
    background: '#ff4444',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  },
  generateButton: {
    width: '100%',
    padding: '15px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '20px'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  loadingContainer: {
    textAlign: 'center' as const,
    padding: '30px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  statusText: {
    color: '#333',
    marginBottom: '10px'
  },
  hintText: {
    color: '#999',
    fontSize: '14px'
  },
  errorContainer: {
    textAlign: 'center' as const,
    padding: '20px',
    background: '#ffebee',
    borderRadius: '10px',
    marginTop: '20px'
  },
  errorText: {
    color: '#c62828',
    marginBottom: '10px'
  },
  retryButton: {
    padding: '8px 20px',
    background: '#c62828',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  resultContainer: {
    marginTop: '30px'
  },
  successTitle: {
    color: '#2e7d32',
    marginBottom: '20px',
    textAlign: 'center' as const
  },
  scaleSection: {
    marginTop: '30px',
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '10px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '20px',
    flexWrap: 'wrap' as const
  },
  downloadButton: {
    padding: '10px 20px',
    background: '#2e7d32',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer'
  },
  newButton: {
    padding: '10px 20px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  loadingModel: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '400px',
    background: '#1a1a1a',
    color: 'white',
    borderRadius: '10px'
  }
};