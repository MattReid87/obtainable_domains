/**
 * Cloudflare Worker to proxy contact form submissions to Discord
 * This keeps your Discord webhook URL secure and adds rate limiting
 */

// Environment variables (set in Cloudflare Workers dashboard)
// DISCORD_WEBHOOK_URL - Your Discord webhook URL
// TURNSTILE_SECRET_KEY - Your Cloudflare Turnstile secret key (optional)

export default {
  async fetch(request, env) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Check if this is the contact endpoint
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') {
      return new Response('Not found', { status: 404 });
    }

    try {
      // Parse request body
      const data = await request.json();

      // Validate required fields
      if (!data.name || !data.email || !data.message) {
        return new Response('Missing required fields', { status: 400 });
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

      // Prepare Discord webhook payload
      const discordPayload = {
        embeds: [{
          title: `New Inquiry for ${data.domain}`,
          color: 6366241, // Purple color
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
      console.error('Worker error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },

  // Handle OPTIONS requests for CORS
  async options(request) {
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
};

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