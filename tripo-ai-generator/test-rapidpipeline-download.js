// test-rapidpipeline-download.js - FIXED VERSION
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const RAPIDPIPELINE_API_KEY = '';
const BASE_URL = 'https://api-lb.rapidpipeline.com/api/v2';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SCALE_FACTORS = {
  'XS': 0.85,
  'S': 0.925,
  'M': 1.0,
  'L': 1.075,
  'XL': 1.15,
  'XXL': 1.225,
  'XXXL': 1.3
};

async function createScalingJobs(baseAssetId) {
  console.log(`\n🔄 Creating scaling jobs for base asset: ${baseAssetId}`);
  
  // First, check if model exists
  const modelResponse = await fetch(`${BASE_URL}/rawmodel/${baseAssetId}`, {
    headers: {
      'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`
    }
  });

  if (!modelResponse.ok) {
    const error = await modelResponse.text();
    throw new Error(`Failed to get model: ${modelResponse.status} - ${error}`);
  }

  const modelData = await modelResponse.json();
  console.log('📊 Model data:', JSON.stringify(modelData, null, 2));
  
  // Wait a bit for processing
  console.log('⏳ Waiting 5 seconds for processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Create optimization jobs for each size
  const jobIds = {};
  
  for (const size of SIZES) {
    console.log(`\n📏 Creating job for size ${size} (scale: ${SCALE_FACTORS[size]})...`);
    
    // Try different endpoint formats
    const endpoints = [
      `${BASE_URL}/rawmodel/${baseAssetId}/optimize`,
      `${BASE_URL}/rawmodel/process/${baseAssetId}`,
      `${BASE_URL}/base-asset/${baseAssetId}/optimize`
    ];
    
    let success = false;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying endpoint: ${endpoint}`);
        
        const optimizeResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: {
              version: 1.3,
              "3dEdit": {
                modelEdit: {
                  scalingFactor: SCALE_FACTORS[size]
                }
              },
              export: [
                {
                  format: {
                    glb: {}
                  }
                }
              ]
            }
          })
        });

        if (optimizeResponse.ok) {
          const optimizeData = await optimizeResponse.json();
          jobIds[size] = optimizeData.jobId || optimizeData.id;
          console.log(`✅ Job created for size ${size}: ${jobIds[size]}`);
          success = true;
          break;
        } else {
          const error = await optimizeResponse.text();
          console.log(`   ❌ Endpoint failed: ${optimizeResponse.status}`);
        }
      } catch (err) {
        console.log(`   ❌ Error with endpoint: ${err.message}`);
      }
    }
    
    if (!success) {
      console.error(`❌ Failed to create job for size ${size} on all endpoints`);
    }
  }

  return jobIds;
}

async function waitForJobs(baseAssetId, jobIds) {
  console.log('\n⏳ Waiting for all jobs to complete...');
  const results = {};

  for (const [size, jobId] of Object.entries(jobIds)) {
    console.log(`\n📊 Checking job ${jobId} for size ${size}...`);
    
    let status = 'pending';
    let attempts = 0;
    const maxAttempts = 30;

    while (status !== 'success' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try different status endpoints
      const statusEndpoints = [
        `${BASE_URL}/rawmodel/${baseAssetId}/jobs`,
        `${BASE_URL}/base-asset/${baseAssetId}/jobs`,
        `${BASE_URL}/jobs/${jobId}`
      ];
      
      for (const endpoint of statusEndpoints) {
        try {
          const statusResponse = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`
            }
          });

          if (statusResponse.ok) {
            const data = await statusResponse.json();
            
            // Try to find the job in the response
            let jobStatus = null;
            if (Array.isArray(data)) {
              const job = data.find(j => j.jobId === jobId || j.id === jobId);
              if (job) jobStatus = job.status;
            } else if (data.status) {
              jobStatus = data.status;
            }
            
            if (jobStatus) {
              status = jobStatus;
              console.log(`   Size ${size}: ${status} (${attempts + 1}/${maxAttempts})`);
              break;
            }
          }
        } catch (err) {
          // Ignore endpoint errors
        }
      }
      
      attempts++;
    }

    if (status === 'success') {
      // Try to get download URL
      const downloadEndpoints = [
        `${BASE_URL}/rawmodel/${baseAssetId}/download-urls`,
        `${BASE_URL}/base-asset/${baseAssetId}/download-urls`
      ];
      
      for (const endpoint of downloadEndpoints) {
        try {
          const downloadResponse = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`
            }
          });

          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            console.log(`📥 Download data for size ${size}:`, JSON.stringify(downloadData, null, 2));
            
            // Look for any URL that might be the model
            const urls = [];
            if (downloadData.downloads) {
              urls.push(...downloadData.downloads.map(d => d.url));
            }
            if (downloadData.urls) {
              urls.push(...Object.values(downloadData.urls));
            }
            
            if (urls.length > 0) {
              results[size] = urls[0];
              console.log(`✅ Got URL for size ${size}`);
              break;
            }
          }
        } catch (err) {
          // Ignore download endpoint errors
        }
      }
    }
  }

  return results;
}

async function downloadAllSizes(downloadUrls) {
  console.log('\n📥 Downloading all size variants...');
  
  for (const [size, url] of Object.entries(downloadUrls)) {
    console.log(`   Downloading size ${size} from: ${url}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`   ❌ Failed to download size ${size}: ${response.status}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const outputPath = path.join(__dirname, `garment_${size}.glb`);
      fs.writeFileSync(outputPath, buffer);
      
      const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
      console.log(`   ✅ Saved garment_${size}.glb (${fileSizeMB} MB)`);
    } catch (err) {
      console.error(`   ❌ Error downloading size ${size}: ${err.message}`);
    }
  }
}

async function main() {
  try {
    const baseAssetId = 9541058;
    
    console.log('🚀 Starting scaling process...');
    console.log('📡 Using API URL:', BASE_URL);
    console.log('🔑 Using API Key:', RAPIDPIPELINE_API_KEY.substring(0, 10) + '...');
    
    // First, let's check what endpoints are available
    console.log('\n🔍 Testing API connection...');
    
    const testEndpoints = [
      `${BASE_URL}/rawmodel/${baseAssetId}`,
      `${BASE_URL}/base-asset/${baseAssetId}`
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`
          }
        });
        console.log(`📡 ${endpoint}: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
      } catch (err) {
        console.log(`📡 ${endpoint}: Error - ${err.message}`);
      }
    }
    
    // Step 1: Create scaling jobs
    const jobIds = await createScalingJobs(baseAssetId);
    
    if (Object.keys(jobIds).length === 0) {
      console.log('❌ No jobs were created successfully');
      return;
    }

    console.log('\n📊 Jobs created:', jobIds);

    // Step 2: Wait for jobs to complete and get download URLs
    const downloadUrls = await waitForJobs(baseAssetId, jobIds);

    if (Object.keys(downloadUrls).length === 0) {
      console.log('❌ No successful downloads available');
      return;
    }

    // Step 3: Download all sizes
    await downloadAllSizes(downloadUrls);
    
    console.log('\n✨ All done! Check your folder for the scaled GLB files.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();