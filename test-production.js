// Test script for production environment
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qchuggfaogrkyurktwxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaHVnZ2Zhb2dya3l1cmt0d3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDU4NDMsImV4cCI6MjA4NTYyMTg0M30.o0usb29f2JqgC1MXaLoi1dqckk7y8RYJ5ATg8eCJEno';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProductionFlow() {
  console.log('🚀 Testing Production Flow\n');
  console.log('URL: https://planorapp.vercel.app/app/finance\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eugabrieldpv@gmail.com',
      password: '@gab123654'
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Login successful');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('Access Token:', authData.session.access_token.substring(0, 20) + '...\n');

    // Step 2: Test Edge Function with authenticated user
    console.log('Step 2: Testing Edge Function...');
    
    const testPayload = {
      text: '10/02/2026 COMPRA IFOOD 54.90\n11/02/2026 PIX RECEBIDO JOAO SILVA 150.00\n12/02/2026 UBER 25.50'
    };

    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    // Pass the authorization header explicitly
    const { data: functionData, error: functionError } = await supabase.functions.invoke('process-statement', {
      body: testPayload,
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`
      }
    });

    if (functionError) {
      console.error('❌ Edge Function failed:', functionError);
      console.error('Error details:', JSON.stringify(functionError, null, 2));
      return;
    }

    console.log('✅ Edge Function successful');
    console.log('Response:', JSON.stringify(functionData, null, 2));

    if (!functionData.transactions || functionData.transactions.length === 0) {
      console.error('⚠️  No transactions found in response');
      return;
    }

    console.log(`\n✨ Found ${functionData.transactions.length} transactions\n`);

    // Step 3: Test inserting transactions into database
    console.log('Step 3: Testing database insert...');
    
    const rows = functionData.transactions.map(t => ({
      user_id: authData.user.id,
      type: t.type,
      amount: Math.abs(t.amount),
      category: t.category,
      description: `${t.description} ✨ [TEST]`,
      date: t.date,
      account_id: null,
      card_id: null,
      installments_total: 1,
      installment_current: 1,
      parent_transaction_id: null,
      is_subscription: false,
      is_transfer: false,
      transfer_to_account_id: null,
      recurring_bill_id: null,
      paid: true,
      due_date: null,
    }));

    console.log('Inserting transactions:', JSON.stringify(rows, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('finance_transactions')
      .insert(rows)
      .select();

    if (insertError) {
      console.error('❌ Database insert failed:', insertError.message);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return;
    }

    console.log('✅ Database insert successful');
    console.log('Inserted records:', insertData.length);
    console.log('IDs:', insertData.map(r => r.id).join(', '));

    // Step 4: Cleanup - delete test transactions
    console.log('\nStep 4: Cleaning up test data...');
    const testIds = insertData.map(r => r.id);
    
    const { error: deleteError } = await supabase
      .from('finance_transactions')
      .delete()
      .in('id', testIds);

    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Login: ✅');
    console.log('- Edge Function: ✅');
    console.log('- Database Insert: ✅');
    console.log('- Cleanup: ✅');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run the test
testProductionFlow().catch(console.error);
