document.addEventListener('DOMContentLoaded', () => {
    fetch('domain_info.json')
        .then(response => response.json())
        .then(data => {
            const currentDomain = window.location.hostname;
            const matchedDomain = data.domains.find(domain => domain.name === currentDomain);

            if (matchedDomain) {
                document.querySelector('.title').textContent = `${matchedDomain.name} is For Sale`;
                document.querySelector('.domain-description').textContent = matchedDomain.description;
                document.querySelector('meta[name="description"]').setAttribute('content', matchedDomain.description);
                document.querySelector('meta[name="keywords"]').setAttribute('content', matchedDomain.keywords);
                document.querySelector('#domain-input').value = matchedDomain.name;
                document.querySelector('#contact-email-input').value = matchedDomain.contact_email;
            }
        })
        .catch(error => console.error('Error fetching domain information:', error));
});
