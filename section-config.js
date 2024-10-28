export const sectionConfig = {
    celebrities: {
        title: "Celebrities",
        description: "Latest celebrity news, gossip, and updates",
        feeds: [
            {
                name: "TMZ",
                url: "https://www.tmz.com/rss.xml",
                defaultImage: "/assets/images/default-tmz.jpg"
            },
            {
                name: "People",
                url: "https://people.com/feed/",
                defaultImage: "/assets/images/default-people.jpg"
            },
            {
                name: "E! Online",
                url: "https://www.eonline.com/rss/topstories.xml",
                defaultImage: "/assets/images/default-eonline.jpg"
            }
        ],
        topicPatterns: [
            "\\b[A-Z][a-z]+ [A-Z][a-z]+\\b", // Celebrity names
            "\\b(?:Oscar|Emmy|Grammy|Golden Globe)s?\\b", // Awards
            "\\b(?:Hollywood|Netflix|Disney|Marvel)\\b" // Industry terms
        ],
        topicBlacklist: [
            "the", "and", "but", "said", "told", "according"
        ]
    },
    entertainment: {
        title: "Entertainment",
        description: "Movies, TV shows, music, and pop culture news",
        feeds: [
            {
                name: "Variety",
                url: "https://variety.com/feed/",
                defaultImage: "/assets/images/default-variety.jpg"
            },
            {
                name: "Hollywood Reporter",
                url: "https://www.hollywoodreporter.com/feed",
                defaultImage: "/assets/images/default-thr.jpg"
            },
            {
                name: "Deadline",
                url: "https://deadline.com/feed",
                defaultImage: "/assets/images/default-deadline.jpg"
            }
        ],
        topicPatterns: [
            "\\b(?:Movie|Film|TV Show|Series)s?\\b",
            "\\b(?:Netflix|Disney\\+|HBO|Amazon Prime)\\b",
            "\\b(?:Box Office|Streaming|Release)\\b"
        ],
        topicBlacklist: [
            "the", "and", "but", "said", "told", "according"
        ]
    },
    fashion: {
        title: "Fashion",
        description: "Fashion trends, style updates, and beauty news",
        feeds: [
            {
                name: "Vogue",
                url: "https://www.vogue.com/feed",
                defaultImage: "/assets/images/default-vogue.jpg"
            },
            {
                name: "Elle",
                url: "https://www.elle.com/rss/all.xml/",
                defaultImage: "/assets/images/default-elle.jpg"
            },
            {
                name: "Harper's Bazaar",
                url: "https://www.harpersbazaar.com/rss/all.xml/",
                defaultImage: "/assets/images/default-bazaar.jpg"
            }
        ],
        topicPatterns: [
            "\\b(?:Fashion|Style|Trend|Collection)s?\\b",
            "\\b(?:Designer|Brand|Luxury)s?\\b",
            "\\b(?:Beauty|Makeup|Skincare)\\b"
        ],
        topicBlacklist: [
            "the", "and", "but", "said", "told", "according"
        ]
    },
    lifestyle: {
        title: "Lifestyle",
        description: "Health, wellness, relationships, and living trends",
        feeds: [
            {
                name: "Well+Good",
                url: "https://www.wellandgood.com/feed/",
                defaultImage: "/assets/images/default-wellgood.jpg"
            },
            {
                name: "MindBodyGreen",
                url: "https://www.mindbodygreen.com/rss",
                defaultImage: "/assets/images/default-mbg.jpg"
            },
            {
                name: "Refinery29",
                url: "https://www.refinery29.com/rss.xml",
                defaultImage: "/assets/images/default-refinery29.jpg"
            }
        ],
        topicPatterns: [
            "\\b(?:Health|Wellness|Fitness)\\b",
            "\\b(?:Diet|Nutrition|Recipe)s?\\b",
            "\\b(?:Relationship|Dating|Marriage)s?\\b"
        ],
        topicBlacklist: [
            "the", "and", "but", "said", "told", "according"
        ]
    },
    trending: {
        title: "Trending",
        description: "Viral stories, social media trends, and hot topics",
        feeds: [
            {
                name: "BuzzFeed",
                url: "https://www.buzzfeed.com/index.xml",
                defaultImage: "/assets/images/default-buzzfeed.jpg"
            },
            {
                name: "PopSugar",
                url: "https://www.popsugar.com/feed",
                defaultImage: "/assets/images/default-popsugar.jpg"
            },
            {
                name: "Complex",
                url: "https://www.complex.com/feed",
                defaultImage: "/assets/images/default-complex.jpg"
            }
        ],
        topicPatterns: [
            "\\b(?:Viral|Trending|Popular)\\b",
            "\\b(?:TikTok|Instagram|Twitter)\\b",
            "\\b(?:Challenge|Meme|Hashtag)s?\\b"
        ],
        topicBlacklist: [
            "the", "and", "but", "said", "told", "according"
        ]
    }
};

