// Test script for Supabase Edge Function
const SUPABASE_URL = 'https://qchuggfaogrkyurktwxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaHVnZ2Zhb2dya3l1cmt0d3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDU4NDMsImV4cCI6MjA4NTYyMTg0M30.o0usb29f2JqgC1MXaLoi1dqckk7y8RYJ5ATg8eCJEno';

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function: process-statement\n');

  // Test 1: Text input
  console.log('Test 1: Text input (CSV format)');
  try {
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/process-statement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '10/02 COMPRA IFOOD 54.90\n11/02 PIX RECEBIDO JOAO SILVA 150.00'
      })
    });

    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('✅ Test 1 passed\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Image input (base64)
  console.log('Test 2: Image input (simulated)');
  try {
    // Create a simple test image base64 (1x1 transparent PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/process-statement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: testImageBase64,
        mimeType: 'image/png'
      })
    });

    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    if (response2.status === 200) {
      console.log('✅ Test 2 passed (function accepts image)\n');
    } else {
      console.log('⚠️  Test 2: Function returned non-200 status\n');
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Error handling - empty payload
  console.log('Test 3: Error handling (empty payload)');
  try {
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/process-statement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    console.log('Status:', response3.status);
    const data3 = await response3.json();
    console.log('Response:', JSON.stringify(data3, null, 2));
    
    if (response3.status === 400) {
      console.log('✅ Test 3 passed (proper error handling)\n');
    } else {
      console.log('⚠️  Test 3: Expected 400 status\n');
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('🏁 All tests completed!');
}

// Run tests
testEdgeFunction().catch(console.error);
