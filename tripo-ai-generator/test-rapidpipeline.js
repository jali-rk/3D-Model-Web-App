// test-rapidpipeline.js - CORRECTED VERSION
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// CORRECT BASE URL from documentation
const RAPIDPIPELINE_API_URL = 'https://api.rapidpipeline.com/api/v2';
const RAPIDPIPELINE_API_KEY = '';

async function testRapidPipeline() {
  try {
    console.log('📁 Reading GLB file...');
    const glbPath = path.join(__dirname, 'test_template.glb');
    const glbBuffer = fs.readFileSync(glbPath);
    const fileSizeMB = (glbBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`✅ File size: ${fileSizeMB} MB`);

    // Step 1: Start upload and get signed URLs
    console.log('\n📤 Starting upload process...');
    const startResponse = await fetch(`${RAPIDPIPELINE_API_URL}/rawmodel/api-upload/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_name: 'test_garment',
        filenames: ['model.glb']
      })
    });

    if (!startResponse.ok) {
      const error = await startResponse.text();
      console.error('❌ Start upload failed:', startResponse.status, error);
      return;
    }

    const startData = await startResponse.json();
    console.log('✅ Upload started:', startData);
    
    const baseAssetId = startData.id;
    const uploadUrl = startData.links.s3_upload_urls['model.glb'];
    const completeUrl = startData.links.complete_upload;

    // Step 2: Upload file to S3 using signed URL
    console.log('\n📤 Uploading file to S3...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: glbBuffer,
      headers: {
        'Content-Type': 'model/gltf-binary'
      }
    });

    if (!uploadResponse.ok) {
      console.error('❌ S3 upload failed:', uploadResponse.status);
      return;
    }
    console.log('✅ File uploaded to S3');

    // Step 3: Complete the upload
    console.log('\n✅ Completing upload...');
    const completeResponse = await fetch(completeUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RAPIDPIPELINE_API_KEY}`
      }
    });

    if (!completeResponse.ok) {
      console.error('❌ Complete upload failed:', completeResponse.status);
      return;
    }

    const completeData = await completeResponse.json();
    console.log('✅ Upload complete!', completeData);
    console.log(`\n🎉 Success! Base Asset ID: ${baseAssetId}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRapidPipeline();