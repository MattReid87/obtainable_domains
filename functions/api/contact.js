/**
 * Cloudflare Pages Function to handle contact form submissions
 * This keeps your Discord webhook URL secure and adds validation
 * Includes rate limiting to prevent spam
 */

export async function onRequestPost(context) {
  // Get environment variables from context
  const { env, request } = context;
  
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Block known spam IPs
    const knownSpamIPs = ['91.84.110.151', '91.201.115.242'];
    if (knownSpamIPs.includes(clientIP)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate limiting check (if KV namespace is bound)
    if (env.RATE_LIMIT) {
      const rateLimitPassed = await checkRateLimit(env.RATE_LIMIT, clientIP);
      if (!rateLimitPassed) {
        return new Response('Too many requests. Please try again later.', { status: 429 });
      }
    }

    // Parse request body
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Basic spam detection
    if (isLikelySpam(data)) {
      return new Response('Submission rejected', { status: 403 });
    }

    // Verify Turnstile token if configured
    if (env.TURNSTILE_SECRET_KEY && data.turnstileToken) {
      const turnstileVerified = await verifyTurnstile(
        data.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP')
      );

      if (!turnstileVerified) {
        return new Response('Invalid security token', { status: 403 });
      }
    }

    // Check if Discord webhook is configured
    if (!env.DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL not configured');
      return new Response('Contact form not configured', { status: 500 });
    }

    // Prepare Discord webhook payload
    const discordPayload = {
      embeds: [{
        title: `New Inquiry for ${data.domain}`,
        color: 9061110, // Purple color (#8b5cf6 in decimal)
        fields: [
          { name: 'Name', value: data.name, inline: true },
          { name: 'Email', value: data.email, inline: true },
          { name: 'Domain', value: data.domain, inline: true },
          { name: 'Budget Range', value: data.budget || 'Not specified', inline: true },
          { name: 'Timeline', value: data.timeline || 'Not specified', inline: true },
          { name: 'Message', value: data.message, inline: false },
          { name: 'IP Address', value: request.headers.get('CF-Connecting-IP') || 'Unknown', inline: true },
          { name: 'Country', value: request.cf?.country || 'Unknown', inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: `Via ${request.headers.get('Origin') || 'Unknown origin'}`
        }
      }]
    };

    // Send to Discord
    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    });

    if (!discordResponse.ok && discordResponse.status !== 204) {
      console.error('Discord webhook failed:', await discordResponse.text());
      return new Response('Failed to send message', { status: 500 });
    }

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Verify Cloudflare Turnstile token
async function verifyTurnstile(token, secretKey, ip) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: secretKey,
      response: token,
      remoteip: ip
    })
  });

  const result = await response.json();
  return result.success;
}

// Rate limiting using Cloudflare KV
async function checkRateLimit(kvNamespace, clientIP) {
  const rateLimitKey = `ratelimit:${clientIP}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxRequests = 3; // Max 3 submissions per hour per IP

  // Get current count
  const rateLimitData = await kvNamespace.get(rateLimitKey, { type: 'json' });

  if (!rateLimitData) {
    // First request from this IP
    await kvNamespace.put(rateLimitKey, JSON.stringify({
      count: 1,
      firstRequest: now
    }), { expirationTtl: 3600 }); // Expire after 1 hour
    return true;
  }

  // Check if window has expired
  if (now - rateLimitData.firstRequest > windowMs) {
    // Reset counter
    await kvNamespace.put(rateLimitKey, JSON.stringify({
      count: 1,
      firstRequest: now
    }), { expirationTtl: 3600 });
    return true;
  }

  // Check if limit exceeded
  if (rateLimitData.count >= maxRequests) {
    return false;
  }

  // Increment counter
  await kvNamespace.put(rateLimitKey, JSON.stringify({
    count: rateLimitData.count + 1,
    firstRequest: rateLimitData.firstRequest
  }), { expirationTtl: 3600 });

  return true;
}

// Basic spam detection heuristics
function isLikelySpam(data) {
  const { name, email, message, budget, timeline } = data;

  // Check for gibberish text (random characters with no vowel patterns)
  // Real names/messages typically have vowel-consonant patterns
  if (isGibberish(name) || isGibberish(message)) {
    return true;
  }

  // Check budget and timeline for gibberish if provided
  if (budget && budget !== 'Not specified' && isGibberish(budget)) {
    return true;
  }
  if (timeline && timeline !== 'Not specified' && isGibberish(timeline)) {
    return true;
  }

  // Check for common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|porn|casino|lottery|winner)\b/i,
    /\b(click here|buy now|limited time|act now)\b/i,
    /https?:\/\/.*https?:\/\//i, // Multiple URLs
    /<script|<iframe|javascript:/i, // Script injection attempts
  ];

  const fullText = `${name} ${email} ${message}`.toLowerCase();

  for (const pattern of spamPatterns) {
    if (pattern.test(fullText)) {
      return true;
    }
  }

  // Check for excessive URLs (more than 3)
  const urlCount = (fullText.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    return true;
  }

  // Check for very short messages (likely bot)
  if (message.length < 10) {
    return true;
  }

  // Check for all caps message (common spam tactic)
  if (message === message.toUpperCase() && message.length > 20) {
    return true;
  }

  // Check for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return true;
  }

  // Block the specific spam IPs we've identified
  const knownSpamIPs = ['91.84.110.151', '91.201.115.242'];
  // This will be checked in the main function

  return false;
}

// Detect gibberish text (random character strings)
function isGibberish(text) {
  if (!text || text.length < 3) return false;

  // Convert to lowercase for analysis
  const lower = text.toLowerCase();

  // Check 1: Too many consonants in a row (more than 4)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(text)) {
    return true;
  }

  // Check 2: No vowels at all in a word longer than 3 characters
  if (text.length > 3 && !/[aeiou]/i.test(text)) {
    return true;
  }

  // Check 3: Mixed case randomness (more than 40% uppercase in middle of text)
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const lowerCount = (text.match(/[a-z]/g) || []).length;
  const totalLetters = upperCount + lowerCount;

  if (totalLetters > 5 && upperCount / totalLetters > 0.4 && upperCount / totalLetters < 0.9) {
    // Random mixed case like "WCEfVIlsgX" or "eQucwLmTINC"
    return true;
  }

  // Check 4: Very low vowel ratio (less than 20% for text longer than 5 chars)
  const vowelCount = (lower.match(/[aeiou]/g) || []).length;
  if (text.length > 5 && vowelCount / text.length < 0.2) {
    return true;
  }

  // Check 5: Repeating character patterns that look random (e.g., "HrpmFBMjHguHBmL")
  // Calculate entropy - gibberish has high variation
  const uniqueChars = new Set(lower.split('')).size;
  if (text.length > 8 && uniqueChars / text.length > 0.7) {
    // Almost every character is unique = likely random
    return true;
  }

  return false;
}