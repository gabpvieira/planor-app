// Test PDF upload to Edge Function
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://qchuggfaogrkyurktwxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaHVnZ2Zhb2dya3l1cmt0d3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDU4NDMsImV4cCI6MjA4NTYyMTg0M30.o0usb29f2JqgC1MXaLoi1dqckk7y8RYJ5ATg8eCJEno';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPDFUpload() {
  console.log('🧪 Testing PDF Upload\n');

  // Test with a simple text payload first
  console.log('Test 1: Simple text (baseline)');
  try {
    const { data, error } = await supabase.functions.invoke('process-statement', {
      body: {
        text: '10/02 COMPRA IFOOD 54.90'
      }
    });

    if (error) {
      console.error('❌ Text test failed:', error);
    } else {
      console.log('✅ Text test passed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test with a fake PDF base64
  console.log('\nTest 2: PDF base64 (simulated)');
  try {
    // Create a minimal PDF base64 (just for testing the endpoint)
    const fakePdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtUm9tYW4+PgplbmRvYmoKNSAwIG9iago8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDI1NyAwMDAwMCBuIAowMDAwMDAwMzM2IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA2L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDI4CiUlRU9G';

    const { data, error } = await supabase.functions.invoke('process-statement', {
      body: {
        pdfBase64: fakePdfBase64,
        mimeType: 'application/pdf'
      }
    });

    if (error) {
      console.error('❌ PDF test failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ PDF test passed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n🏁 Tests completed');
}

testPDFUpload().catch(console.error);
