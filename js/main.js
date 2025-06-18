// Configuration
const config = {
    discordWebhook: window.DOMAIN_CONFIG?.discordWebhook || '',
    turnstileSiteKey: window.DOMAIN_CONFIG?.turnstileSiteKey || '',
    analyticsToken: window.DOMAIN_CONFIG?.analyticsToken || ''
};

// Get current domain dynamically
const currentDomain = window.location.hostname || 'example.com';
const domainParts = currentDomain.split('.');
const tld = domainParts[domainParts.length - 1];

// Initialize domain display
function initializeDomain() {
    // Update domain display
    document.getElementById('domainName').textContent = currentDomain;
    document.getElementById('domainLength').textContent = currentDomain.replace(/\./g, '').length;
    document.getElementById('domainTLD').textContent = '.' + tld;
    
    // Update page title and meta
    document.title = `${currentDomain} - Premium Domain For Sale`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.content = `${currentDomain} - Premium Domain For Sale`;
    }
    
    // Load domain-specific configuration if available
    loadDomainConfig();
}

// Load domain-specific configuration
async function loadDomainConfig() {
    try {
        const response = await fetch(`/config/${currentDomain}.json`);
        if (response.ok) {
            const domainConfig = await response.json();
            applyDomainConfig(domainConfig);
        }
    } catch (error) {
        console.log('No domain-specific configuration found, using defaults');
    }
}

// Apply domain-specific configuration
function applyDomainConfig(domainConfig) {
    if (domainConfig.tagline) {
        document.querySelector('.tagline').textContent = domainConfig.tagline;
    }
    if (domainConfig.features) {
        updateFeaturesList(domainConfig.features);
    }
    if (domainConfig.price) {
        document.getElementById('domainPrice').textContent = domainConfig.price;
    }
}

// Update features list
function updateFeaturesList(features) {
    const featuresList = document.querySelector('.features-list');
    if (featuresList && features.length > 0) {
        featuresList.innerHTML = features.map(feature => `
            <li>
                <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                ${feature}
            </li>
        `).join('');
    }
}

// Form handling
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('successMessage');
const errorMsg = document.getElementById('errorMessage');
const spinner = document.getElementById('spinner');
const submitBtn = form.querySelector('.submit-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide any existing messages
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    // Validate Turnstile if enabled
    if (config.turnstileSiteKey) {
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        if (!turnstileResponse || !turnstileResponse.value) {
            errorMsg.textContent = 'Please complete the security challenge';
            errorMsg.style.display = 'block';
            return;
        }
    }
    
    // Show loading state
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        domain: currentDomain,
        name: formData.get('name'),
        email: formData.get('email'),
        budget: formData.get('budget') || 'Not specified',
        timeline: formData.get('timeline') || 'Not specified',
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };
    
    // Add Turnstile token if available
    if (config.turnstileSiteKey) {
        data.turnstileToken = formData.get('cf-turnstile-response');
    }
    
    try {
        let response;
        
        // Always use the Pages Function API endpoint when deployed
        if (window.location.hostname.includes('pages.dev') || window.location.hostname !== 'localhost') {
            response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } else {
            // Direct Discord webhook (for local development only)
            if (!config.discordWebhook) {
                throw new Error('Discord webhook not configured for local development');
            }
            
            response = await fetch(config.discordWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [{
                        title: `New Inquiry for ${currentDomain}`,
                        color: 6366241, // Purple color
                        fields: [
                            { name: 'Name', value: data.name, inline: true },
                            { name: 'Email', value: data.email, inline: true },
                            { name: 'Domain', value: data.domain, inline: true },
                            { name: 'Budget Range', value: data.budget, inline: true },
                            { name: 'Timeline', value: data.timeline, inline: true },
                            { name: 'Message', value: data.message, inline: false }
                        ],
                        timestamp: data.timestamp
                    }]
                })
            });
        }
        
        if (response.ok || response.status === 204) {
            successMsg.style.display = 'block';
            form.reset();
            
            // Reset Turnstile if present
            if (window.turnstile) {
                window.turnstile.reset();
            }
            
            // Track conversion event
            trackEvent('form_submission', {
                domain: currentDomain,
                success: true
            });
            
            // Scroll to success message
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        trackEvent('form_error', {
            domain: currentDomain,
            error: error.message
        });
    } finally {
        // Reset button state
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message';
    }
});

// Analytics tracking
function trackEvent(eventName, eventData) {
    // Cloudflare Web Analytics
    if (window.zaraz && window.zaraz.track) {
        window.zaraz.track(eventName, eventData);
    }
    
    // Google Analytics (if added)
    if (window.gtag) {
        window.gtag('event', eventName, eventData);
    }
}

// Add animation delays to cards
const cards = document.querySelectorAll('.card, .stat-card');
cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDomain);

// Track page view
window.addEventListener('load', () => {
    trackEvent('page_view', {
        domain: currentDomain,
        referrer: document.referrer
    });
});