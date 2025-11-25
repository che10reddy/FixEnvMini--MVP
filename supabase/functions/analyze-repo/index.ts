import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

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

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract owner and repo from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');

    // Check cache first - get latest commit SHA for cache key
    console.log('Checking for cached results...');
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`
    );
    
    let cacheKey = repoUrl;
    if (commitResponse.ok) {
      const commits = await commitResponse.json();
      if (commits.length > 0) {
        const latestCommit = commits[0].sha.substring(0, 7);
        cacheKey = `${repoUrl}-${latestCommit}`;
        console.log(`Cache key: ${cacheKey}`);
        
        // Try to fetch cached result
        const { data: cachedResult } = await supabase
          .from('shared_results')
          .select('analysis_data, created_at')
          .eq('repository_url', cacheKey)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hour TTL
          .maybeSingle();
        
        if (cachedResult) {
          console.log('✓ Cache hit! Returning cached analysis');
          return new Response(JSON.stringify({
            success: true,
            cached: true,
            ...cachedResult.analysis_data
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    
    console.log('Cache miss, proceeding with fresh analysis');

    // Detect branch (main or master)
    console.log(`Detecting branch for ${owner}/${repoName}...`);
    let branch = 'main';
    const testMainResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/branches/main`
    );
    if (!testMainResponse.ok) {
      branch = 'master';
    }
    console.log(`Using branch: ${branch}`);

    // Fetch multiple dependency file types
    const fileChecks = [
      { name: 'requirements.txt', type: 'pip', format: 'Requirements.txt' },
      { name: 'pyproject.toml', type: 'poetry', format: 'Poetry (pyproject.toml)' },
      { name: 'poetry.lock', type: 'poetry-lock', format: 'Poetry Lock' },
      { name: 'Pipfile', type: 'pipenv', format: 'Pipenv' },
      { name: 'Pipfile.lock', type: 'pipenv-lock', format: 'Pipenv Lock' },
      { name: 'setup.py', type: 'setuptools', format: 'Setup.py' },
    ];

    // Fetch all dependency files in parallel
    console.log('Fetching dependency files in parallel...');
    const filePromises = fileChecks.map(async (file) => {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${file.name}`
        );
        if (response.ok) {
          const content = await response.text();
          console.log(`✓ Found ${file.name} (${content.length} bytes)`);
          return { name: file.name, type: file.type, format: file.format, content };
        }
      } catch (error) {
        // File doesn't exist, return null
      }
      return null;
    });

    const fileResults = await Promise.all(filePromises);
    const foundFiles = fileResults.filter((file): file is { name: string; type: string; format: string; content: string } => file !== null);

    if (foundFiles.length === 0) {
      throw new Error('No Python dependency files found (requirements.txt, pyproject.toml, Pipfile, or setup.py)');
    }

    console.log(`Found ${foundFiles.length} dependency file(s):`, foundFiles.map(f => f.name).join(', '));
    
    // Determine primary format
    const detectedFormats = [...new Set(foundFiles.map(f => f.format))];
    const primaryFormat = foundFiles[0].format;

    // Detect Python version from multiple sources
    console.log('Detecting Python version...');
    const pythonVersionSources = [
      { name: 'runtime.txt', pattern: /python-(\d+\.\d+\.?\d*)/i },
      { name: '.python-version', pattern: /(\d+\.\d+\.?\d*)/ },
      { name: '.github/workflows/ci.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
      { name: '.github/workflows/main.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
      { name: '.github/workflows/test.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
    ];

    let detectedPythonVersion = '';
    let pythonVersionSource = '';

    // Check pyproject.toml first (already fetched)
    const pyprojectFile = foundFiles.find(f => f.name === 'pyproject.toml');
    if (pyprojectFile && !detectedPythonVersion) {
      const pythonMatch = pyprojectFile.content.match(/python\s*=\s*["']([^"']+)["']/);
      if (pythonMatch) {
        detectedPythonVersion = pythonMatch[1];
        pythonVersionSource = 'pyproject.toml';
        console.log(`✓ Found Python version in pyproject.toml: ${detectedPythonVersion}`);
      }
    }

    // Check other Python version files with early exit
    if (!detectedPythonVersion) {
      // Check .python-version first (most common)
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/.python-version`
        );
        if (response.ok) {
          const content = await response.text();
          const match = content.match(/(\d+\.\d+\.?\d*)/);
          if (match) {
            detectedPythonVersion = match[1];
            pythonVersionSource = '.python-version';
            console.log(`✓ Found Python version in .python-version: ${detectedPythonVersion}`);
          }
        }
      } catch (error) {
        // File doesn't exist
      }
    }

    // If still not found, check other sources
    if (!detectedPythonVersion) {
      for (const source of pythonVersionSources) {
        if (detectedPythonVersion) break;
        
        try {
          const response = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${source.name}`
          );
          if (response.ok) {
            const content = await response.text();
            const match = content.match(source.pattern);
            if (match) {
              detectedPythonVersion = match[1];
              pythonVersionSource = source.name;
              console.log(`✓ Found Python version in ${source.name}: ${detectedPythonVersion}`);
              break;
            }
          }
        } catch (error) {
          // File doesn't exist, continue
        }
      }
    }

    if (!detectedPythonVersion) {
      console.log('⚠ No Python version file found, will use general compatibility checks');
      detectedPythonVersion = 'unknown';
      pythonVersionSource = 'not detected';
    }

    // Analyze with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build comprehensive dependency analysis prompt
    let filesContent = '';
    foundFiles.forEach(file => {
      filesContent += `\n--- ${file.name} (${file.format}) ---\n${file.content}\n`;
    });

    const pythonVersionInfo = detectedPythonVersion !== 'unknown' 
      ? `\n\nDETECTED PYTHON VERSION: ${detectedPythonVersion} (from ${pythonVersionSource})\nIMPORTANT: Check all packages for compatibility with Python ${detectedPythonVersion}`
      : '\n\nNOTE: No Python version detected. Provide general compatibility warnings for common Python version issues.';

    const aiPrompt = `Analyze Python dependencies for reproducibility issues.

FILES: ${foundFiles.map(f => f.name).join(', ')}
${pythonVersionInfo}

KEY PATTERNS:
1. Missing pins: numpy (no version)
2. Python compatibility: pandas <1.5 breaks on 3.11+, TensorFlow 2.3 needs 3.6-3.8, NumPy <1.22 breaks on 3.11+
3. Conflicts: scipy 1.5.x + numpy 1.26.x, protobuf 4.x + TensorFlow 2.4
4. Breaking upgrades: SQLAlchemy 2.0 + Flask-SQLAlchemy <3, Pydantic 2.0 + FastAPI <0.100
5. Deprecated: sklearn → scikit-learn
6. CUDA mismatches: torch versions need matching CUDA

EXAMPLES:
1. "numpy\npandas==1.3.0" → Issue: Missing numpy pin (high severity)
2. "pandas==1.2.4" + Python 3.11 → Issue: Incompatible (upgrade to 2.1.0)

FILES:
${filesContent}

Return valid JSON only:
{
  "issues": [{"title": "", "package": "", "severity": "high|medium|low", "category": "missing_pin|conflict|outdated", "description": ""}],
  "suggestions": [""],
  "dependencyDiff": [{"package": "", "before": "", "after": ""}]
}`;

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

    // Store result in cache for 24 hours
    const resultData = {
      data: analysisResult,
      detectedFormats: detectedFormats,
      primaryFormat: primaryFormat,
      pythonVersion: detectedPythonVersion,
      pythonVersionSource: pythonVersionSource,
      foundFiles: foundFiles.map(f => ({ name: f.name, format: f.format })),
      rawRequirements: foundFiles[0].content,
    };

    try {
      await supabase.from('shared_results').insert({
        repository_url: cacheKey,
        share_token: `cache-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        analysis_data: resultData,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      console.log('✓ Result cached successfully');
    } catch (cacheError) {
      console.error('Cache storage failed (non-critical):', cacheError);
    }

    return new Response(JSON.stringify({
      success: true,
      ...resultData,
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
