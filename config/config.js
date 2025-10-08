// Global configuration for all domains
window.DOMAIN_CONFIG = {
    // Discord webhook URL - For local development only
    // In production, set this as an environment variable in Cloudflare Pages
    discordWebhook: 'YOUR_DISCORD_WEBHOOK_URL_HERE',
    
    // Cloudflare Turnstile site key (optional but recommended)
    // Get this from: https://dash.cloudflare.com/turnstile
    turnstileSiteKey: 'YOUR_TURNSTILE_SITE_KEY_HERE', // Replace with your actual site key
    
    // Cloudflare Web Analytics token (optional)
    // Get this from: https://dash.cloudflare.com/analytics-web
    analyticsToken: '',
    
    // Default contact email (fallback)
    contactEmail: 'domains@example.com'
};