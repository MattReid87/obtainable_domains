// Global configuration for all domains
window.DOMAIN_CONFIG = {
    // Discord webhook URL - REQUIRED
    // Get this from Discord Server Settings > Integrations > Webhooks
    discordWebhook: 'YOUR_DISCORD_WEBHOOK_URL_HERE',
    
    // Cloudflare Turnstile site key (optional but recommended)
    // Get this from: https://dash.cloudflare.com/turnstile
    turnstileSiteKey: '',
    
    // Cloudflare Web Analytics token (optional)
    // Get this from: https://dash.cloudflare.com/analytics-web
    analyticsToken: '',
    
    // Use Cloudflare Worker proxy for Discord webhook (recommended for production)
    useWorkerProxy: false,
    
    // Default contact email (fallback)
    contactEmail: 'domains@example.com'
};