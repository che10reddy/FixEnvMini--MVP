import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - 5 requests per minute per IP (stricter for AI-heavy endpoint)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Rate limit exceeded. Please try again in a minute.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { 
      issues, 
      suggestions, 
      dependencyDiff,
      vulnerabilities,
      detectedFormats, 
      primaryFormat, 
      pythonVersion, 
      rawRequirements,
      repositoryUrl,
      reproducibilityScore 
    } = await req.json();
    
    console.log('Snapshot generation request received');
    console.log('Repository:', repositoryUrl);
    console.log('Primary format:', primaryFormat);
    console.log('Python version:', pythonVersion);
    console.log('Reproducibility score:', reproducibilityScore);
    console.log('Vulnerabilities:', vulnerabilities?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine the output format and filename
    let outputFormat = 'requirements.txt';
    let fileExtension = 'txt';
    
    if (primaryFormat?.includes('Poetry') || primaryFormat?.includes('pyproject.toml')) {
      outputFormat = 'pyproject.toml';
      fileExtension = 'toml';
    } else if (primaryFormat?.includes('Pipenv') || primaryFormat?.includes('Pipfile')) {
      outputFormat = 'Pipfile';
      fileExtension = 'pipfile';
    }

    console.log('Generating fixed file in format:', outputFormat);

    // Build the AI prompt with all the context
    const issuesSummary = issues.map((issue: any) => 
      `- ${issue.title} (${issue.package}): ${issue.description}`
    ).join('\n');

    const suggestionsText = suggestions.join('\n- ');

    const dependenciesText = dependencyDiff.map((dep: any) => 
      `${dep.package}: ${dep.before} → ${dep.after}`
    ).join('\n');

    const vulnerabilitiesText = vulnerabilities?.length > 0 
      ? `\n\nSECURITY VULNERABILITIES (${vulnerabilities.length}):\n${vulnerabilities.map((v: any) => 
          `- ${v.id}: ${v.package}@${v.version} (${v.severity})${v.fixed_versions ? ` - Fix: upgrade to ${v.fixed_versions}` : ''}`
        ).join('\n')}`
      : '';

    const pythonVersionText = pythonVersion && pythonVersion !== 'unknown' 
      ? `\n\nTARGET PYTHON VERSION: ${pythonVersion}\nEnsure all packages are compatible with Python ${pythonVersion}.`
      : '';

    const originalDependenciesText = rawRequirements 
      ? `\n\nORIGINAL DEPENDENCIES FILE:\n${rawRequirements}\n\nInclude ALL of these dependencies in your output, applying fixes where needed.`
      : '';

    const aiPrompt = `You are a Python dependency expert. Generate a COMPLETE, production-ready dependency file with inline comments explaining each fix.

OUTPUT FORMAT: ${outputFormat}
${pythonVersionText}
${originalDependenciesText}

DETECTED ISSUES:
${issuesSummary}

AI SUGGESTIONS:
- ${suggestionsText}

DEPENDENCY CORRECTIONS:
${dependenciesText}
${vulnerabilitiesText}

CRITICAL INSTRUCTIONS:
1. Generate a COMPLETE ${outputFormat} file including ALL dependencies (not just the ones with issues)
2. For EACH dependency, add an inline comment explaining:
   - If it was fixed: what was wrong and why this version was chosen
   - If it has a security vulnerability: note the CVE and the fix
   - If it was unchanged: confirm it's already correct
3. Use the "after" versions from the dependency corrections
4. Pin ALL dependencies to specific versions (no unpinned packages)
5. Ensure compatibility with Python ${pythonVersion || 'latest stable'}
6. Follow ${outputFormat} best practices and syntax
7. Add a header comment explaining this is an auto-fixed file
8. If there are security vulnerabilities, prioritize upgrading to fixed versions

EXAMPLE FORMAT for requirements.txt:
# Auto-fixed by FixEnv Mini - ${new Date().toISOString().split('T')[0]}
# Python version: ${pythonVersion || 'latest stable'}

numpy==1.26.2  # Fixed: was unversioned, pinned to latest stable
pandas==2.1.0  # Fixed: was 1.5.3, upgraded for Python 3.11 compatibility
requests==2.31.0  # Security: upgraded from 2.28.0 to fix CVE-2023-32681

${outputFormat === 'pyproject.toml' ? `
For Poetry projects, use this structure with inline comments:
# Auto-fixed by FixEnv Mini - ${new Date().toISOString().split('T')[0]}

[tool.poetry]
name = "project"
version = "0.1.0"
description = ""
authors = []

[tool.poetry.dependencies]
python = "${pythonVersion && pythonVersion !== 'unknown' ? pythonVersion : '^3.11'}"
# Add all dependencies here with inline comments explaining each fix
# Example: numpy = "^1.26.2"  # Fixed: was unversioned, pinned to latest stable

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
` : ''}

${outputFormat === 'Pipfile' ? `
For Pipenv projects, use this structure with inline comments:
# Auto-fixed by FixEnv Mini - ${new Date().toISOString().split('T')[0]}

[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
# Add all dependencies here with inline comments explaining each fix
# Example: numpy = "==1.26.2"  # Fixed: was unversioned, pinned to latest stable

[dev-packages]

[requires]
python_version = "${pythonVersion && pythonVersion !== 'unknown' ? pythonVersion.split('.').slice(0, 2).join('.') : '3.11'}"
` : ''}

CRITICAL: Respond with ONLY the complete file content with inline comments. No explanations, no markdown code blocks, just the raw file content that can be saved directly. Include ALL dependencies from the original file plus any fixes.`;

    console.log('Calling Lovable AI to generate fixed file...');
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
            content: 'You are a Python dependency expert. Generate corrected dependency files without any markdown formatting or explanations.' 
          },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Payment required. Please add credits to your Lovable workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    let fixedContent = aiData.choices[0].message.content;
    
    // Clean up any markdown formatting
    fixedContent = fixedContent.replace(/```[a-z]*\n?/gi, '').trim();
    
    console.log('Generated file preview:', fixedContent.substring(0, 200));

    // Build the complete .zfix structure
    const timestamp = new Date().toISOString();
    const zfixData = {
      version: "1.0",
      generated_at: timestamp,
      generator: "FixEnv Mini",
      metadata: {
        repository_url: repositoryUrl || "unknown",
        python_version: pythonVersion || "unknown",
        detected_formats: detectedFormats || [],
        primary_format: primaryFormat || outputFormat,
        scan_timestamp: timestamp,
      },
      analysis: {
        reproducibility_score: reproducibilityScore || 0,
        total_issues: issues.length,
        issues: issues.map((issue: any) => ({
          severity: issue.severity,
          title: issue.title,
          package: issue.package,
          description: issue.description,
        })),
        suggestions: suggestions,
        dependency_changes: dependencyDiff.map((dep: any) => ({
          package: dep.package,
          before: dep.before,
          after: dep.after,
          reason: dep.reason || "Version correction applied",
        })),
        vulnerabilities: vulnerabilities?.map((vuln: any) => ({
          id: vuln.id,
          package: vuln.package,
          version: vuln.version,
          severity: vuln.severity,
          summary: vuln.summary,
          fixed_versions: vuln.fixed_versions,
          link: vuln.link,
        })) || [],
        vulnerability_count: vulnerabilities?.length || 0,
      },
      fixed_dependencies: {
        format: outputFormat,
        content: fixedContent,
      },
    };

    return new Response(JSON.stringify({
      success: true,
      zfixData: zfixData,
      fixedContent: fixedContent,
      filename: 'environment.zfix',
      format: '.zfix',
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
