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
    const fetchPromises = fileChecks.map(async (file) => {
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
        // File doesn't exist, skip
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const foundFiles = results.filter((file): file is { name: string; type: string; format: string; content: string } => file !== null);

    if (foundFiles.length === 0) {
      throw new Error('No Python dependency files found (requirements.txt, pyproject.toml, Pipfile, or setup.py)');
    }

    console.log(`Found ${foundFiles.length} dependency file(s):`, foundFiles.map(f => f.name).join(', '));
    
    // Determine primary format
    const detectedFormats = [...new Set(foundFiles.map(f => f.format))];
    const primaryFormat = foundFiles[0].format;

    // Detect Python version from multiple sources (optimized)
    console.log('Detecting Python version...');
    let detectedPythonVersion = '';
    let pythonVersionSource = '';

    // Check pyproject.toml first (already fetched)
    const pyprojectFile = foundFiles.find(f => f.name === 'pyproject.toml');
    if (pyprojectFile) {
      const pythonMatch = pyprojectFile.content.match(/python\s*=\s*["']([^"']+)["']/);
      if (pythonMatch) {
        detectedPythonVersion = pythonMatch[1];
        pythonVersionSource = 'pyproject.toml';
        console.log(`✓ Found Python version in pyproject.toml: ${detectedPythonVersion}`);
      }
    }

    // Only check additional files if not found in pyproject.toml
    if (!detectedPythonVersion) {
      const pythonVersionSources = [
        { name: '.python-version', pattern: /(\d+\.\d+\.?\d*)/ },
        { name: 'runtime.txt', pattern: /python-(\d+\.\d+\.?\d*)/i },
        { name: '.github/workflows/ci.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
        { name: '.github/workflows/main.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
        { name: '.github/workflows/test.yml', pattern: /python-version:\s*['"]?(\d+\.\d+\.?\d*)['"]?/i },
      ];

      for (const source of pythonVersionSources) {
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
              break; // Stop immediately after finding first match
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

    const aiPrompt = `You are an expert Python dependency analyst. Analyze the following Python dependency file(s) using your knowledge of common dependency issues.

DETECTED FILES:
${foundFiles.map(f => `- ${f.name} (${f.format})`).join('\n')}
${pythonVersionInfo}

KNOWN PATTERNS TO DETECT:

1. Missing Version Pins: Unpinned packages (e.g., numpy with no version) cause version drift
2. Python Compatibility (CRITICAL - Check against detected Python version):
   - pandas <1.5 incompatible with Python 3.11+
   - TensorFlow 2.3 only supports Python 3.6-3.8
   - Django 2.2 incompatible with Python 3.10+
   - matplotlib 3.1.0 requires Python <3.11
   - NumPy <1.22 incompatible with Python 3.11+
   - asyncio compatibility issues with Python <3.7
   - typing module changes between Python 3.5-3.10
3. CUDA Mismatches: torch 2.1.0 requires CUDA 12.1 (not 11.7), torch 1.13.1+cu117 for CUDA 11.7
4. Breaking Upgrades:
   - SQLAlchemy 2.0 breaks Flask-SQLAlchemy <3
   - Pydantic 2.0 breaks FastAPI <0.100
   - jinja2 2.x incompatible with Flask 2.2+
5. Conflicting Versions:
   - scipy 1.5.x incompatible with numpy 1.26.x
   - protobuf 4.x breaks TensorFlow 2.4 (needs 3.20.x)
6. Deprecated Packages: sklearn → scikit-learn
7. Missing Dependencies: Check for commonly imported but unlisted packages (requests, pytest)
8. Duplicate Packages: Same package listed twice with different versions
9. Platform Issues: CuPy CUDA wheels unavailable on Windows, faiss-cpu <1.7.4 needs compilers
10. Indirect Conflicts: transformers 4.33+ requires tokenizers 0.14+
11. Wrong Build Types: GPU builds (torch+cu118) on CPU systems
12. Typos: Common misspellings (numpi → numpy)
13. Multi-Format Issues:
    - Poetry: Check for dev-dependencies that should be in main dependencies
    - Pipenv: Look for conflicts between Pipfile and Pipfile.lock
    - Setup.py: Check for missing install_requires or incorrect version constraints

FEW-SHOT EXAMPLES:

Example 1 - Missing Pin:
Input: "numpy\npandas==1.3.0"
Output Issue: {"title": "Missing version pin for numpy", "package": "numpy", "severity": "high", "category": "missing_pin", "description": "Unpinned numpy leads to version drift and potential incompatibility with pandas==1.3.0"}
Output Suggestion: "Pin numpy to a compatible version: numpy==1.21.6"

Example 2 - Python Compatibility:
Input: "pandas==1.2.4" (Python 3.11)
Output Issue: {"title": "pandas incompatible with Python 3.11", "package": "pandas", "severity": "high", "category": "conflict", "description": "pandas <1.5 does not support Python 3.11"}
Output Suggestion: "Upgrade to pandas==2.1.0 for Python 3.11 compatibility"

Example 3 - Conflicting Versions:
Input: "numpy==1.26.0\nscipy==1.5.4"
Output Issue: {"title": "scipy incompatible with numpy 1.26.x", "package": "scipy", "severity": "high", "category": "conflict", "description": "scipy 1.5.x cannot work with numpy 1.26.x"}
Output Suggestion: "Upgrade scipy to 1.10.1 or downgrade numpy to 1.23.5"

Example 4 - Deprecated Package:
Input: "sklearn==0.0"
Output Issue: {"title": "Deprecated package 'sklearn'", "package": "sklearn", "severity": "medium", "category": "outdated", "description": "sklearn is a deprecated meta-package, use scikit-learn instead"}
Output Suggestion: "Replace with scikit-learn==1.3.0"

NOW ANALYZE THESE DEPENDENCY FILES:

${filesContent}

CRITICAL: Respond ONLY with a valid JSON object. No markdown, no explanatory text, raw JSON only.

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

CATEGORY RULES:
- "missing_pin": Package has no version specified
- "conflict": Package versions conflict with each other or with Python version
- "outdated": Package has an old version that should be upgraded`;

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
      detectedFormats: detectedFormats,
      primaryFormat: primaryFormat,
      pythonVersion: detectedPythonVersion,
      pythonVersionSource: pythonVersionSource,
      foundFiles: foundFiles.map(f => ({ name: f.name, format: f.format })),
      rawRequirements: foundFiles[0].content, // Keep for backward compatibility
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
