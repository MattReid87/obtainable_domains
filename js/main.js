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

// Animate a number counting up to a target value
function animateCount(el, target, duration = 1000) {
    if (!el) return;
    el.textContent = target; // fallback: correct value immediately
    const start = performance.now();
    el.textContent = 0;
    const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target;
        }
    };
    requestAnimationFrame(step);
}

// Scale the hero domain down so long names never overflow the card
function fitDomain() {
    const domain = document.querySelector('.domain');
    const nameEl = document.getElementById('domainName');
    const card = domain && domain.closest('.hero-card');
    if (!domain || !nameEl || !card) return;

    // Reset to the stylesheet (clamp) size before measuring
    domain.style.fontSize = '';

    const cs = getComputedStyle(card);
    const avail = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const nameWidth = nameEl.getBoundingClientRect().width;

    if (avail > 0 && nameWidth > avail) {
        const base = parseFloat(getComputedStyle(domain).fontSize);
        domain.style.fontSize = Math.max(28, base * (avail / nameWidth)) + 'px';
    }
}

// Initialize domain display
function initializeDomain() {
    const dot = currentDomain.lastIndexOf('.');
    const namePart = dot > -1 ? currentDomain.slice(0, dot) : currentDomain;
    const tldPart = dot > -1 ? currentDomain.slice(dot) : '';

    // Hero lockup
    const nameEl = document.getElementById('domainName');
    const tldEl = document.getElementById('domainTLD');
    if (nameEl) nameEl.textContent = namePart;
    if (tldEl) tldEl.textContent = tldPart;

    // Chip: extension
    const extEl = document.getElementById('domainExt');
    if (extEl) extEl.textContent = '.' + tld;

    // Chip: character count (before the TLD, excluding dots)
    const characterCount = namePart.replace(/\./g, '').length;
    animateCount(document.getElementById('domainLength'), characterCount);

    // Marquee text
    const marqueeText = ('\u2605 ' + currentDomain + ' available \u2605 for sale ').repeat(5);
    const m1 = document.getElementById('marquee1');
    const m2 = document.getElementById('marquee2');
    if (m1) m1.textContent = marqueeText;
    if (m2) m2.textContent = marqueeText;

    // Update page title and meta
    document.title = `${currentDomain} - Premium Domain For Sale`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.content = `${currentDomain} - Premium Domain For Sale`;
    }

    // Fit the hero name to the card (re-run once webfonts have loaded)
    fitDomain();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fitDomain);
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
        const lede = document.querySelector('.hero-lede');
        if (lede) lede.textContent = domainConfig.tagline;
    }
    if (domainConfig.features) {
        updateFeaturesList(domainConfig.features);
    }
    if (domainConfig.price) {
        document.getElementById('domainPrice').textContent = domainConfig.price;
    }

    if (domainConfig.turnstileSiteKey) {
        config.turnstileSiteKey = domainConfig.turnstileSiteKey;
        renderTurnstile();
    }
}

// Update the first "Why this name" list from a features array
function updateFeaturesList(features) {
    const list = document.querySelector('.why-list');
    if (list && features.length > 0) {
        list.innerHTML = features.map(feature => `
            <li><span class="arr">&rarr;</span>${feature}</li>
        `).join('');
    }
}

// Form handling
const form = document.getElementById('contactForm');
const successMsg = document.getElementById('successMessage');
const errorMsg = document.getElementById('errorMessage');
const spinner = document.getElementById('spinner');
const submitBtn = form.querySelector('.submit-btn');

function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    if (spinner) spinner.style.display = isSubmitting ? 'inline-block' : 'none';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Validate Turnstile if enabled
    if (config.turnstileSiteKey) {
        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        if (!turnstileResponse || !turnstileResponse.value) {
            errorMsg.textContent = '✗ Please complete the security challenge';
            errorMsg.style.display = 'block';
            return;
        }
    }

    setSubmitting(true);

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

    if (config.turnstileSiteKey) {
        data.turnstileToken = formData.get('cf-turnstile-response');
    }

    try {
        let response;

        // Always use the Pages Function API endpoint when deployed
        if (window.location.hostname.includes('pages.dev') || window.location.hostname !== 'localhost') {
            response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Direct Discord webhook (for local development only)
            if (!config.discordWebhook) {
                throw new Error('Discord webhook not configured for local development');
            }

            response = await fetch(config.discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `New Inquiry for ${currentDomain}`,
                        color: 2835124, // Acid (#2B44FF? use lime) -> keep brand blue
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

            if (window.turnstile) window.turnstile.reset();

            trackEvent('form_submission', { domain: currentDomain, success: true });
            successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        trackEvent('form_error', { domain: currentDomain, error: error.message });
    } finally {
        setSubmitting(false);
    }
});

// Analytics tracking
function trackEvent(eventName, eventData) {
    if (window.zaraz && window.zaraz.track) {
        window.zaraz.track(eventName, eventData);
    }
    if (window.gtag) {
        window.gtag('event', eventName, eventData);
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Render Turnstile widget
function renderTurnstile() {
    if (!config.turnstileSiteKey) return;

    if (!window.turnstile) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.onload = renderTurnstileWidget;
        document.head.appendChild(script);
    } else {
        renderTurnstileWidget();
    }
}

function renderTurnstileWidget() {
    if (!window.turnstile || !config.turnstileSiteKey) return;

    const container = document.getElementById('turnstile-container');
    if (!container) return;

    container.innerHTML = '';
    window.turnstile.render('#turnstile-container', {
        sitekey: config.turnstileSiteKey,
        theme: 'light',
        size: 'normal'
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDomain);

// Re-fit the hero name on resize / orientation change
let fitScheduled = false;
window.addEventListener('resize', () => {
    if (fitScheduled) return;
    fitScheduled = true;
    requestAnimationFrame(() => { fitScheduled = false; fitDomain(); });
});

// Track page view
window.addEventListener('load', () => {
    trackEvent('page_view', { domain: currentDomain, referrer: document.referrer });
});
