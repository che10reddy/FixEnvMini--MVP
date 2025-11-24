import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { analysisData, repositoryUrl } = await req.json();

    if (!analysisData || !repositoryUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: analysisData and repositoryUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique share token
    let shareToken = generateShareToken();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure token is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('shared_results')
        .select('id')
        .eq('share_token', shareToken)
        .single();

      if (!existing) break;
      shareToken = generateShareToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique share token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store shared result
    const { data, error } = await supabase
      .from('shared_results')
      .insert({
        share_token: shareToken,
        analysis_data: analysisData,
        repository_url: repositoryUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared result:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create shared result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Share created:', shareToken);

    return new Response(
      JSON.stringify({ 
        success: true, 
        shareToken,
        shareUrl: `${req.headers.get('origin')}/share/${shareToken}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-share:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});