import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shareToken = url.searchParams.get('token');

    if (!shareToken) {
      return new Response(
        JSON.stringify({ error: 'Missing share token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch shared result
    const { data, error } = await supabase
      .from('shared_results')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (error || !data) {
      console.error('Error fetching shared result:', error);
      return new Response(
        JSON.stringify({ error: 'Shared result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment view count (using service role for write permission)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin
      .from('shared_results')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('share_token', shareToken);

    console.log('Share viewed:', shareToken, 'Views:', data.view_count + 1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          analysisData: data.analysis_data,
          repositoryUrl: data.repository_url,
          createdAt: data.created_at,
          viewCount: (data.view_count || 0) + 1,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-share:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});