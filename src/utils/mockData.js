export const mockUsers = [
    {
        id: 1,
        email: 'demo@newspod.com',
        password: 'demo123',
        name: 'Demo User',
        subscription: 'premium',
        preferences: {
            newspapers: ['The Guardian', 'Reuters', 'BBC News'],
            sections: ['Technology', 'Politics', 'Science'],
            subtopics: ['Artificial Intelligence', 'Climate Change', 'Space Exploration']
        }
    }
];

export const mockArticles = [
    {
        id: 'art1',
        title: 'OpenAI Announces New Breakthrough in AI Safety',
        newspaper: 'The Guardian',
        section: 'Technology',
        duration: 180,
        audioUrl: '/audio/article1.mp3',
        transcript: 'OpenAI has announced a major breakthrough in AI safety research...',
        publishedAt: new Date('2025-09-07T08:00:00'),
        embedding: [0.2, 0.5, 0.1, 0.8] // Simplified embedding
    },
    {
        id: 'art2',
        title: 'Climate Summit Reaches Historic Agreement',
        newspaper: 'BBC News',
        section: 'Politics',
        duration: 240,
        audioUrl: '/audio/article2.mp3',
        transcript: 'World leaders have reached a historic agreement on climate action...',
        publishedAt: new Date('2025-09-07T09:00:00'),
        embedding: [0.1, 0.3, 0.9, 0.2]
    },
    {
        id: 'art3',
        title: 'SpaceX Successfully Tests New Starship Design',
        newspaper: 'Reuters',
        section: 'Science',
        duration: 200,
        audioUrl: '/audio/article3.mp3',
        transcript: 'SpaceX has successfully completed testing of its new Starship design...',
        publishedAt: new Date('2025-09-07T10:00:00'),
        embedding: [0.7, 0.2, 0.4, 0.6]
    },
    {
        id: 'art4',
        title: 'Data Science Revolutionizing Healthcare',
        newspaper: 'The Guardian',
        section: 'Technology',
        duration: 210,
        audioUrl: '/audio/article4.mp3',
        transcript: 'Data science and machine learning are transforming healthcare...',
        publishedAt: new Date('2025-09-07T11:00:00'),
        embedding: [0.3, 0.8, 0.2, 0.5]
    }
];

export const transitionAudios = [
    { id: 't1', type: 'tech-to-politics', url: '/audio/transition1.mp3', duration: 3 },
    { id: 't2', type: 'politics-to-science', url: '/audio/transition2.mp3', duration: 3 },
    { id: 't3', type: 'same-section', url: '/audio/transition3.mp3', duration: 2 },
    { id: 't4', type: 'generic', url: '/audio/transition4.mp3', duration: 2 }
];

export const newspapers = [
    { id: 'guardian', name: 'The Guardian', icon: '📰' },
    { id: 'bbc', name: 'BBC News', icon: '🎭' },
    { id: 'reuters', name: 'Reuters', icon: '🌍' },
    { id: 'nyt', name: 'New York Times', icon: '🗽' },
    { id: 'wsj', name: 'Wall Street Journal', icon: '💼' },
    { id: 'economist', name: 'The Economist', icon: '📊' }
];

export const sections = [
    { id: 'politics', name: 'Politics', icon: '🏛️' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'world', name: 'World News', icon: '🌎' }
];