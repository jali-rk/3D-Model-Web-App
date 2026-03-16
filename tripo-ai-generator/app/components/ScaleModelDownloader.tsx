'use client';

import { useState } from 'react';

interface ScaledModelDownloaderProps {
  baseModelUrl: string;
  availableSizes: string[];
  onDownloadStart?: (size: string) => void;
  onDownloadComplete?: (size: string, blob: Blob) => void;
}

// Size scaling factors for display
const SIZE_SCALE_FACTORS: Record<string, number> = {
  'XS': 0.85,
  'S': 0.925,
  'M': 1.0,
  'L': 1.075,
  'XL': 1.15,
  'XXL': 1.225,
  'XXXL': 1.3
};

export default function ScaledModelDownloader({ 
  baseModelUrl, 
  availableSizes,
  onDownloadStart,
  onDownloadComplete
}: ScaledModelDownloaderProps) {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const downloadSize = async (size: string) => {
    setDownloading(prev => ({ ...prev, [size]: true }));
    setError(prev => ({ ...prev, [size]: '' }));
    setSuccess(prev => ({ ...prev, [size]: false }));

    if (onDownloadStart) {
      onDownloadStart(size);
    }

    try {
      console.log(`📥 Downloading scaled size ${size}...`);
      
      // Call our local scaling API
      const response = await fetch('/api/scale-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelUrl: baseModelUrl,
          targetSize: size
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to scale model: ${response.status}`);
      }

      // Get the blob
      const blob = await response.blob();
      
      // Get scale factor from headers
      const scaleFactor = response.headers.get('X-Scale-Factor') || 
        SIZE_SCALE_FACTORS[size].toString();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garment_${size}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`✅ Downloaded size ${size} (${(blob.size / 1024).toFixed(1)} KB)`);
      
      setSuccess(prev => ({ ...prev, [size]: true }));
      
      if (onDownloadComplete) {
        onDownloadComplete(size, blob);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, [size]: false }));
      }, 3000);
      
    } catch (err) {
      console.error(`❌ Error downloading size ${size}:`, err);
      setError(prev => ({ 
        ...prev, 
        [size]: err instanceof Error ? err.message : 'Download failed' 
      }));
    } finally {
      setDownloading(prev => ({ ...prev, [size]: false }));
    }
  };

  const downloadAll = async () => {
    for (const size of availableSizes) {
      await downloadSize(size);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  // Sort sizes in correct order
  const sortedSizes = [...availableSizes].sort((a, b) => {
    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📏 Generate Scaled Versions</h3>
      <p style={styles.description}>
        Create scaled versions from the base model (M)
      </p>
      
      <div style={styles.sizeGrid}>
        {sortedSizes.map((size) => (
          <div key={size} style={styles.sizeCard}>
            <div style={styles.sizeHeader}>
              <strong>Size {size}</strong>
              <span style={styles.scaleBadge}>
                {Math.round((SIZE_SCALE_FACTORS[size] || 1.0) * 100)}%
              </span>
            </div>
            
            <button
              onClick={() => downloadSize(size)}
              disabled={downloading[size]}
              style={{
                ...styles.downloadButton,
                ...(downloading[size] ? styles.downloadButtonDisabled : {}),
                ...(success[size] ? styles.downloadButtonSuccess : {})
              }}
            >
              {downloading[size] ? (
                <>
                  <span style={styles.spinner}></span>
                  Scaling...
                </>
              ) : success[size] ? (
                '✅ Downloaded!'
              ) : (
                `📥 Download ${size}`
              )}
            </button>
            
            {error[size] && (
              <div style={styles.errorText}>
                ❌ {error[size]}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {sortedSizes.length > 1 && (
        <button
          onClick={downloadAll}
          disabled={Object.values(downloading).some(Boolean)}
          style={styles.downloadAllButton}
        >
          {Object.values(downloading).some(Boolean) 
            ? '⏳ Scaling...' 
            : '📦 Download All Sizes'}
        </button>
      )}
      
      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          ⚡ Using local scaling with Three.js (same as Python script)
        </p>
        <p style={styles.infoText}>
          📊 Base size: M (1.0×) | XS: 0.85× | S: 0.925× | L: 1.075× | XL: 1.15× | XXL: 1.225× | XXXL: 1.3×
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '20px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e0e0e0'
  },
  title: {
    marginBottom: '5px',
    color: '#333',
    fontSize: '18px'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  sizeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  sizeCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  sizeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scaleBadge: {
    background: '#667eea',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const
  },
  downloadButton: {
    padding: '10px',
    background: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  downloadButtonDisabled: {
    background: '#ccc',
    cursor: 'not-allowed',
    opacity: 0.7
  },
  downloadButtonSuccess: {
    background: '#4caf50'
  },
  downloadAllButton: {
    width: '100%',
    padding: '12px',
    background: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginTop: '10px'
  },
  errorText: {
    fontSize: '12px',
    color: '#f44336',
    marginTop: '5px'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  },
  infoBox: {
    marginTop: '20px',
    padding: '10px',
    background: '#e3f2fd',
    borderRadius: '5px'
  },
  infoText: {
    fontSize: '12px',
    color: '#1976d2',
    margin: '5px 0'
  }
};