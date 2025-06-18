# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a premium domain sales landing page designed to be deployed on multiple domains via Cloudflare Pages. The page automatically detects and displays the current domain name as being for sale. It features a modern, animated dark theme design with a contact form that sends inquiries to Discord via webhook.

## Project Structure

```
obtainable_domains/
├── index.html          # Main landing page
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # Application logic
├── config/
│   ├── config.js       # Global configuration
│   └── *.json          # Domain-specific configs
├── functions/
│   └── api/
│       └── contact.js  # Cloudflare Pages Function for form handling
├── README.md           # Deployment instructions
└── CLAUDE.md          # This file
```

## Key Features

- **Dynamic Domain Detection**: Automatically displays the current domain name
- **Responsive Design**: Mobile-first, works on all devices
- **Animated UI**: Gradient backgrounds, hover effects, smooth transitions
- **Contact Form**: Sends inquiries to Discord webhook (requires configuration)
- **SEO Optimized**: Meta tags, semantic HTML, performance-focused
- **No Dependencies**: Pure HTML/CSS/JavaScript, no build process needed

## Development & Deployment

### Local Development
```bash
# Option 1: Python (if available)
python -m http.server 8000

# Option 2: Node.js (if available)
npx serve .

# Option 3: Direct browser
# Simply open index.html in a web browser
```

### Cloudflare Pages Deployment
1. Push code to GitHub repository
2. Connect repository to Cloudflare Pages
3. No build command needed (static site)
4. Set output directory to root (`/`)
5. Add custom domains in Cloudflare Pages settings

## Configuration Required

### Discord Webhook
Replace `YOUR_DISCORD_WEBHOOK_URL_HERE` in index.html:587 with your actual Discord webhook URL to enable the contact form.

## Common Development Tasks

### Adding Analytics
- Add Google Analytics or Cloudflare Web Analytics script before closing `</body>` tag
- Consider privacy-friendly alternatives like Plausible or Fathom

### Performance Optimization
- Consider extracting inline styles/scripts to external files with proper caching
- Add resource hints (preconnect, dns-prefetch) if adding external resources
- Implement lazy loading for any future images

### Security Considerations
- Discord webhook URL is exposed in client-side code (consider proxy solution)
- Form has no rate limiting (consider Cloudflare Turnstile)
- No server-side validation (acceptable for Discord webhook)

## Enhancement Opportunities

### High-Value Features to Add
1. **Multiple Domain Management**: JSON config for domain-specific content
2. **Pricing Display**: Show/hide pricing based on domain
3. **Domain History**: Previous sales, age, traffic stats
4. **Live Chat**: Integrate Crisp, Intercom, or Tawk.to
5. **Payment Integration**: Escrow.com API or Stripe for deposits
6. **Multi-language Support**: i18n for global buyers
7. **A/B Testing**: Cloudflare Workers for testing variations
8. **Email Capture**: Newsletter signup for domain investors

### Cloudflare-Specific Enhancements
1. **Pages Functions**: Secure Discord webhook proxy (already implemented in `/functions/api/contact.js`)
2. **KV Storage**: Store inquiries, domain configurations
3. **Turnstile**: Bot protection for contact form
4. **Web Analytics**: Privacy-friendly analytics
5. **Page Rules**: Cache optimization, security headers

## Code Style Guidelines

- Code is organized into separate files for maintainability
- CSS uses modern properties (CSS Grid, Flexbox, Custom Properties)
- JavaScript is vanilla ES6+ (no frameworks)
- Mobile-first responsive design approach
- Dark theme with accent colors for visual hierarchy
- Cloudflare Pages Functions for serverless backend