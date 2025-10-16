export const newspapers = [
    { id: 'guardian', name: 'The Guardian', icon: '📰' },
    { id: 'bbc', name: 'BBC News', icon: '🎛️' },
    { id: 'reuters', name: 'Reuters', icon: '🌍' },
    { id: 'indianexpress', name: 'The Indian Express', icon: '🇮🇳' },
    { id: 'dBhaskar', name: 'Dainik Bhaskar', icon: '🗞️' },
    { id: 'wsj', name: 'Wall Street Journal', icon: '💼' },
    { id: 'nyt', name: 'New York Times', icon: '🗽' }
];

export const sections = [
    { id: 'home', name: 'Home' },
    { id: 'politics', name: 'Politics' },
    { id: 'finance', name: 'Finance' },
    { id: 'sports', name: 'Sports' },
    { id: 'technology', name: 'Technology' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'science', name: 'Science' },
    { id: 'world', name: 'World' },
];

export const topicSuggestions = [
    'AI', 'Donald Trump', 'Tesla', 'Virat Kohli', 'Tata', 'SpaceX', 'Cricket', 'Inflation', 'Startups', 'Elections'
];

export const mockArticles = [
    {
        id: 'art1',
        title: 'OpenAI Announces New Breakthrough in AI Safety',
        newspaper: 'The Guardian',
        section: 'Technology',
        duration: 180,
        audioUrl: '/audio/article1.mp3',
        transcript: 'OpenAI has announced a major breakthrough in AI safety research that could…',
        publishedAt: new Date('2025-09-07T08:00:00'),
        url: 'https://www.theguardian.com/',
    },
    {
        id: 'art2',
        title: 'Climate Summit Reaches Historic Agreement',
        newspaper: 'BBC News',
        section: 'Politics',
        duration: 240,
        audioUrl: '/audio/article2.mp3',
        transcript: 'World leaders have reached a historic agreement on climate action…',
        publishedAt: new Date('2025-09-07T09:00:00'),
        url: 'https://www.bbc.com/news',
    },
    {
        id: 'art3',
        title: 'SpaceX Successfully Tests New Starship Design',
        newspaper: 'Reuters',
        section: 'Science',
        duration: 200,
        audioUrl: '/audio/article3.mp3',
        transcript: 'SpaceX has successfully completed testing of its new Starship design…',
        publishedAt: new Date('2025-09-07T10:00:00'),
        url: 'https://www.reuters.com/',
    },
    {
        id: 'art4',
        title: 'Data Science Revolutionizing Healthcare',
        newspaper: 'The Guardian',
        section: 'Technology',
        duration: 210,
        audioUrl: '/audio/article4.mp3',
        transcript: 'Data science and machine learning are transforming healthcare…',
        publishedAt: new Date('2025-09-07T11:00:00'),
        url: 'https://www.theguardian.com/',
    }
];