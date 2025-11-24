import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dependencies } = await req.json();
    console.log('Generating snapshot for dependencies:', Object.keys(dependencies || {}).length);

    // Create a .zfix snapshot file format
    const snapshot = {
      python_version: "3.10",
      dependencies: dependencies || {},
      checksum: `sha256:${generateChecksum(JSON.stringify(dependencies))}`,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      snapshot,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-snapshot:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateChecksum(str: string): string {
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
