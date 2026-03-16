import React, { useState, useEffect } from 'react';
import AvatarViewer from './components/AvatarViewer';
import MaleControls from './components/MaleControls';
import FemaleControls from './components/FemaleControls';
import GarmentControls from './components/GarmentControls';
import { avatarApi } from './services/api';
import type { Garment, GarmentItem } from './types';
import './App.css';

interface MaleMeasurements {
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hips: number;
}

interface FemaleMeasurements {
  height: number;
  weight: number;
  bust: number;
  waist: number;
  hips: number;
}

const App: React.FC = () => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedGarments, setSelectedGarments] = useState<GarmentItem[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState(true);

  const [maleForm, setMaleForm] = useState<MaleMeasurements>({
    height: 175,
    weight: 75,
    shoulder: 48,
    chest: 100,
    waist: 80,
    hips: 95
  });

  const [femaleForm, setFemaleForm] = useState<FemaleMeasurements>({
    height: 165,
    weight: 60,
    bust: 90,
    waist: 65,
    hips: 95
  });

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await avatarApi.healthCheck();
        setBackendHealthy(healthy);
        if (healthy) {
          fetchGarments();
        }
      } catch (err) {
        setBackendHealthy(false);
        setError('Cannot connect to backend server');
      }
    };
    checkHealth();
  }, []);

  const fetchGarments = async () => {
    try {
      const response = await avatarApi.getGarments();
      setGarments(response.garments);
    } catch (err) {
      console.error('Failed to load garments:', err);
    }
  };

  const generateAvatar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = gender === 'male' ? maleForm : femaleForm;
      
      // Prepare request with garment items (including sizes)
      const request = {
        gender,
        ...formData,
        garments: [], // Legacy field - empty
        garment_items: selectedGarments
      };
      
      console.log('🚀 Sending to backend:', request);
      
      const response = await avatarApi.generateAvatar(request);
      setAvatarUrl(response.avatar_url);
      console.log('✅ Avatar generated:', response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
      console.error('❌ Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // For backward compatibility with existing components that expect string[]
  const selectedGarmentIds = selectedGarments.map(g => g.id);

  return (
    <div className="app">
      <header>
        <h1>✨ Fashion Avatar Generator ✨</h1>
        <p>Create your 3D fashion model with SMPL-X technology</p>
        {!backendHealthy && (
          <div className="error-banner">
            ⚠️ Backend server not running. Please start the server.
          </div>
        )}
      </header>
      
      <div className="gender-selector">
        <button 
          onClick={() => setGender('male')}
          className={gender === 'male' ? 'active' : ''}
          disabled={!backendHealthy}
        >
          👨 Male
        </button>
        <button 
          onClick={() => setGender('female')}
          className={gender === 'female' ? 'active' : ''}
          disabled={!backendHealthy}
        >
          👩 Female
        </button>
      </div>
      
      <div className="main-content">
        <div className="controls-panel">
          <h2>Body Measurements</h2>
          {gender === 'male' ? (
            <MaleControls 
              form={maleForm} 
              setForm={setMaleForm} 
              disabled={loading || !backendHealthy}
            />
          ) : (
            <FemaleControls 
              form={femaleForm} 
              setForm={setFemaleForm} 
              disabled={loading || !backendHealthy}
            />
          )}
          
          <h2 style={{ marginTop: '30px' }}>Garments</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
            Click on a garment to select it, then choose size
          </p>
          <GarmentControls 
            garments={garments}
            selectedGarments={selectedGarments}
            setSelectedGarments={setSelectedGarments}
            disabled={loading || !backendHealthy}
          />
          
          {selectedGarments.length > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: '#f0f0f0',
              borderRadius: '5px',
              fontSize: '13px'
            }}>
              <strong>Selected:</strong> {selectedGarments.map(g => 
                `${g.id} (${g.size})`
              ).join(', ')}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            className="generate-btn" 
            onClick={generateAvatar}
            disabled={loading || !backendHealthy}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generating... (may take 2-3 minutes)
              </>
            ) : (
              '👕 Generate Fashion Avatar'
            )}
          </button>

          {avatarUrl && (
            <div className="success-message">
              ✓ Avatar generated successfully!
            </div>
          )}
        </div>
        
        <div className="viewer-panel">
          <AvatarViewer 
            url={avatarUrl} 
            garments={selectedGarmentIds} // Pass just IDs for display
          />
        </div>
      </div>
    </div>
  );
};

export default App;