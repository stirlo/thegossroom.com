class SEOManager {
    static setMetaTags({title, description, keywords, image, type = 'website'}) {
        // Basic meta tags
        document.title = `${title} | TheGossRoom`;
        this.setMetaTag('description', description);
        this.setMetaTag('keywords', keywords);

        // Open Graph tags
        this.setMetaTag('og:title', title);
        this.setMetaTag('og:description', description);
        this.setMetaTag('og:image', image);
        this.setMetaTag('og:type', type);
        this.setMetaTag('og:url', window.location.href);

        // Twitter Card tags
        this.setMetaTag('twitter:card', 'summary_large_image');
        this.setMetaTag('twitter:title', title);
        this.setMetaTag('twitter:description', description);
        this.setMetaTag('twitter:image', image);
    }

    static setMetaTag(name, content) {
        if (!content) return;

        let meta = document.querySelector(`meta[name="${name}"]`) ||
                  document.querySelector(`meta[property="${name}"]`);

        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(name.includes('og:') ? 'property' : 'name', name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    static generateStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
    }
}

