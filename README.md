# Domain Sales Landing Page

A modern, responsive landing page for selling premium domains. Automatically detects and displays the current domain name, making it perfect for deploying to multiple domains.

## Features

- 🎨 Modern dark theme with animated gradients
- 📱 Fully responsive design
- 🔍 Automatic domain detection
- 📧 Contact form with Discord webhook integration
- 🛡️ Cloudflare Turnstile bot protection (optional)
- 📊 Cloudflare Web Analytics integration (optional)
- ⚡ No build process required - pure HTML/CSS/JS
- 🌐 Domain-specific configuration support

## Quick Start

### 1. Configure Discord Webhook

Edit `config/config.js` and add your Discord webhook URL:

```javascript
discordWebhook: 'YOUR_DISCORD_WEBHOOK_URL_HERE',
```

### 2. Deploy to Cloudflare Pages

1. Push this code to a GitHub repository
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Click "Create a project" and connect your GitHub repo
4. Use these build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Deploy!

### 3. Add Custom Domains

1. In Cloudflare Pages, go to your project settings
2. Click "Custom domains"
3. Add each domain you want to sell
4. Update DNS records to point to your Pages project

## Domain Configuration

### How Domain Pointing Works

Yes, you can simply point any domain to this Cloudflare Pages project and it will work! Here's what happens:

1. When someone visits your domain, the page automatically detects the domain name
2. It displays that domain as being for sale
3. All inquiries include which domain the visitor came from

### What You Need to Configure

**For each domain:**
1. Add it as a custom domain in Cloudflare Pages
2. Update DNS records:
   - If using Cloudflare DNS: Add a CNAME record pointing to `your-project.pages.dev`
   - If using external DNS: Add a CNAME record pointing to your Pages URL

**That's it!** No other configuration needed. The page automatically adapts to each domain.

### Optional: Domain-Specific Content

Create a JSON file in the `config` folder named after your domain:

```json
// config/yourdomain.com.json
{
    "tagline": "The perfect domain for your tech startup",
    "price": "$5,000",
    "features": [
        "Short, memorable domain name",
        "Perfect for SaaS companies",
        "High search volume keywords",
        "Established domain authority"
    ]
}
```

## Security Enhancements

### 1. Hide Discord Webhook URL (Recommended)

Deploy the included Cloudflare Worker to proxy form submissions:

1. Go to Cloudflare Workers
2. Create a new Worker
3. Copy the code from `workers/contact-proxy.js`
4. Set environment variables:
   - `DISCORD_WEBHOOK_URL`: Your Discord webhook
   - `TURNSTILE_SECRET_KEY`: Your Turnstile secret (optional)
5. Deploy and note the Worker URL
6. Update `config/config.js`:
   ```javascript
   useWorkerProxy: true
   ```

### 2. Add Bot Protection

1. Go to [Cloudflare Turnstile](https://dash.cloudflare.com/turnstile)
2. Create a new site
3. Add the site key to `config/config.js`:
   ```javascript
   turnstileSiteKey: 'YOUR_SITE_KEY',
   ```

### 3. Enable Analytics

1. Go to [Cloudflare Web Analytics](https://dash.cloudflare.com/analytics-web)
2. Add your site
3. Copy the token to `config/config.js`:
   ```javascript
   analyticsToken: 'YOUR_ANALYTICS_TOKEN',
   ```

## File Structure

```
obtainable_domains/
├── index.html           # Main HTML file
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # Application logic
├── config/
│   ├── config.js       # Global configuration
│   └── *.json          # Domain-specific configs
└── workers/
    └── contact-proxy.js # Cloudflare Worker for secure form handling
```

## Customization

### Modify Global Content

Edit the HTML in `index.html` to change:
- Header text and badges
- Feature lists
- Contact form fields
- Footer content

### Modify Styles

Edit `css/styles.css` to change:
- Colors (see CSS variables at the top)
- Animations
- Layout
- Typography

### Add Features

The modular structure makes it easy to add:
- Payment integration
- Live chat widgets
- Additional form fields
- More domain statistics

## Development

For local development, use any static server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# Or just open index.html in a browser
```

## Support

- Create an issue for bugs or feature requests
- Contact form submissions go to your configured Discord channel
- Cloudflare Pages provides automatic SSL and global CDN

## License

MIT License - feel free to customize and use for your domain sales!