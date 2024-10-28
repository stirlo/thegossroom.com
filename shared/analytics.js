class Analytics {
    static init(trackingId) {
        // Google Analytics initialization
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', trackingId);

        // Custom event tracking setup
        this.setupCustomTracking();
    }

    static trackPageView(path) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_path: path,
                page_title: document.title
            });
        }
    }

    static trackEvent(category, action, label = null, value = null) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }
    }

    static setupCustomTracking() {
        // Track outbound links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
                this.trackEvent('Outbound Link', 'click', link.href);
            }
        });

        // Track scroll depth
        let scrollDepthMarkers = [25, 50, 75, 100];
        let markers = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY + window.innerHeight) / 
                                document.documentElement.scrollHeight * 100;

            scrollDepthMarkers.forEach(marker => {
                if (scrollPercent >= marker && !markers.has(marker)) {
                    markers.add(marker);
                    this.trackEvent('Scroll Depth', 'scroll', `${marker}%`);
                }
            });
        });
    }
}

