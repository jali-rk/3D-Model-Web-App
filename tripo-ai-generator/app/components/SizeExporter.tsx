'use client';

import { useState, useEffect } from 'react';

interface SizeExporterProps {
  jobId: string | null;
  sizes: string[];
  onDownload?: (size: string, blob: Blob) => void;
  fileSizeMB?: number; // Add file size prop
}

export default function SizeExporter({ jobId, sizes, onDownload, fileSizeMB }: SizeExporterProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [needsCompression, setNeedsCompression] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/rapidpipeline/status/${jobId}`);
        const data = await response.json();

        if (data.success) {
          setStatus(data.status);
          
          if (data.status === 'completed' && data.outputUrls) {
            setProgress(data.outputUrls);
          } else if (data.status === 'failed') {
            setError(data.error || 'Scaling failed');
          }
        } else {
          // Handle 413 error
          if (response.status === 413) {
            setNeedsCompression(true);
            setError(`File too large (${fileSizeMB?.toFixed(2)}MB). RapidPipeline limit is 10MB.`);
          } else {
            setError(data.error || 'Unknown error');
          }
        }
      } catch (err) {
        console.error('Status check failed:', err);
        setError('Failed to check scaling status');
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, [jobId, fileSizeMB]);

  const downloadSize = async (size: string) => {
    if (!jobId) return;

    setDownloading(prev => ({ ...prev, [size]: true }));

    try {
      const response = await fetch(`/api/rapidpipeline/job/${jobId}/download/${size}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `garment_${size}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      if (onDownload) {
        onDownload(size, blob);
      }
    } catch (err) {
      console.error(`Error downloading size ${size}:`, err);
      alert(`Failed to download size ${size}`);
    } finally {
      setDownloading(prev => ({ ...prev, [size]: false }));
    }
  };

  const downloadAll = async () => {
    for (const size of sizes) {
      await downloadSize(size);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (!jobId && !needsCompression) return null;

  if (needsCompression) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>⚠️ File Size Issue</h3>
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.errorHint}>Your model is {fileSizeMB?.toFixed(2)}MB. Try these solutions:</p>
          <ul style={styles.suggestionList}>
            <li>Compress the model using tools like gltf-pipeline</li>
            <li>Reduce texture sizes</li>
            <li>Contact RapidPipeline about increasing your upload limit</li>
          </ul>
          <button 
            onClick={() => window.location.reload()} 
            style={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📏 Size Scaling Progress</h3>
      
      <div style={styles.statusBar}>
        <div style={{
          ...styles.statusIndicator,
          background: status === 'completed' ? '#4caf50' : 
                     status === 'failed' ? '#f44336' :
                     status === 'processing' ? '#ff9800' : '#9e9e9e'
        }} />
        <span style={styles.statusText}>
          {status === 'completed' ? '✅ All sizes ready!' :
           status === 'failed' ? '❌ Scaling failed' :
           status === 'processing' ? '⏳ Processing sizes...' :
           '⏳ Starting job...'}
        </span>
      </div>

      {error && !needsCompression && (
        <div style={styles.errorBox}>
          Error: {error}
        </div>
      )}

      {status === 'completed' && (
        <div style={styles.downloadSection}>
          <p style={styles.downloadHint}>Download scaled models:</p>
          
          <div style={styles.downloadGrid}>
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => downloadSize(size)}
                disabled={downloading[size]}
                style={{
                  ...styles.downloadButton,
                  ...(downloading[size] ? styles.downloadButtonDisabled : {})
                }}
              >
                {downloading[size] ? '⏳' : '📥'} Size {size}
              </button>
            ))}
          </div>

          {sizes.length > 1 && (
            <button
              onClick={downloadAll}
              style={styles.downloadAllButton}
            >
              📦 Download All ({sizes.length} sizes)
            </button>
          )}
        </div>
      )}

      {status === 'processing' && (
        <p style={styles.processingText}>
          This may take 1-2 minutes. Please wait...
        </p>
      )}
    </div>
  );
}

// Add these new styles
const styles = {
  container: {
    marginTop: '20px',
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  title: {
    marginBottom: '15px',
    color: '#333',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  statusIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '14px',
    color: '#666',
  },
  errorBox: {
    padding: '15px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  errorText: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginBottom: '10px',
  },
  errorHint: {
    fontSize: '13px',
    marginBottom: '10px',
  },
  suggestionList: {
    fontSize: '13px',
    marginLeft: '20px',
    marginBottom: '15px',
  },
  retryButton: {
    padding: '8px 16px',
    background: '#c62828',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  downloadSection: {
    marginTop: '15px',
  },
  downloadHint: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '10px',
  },
  downloadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
    marginBottom: '15px',
  },
  downloadButton: {
    padding: '8px',
    background: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  downloadButtonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  downloadAllButton: {
    width: '100%',
    padding: '12px',
    background: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
  },
  processingText: {
    fontSize: '13px',
    color: '#ff9800',
    textAlign: 'center' as const,
  },
};