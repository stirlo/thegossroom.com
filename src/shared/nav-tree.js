export const navTree = {
    "sections": [
        {
            "id": "celebrities",
            "label": "Celebrities",
            "url": "/celebrities/",
            "subsections": [
                {
                    "id": "hollywood",
                    "label": "Hollywood",
                    "url": "/celebrities/hollywood/"
                },
                {
                    "id": "music",
                    "label": "Music Stars",
                    "url": "/celebrities/music/"
                },
                {
                    "id": "reality-tv",
                    "label": "Reality TV",
                    "url": "/celebrities/reality-tv/"
                }
            ]
        },
        {
            "id": "entertainment",
            "label": "Entertainment",
            "url": "/entertainment/",
            "subsections": [
                {
                    "id": "movies",
                    "label": "Movies",
                    "url": "/entertainment/movies/"
                },
                {
                    "id": "tv-shows",
                    "label": "TV Shows",
                    "url": "/entertainment/tv-shows/"
                },
                {
                    "id": "streaming",
                    "label": "Streaming",
                    "url": "/entertainment/streaming/"
                }
            ]
        },
        {
            "id": "fashion",
            "label": "Fashion",
            "url": "/fashion/",
            "subsections": [
                {
                    "id": "style",
                    "label": "Style & Trends",
                    "url": "/fashion/style/"
                },
                {
                    "id": "beauty",
                    "label": "Beauty",
                    "url": "/fashion/beauty/"
                },
                {
                    "id": "red-carpet",
                    "label": "Red Carpet",
                    "url": "/fashion/red-carpet/"
                }
            ]
        },
        {
            "id": "lifestyle",
            "label": "Lifestyle",
            "url": "/lifestyle/",
            "subsections": [
                {
                    "id": "health",
                    "label": "Health & Wellness",
                    "url": "/lifestyle/health/"
                },
                {
                    "id": "relationships",
                    "label": "Relationships",
                    "url": "/lifestyle/relationships/"
                },
                {
                    "id": "living",
                    "label": "Living",
                    "url": "/lifestyle/living/"
                }
            ]
        },
        {
            "id": "trending",
            "label": "Trending",
            "url": "/trending/",
            "subsections": [
                {
                    "id": "viral",
                    "label": "Viral Stories",
                    "url": "/trending/viral/"
                },
                {
                    "id": "social-media",
                    "label": "Social Media",
                    "url": "/trending/social-media/"
                },
                {
                    "id": "hot-topics",
                    "label": "Hot Topics",
                    "url": "/trending/hot-topics/"
                }
            ]
        }
    ],
    "meta": {
        "footer": [
            {
                "id": "about",
                "label": "About",
                "url": "/about/"
            },
            {
                "id": "privacy",
                "label": "Privacy Policy",
                "url": "/privacy/"
            },
            {
                "id": "terms",
                "label": "Terms of Use",
                "url": "/terms/"
            },
            {
                "id": "contact",
                "label": "Contact",
                "url": "/contact/"
            }
        ],
        "social": [
            {
                "platform": "twitter",
                "url": "https://twitter.com/thegossroom",
                "icon": "twitter"
            },
            {
                "platform": "instagram",
                "url": "https://instagram.com/thegossroom",
                "icon": "instagram"
            },
            {
                "platform": "facebook",
                "url": "https://facebook.com/thegossroom",
                "icon": "facebook"
            }
        ]
    },
    "settings": {
        "defaultSection": "trending",
        "articlesPerPage": 12,
        "enableComments": true,
        "enableSharing": true,
        "enableDarkMode": true
    }
};

// Helper functions for navigation
export const getSection = (sectionId) => {
    return navTree.sections.find(section => section.id === sectionId);
};

export const getSubsection = (sectionId, subsectionId) => {
    const section = getSection(sectionId);
    return section?.subsections.find(subsection => subsection.id === subsectionId);
};

export const getAllUrls = () => {
    const urls = [];

    // Add main sections
    navTree.sections.forEach(section => {
        urls.push(section.url);

        // Add subsections
        section.subsections?.forEach(subsection => {
            urls.push(subsection.url);
        });
    });

    // Add meta pages
    navTree.meta.footer.forEach(item => {
        urls.push(item.url);
    });

    return urls;
};

export const getBreadcrumbs = (currentPath) => {
    const breadcrumbs = [{ label: 'Home', url: '/' }];
    const pathParts = currentPath.split('/').filter(Boolean);

    let currentUrl = '';
    pathParts.forEach(part => {
        currentUrl += `/${part}`;
        const section = getSection(part);
        if (section) {
            breadcrumbs.push({ label: section.label, url: currentUrl });
        } else {
            const parentSection = getSection(pathParts[0]);
            const subsection = parentSection?.subsections.find(sub => sub.id === part);
            if (subsection) {
                breadcrumbs.push({ label: subsection.label, url: currentUrl });
            }
        }
    });

    return breadcrumbs;
};

// Export the entire module
export default {
    navTree,
    getSection,
    getSubsection,
    getAllUrls,
    getBreadcrumbs
};

