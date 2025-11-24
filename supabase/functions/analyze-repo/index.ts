import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { repoUrl } = await req.json();
    console.log('Analyzing repo:', repoUrl);

    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');

    // Fetch requirements.txt from GitHub
    const requirementsUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/main/requirements.txt`;
    console.log('Fetching requirements from:', requirementsUrl);
    
    let requirementsContent;
    try {
      const response = await fetch(requirementsUrl);
      if (!response.ok) {
        // Try master branch if main doesn't exist
        const masterUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/master/requirements.txt`;
        const masterResponse = await fetch(masterUrl);
        if (!masterResponse.ok) {
          throw new Error('requirements.txt not found in main or master branch');
        }
        requirementsContent = await masterResponse.text();
      } else {
        requirementsContent = await response.text();
      }
    } catch (error) {
      console.error('Error fetching requirements.txt:', error);
      throw new Error('Could not fetch requirements.txt from repository');
    }

    console.log('Requirements content length:', requirementsContent.length);

    // Analyze with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are a Python dependency expert. Analyze this requirements.txt file and provide:

1. Issues found (missing version pins, conflicts, outdated packages) - IMPORTANT: Categorize each issue
2. AI fix suggestions (specific version recommendations)
3. Dependency diff (before and after versions)

Requirements.txt content:
\`\`\`
${requirementsContent}
\`\`\`

CRITICAL: Respond ONLY with a valid JSON object. Do not include markdown code blocks, explanatory text, or any formatting. Return raw JSON only.

Use this exact structure:
{
  "issues": [
    {
      "title": "Issue title",
      "package": "package-name",
      "severity": "high|medium|low",
      "category": "missing_pin|conflict|outdated",
      "description": "Detailed description"
    }
  ],
  "suggestions": [
    "Specific actionable suggestion as a string"
  ],
  "dependencyDiff": [
    {
      "package": "package-name",
      "before": "detected version or 'unversioned'",
      "after": "suggested version"
    }
  ]
}

IMPORTANT: Categorize issues correctly:
- "missing_pin": When a package has no version specified
- "conflict": When package versions conflict with each other
- "outdated": When a package has an old version available`;

    console.log('Calling AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a Python dependency analysis expert. Always respond with valid JSON only, no additional text.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    // Strip markdown code blocks if present
    let content = aiData.choices[0].message.content;
    console.log('Raw AI content:', content.substring(0, 100));
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    console.log('Cleaned content:', content.substring(0, 100));
    
    const analysisResult = JSON.parse(content);

    // Calculate reproducibility score using weighted algorithm
    let score = 50; // Base score
    
    // 1. Version Pinning (0-30 points)
    const unpinnedPackages = analysisResult.dependencyDiff.filter((dep: any) => 
      dep.before === "unversioned"
    );
    const totalPackages = analysisResult.dependencyDiff.length;
    
    if (totalPackages > 0) {
      const pinnedPercentage = ((totalPackages - unpinnedPackages.length) / totalPackages) * 100;
      score += Math.round((pinnedPercentage / 100) * 30);
    }
    
    // 2. Conflicts (0-25 points)
    const conflicts = analysisResult.issues.filter((issue: any) => 
      issue.category === "conflict" || issue.severity === "high"
    );
    
    if (conflicts.length === 0) {
      score += 25;
    } else if (conflicts.length <= 2) {
      score += 15;
    } else if (conflicts.length <= 5) {
      score += 5;
    }
    
    // 3. Package Health (0-15 points)
    const outdated = analysisResult.issues.filter((issue: any) => 
      issue.category === "outdated"
    );
    
    if (outdated.length === 0) {
      score += 15;
    } else if (outdated.length <= 3) {
      score += 10;
    } else if (outdated.length <= 6) {
      score += 5;
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    analysisResult.reproducibilityScore = score;
    
    console.log(`Calculated reproducibility score: ${score}`);

    return new Response(JSON.stringify({
      success: true,
      data: analysisResult,
      rawRequirements: requirementsContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-repo:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
