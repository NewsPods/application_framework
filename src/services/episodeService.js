import { mockArticles, transitionAudios } from '../utils/mockData';
import { cosineSimilarity, generateMockEmbedding } from '../utils/similarity';

class EpisodeService {
    async generateDailyEpisode(userPreferences) {
        await new Promise(resolve => setTimeout(resolve, 300));

        // Filter articles based on user preferences
        let filteredArticles = mockArticles.filter(article => {
            const newspaperMatch = userPreferences.newspapers.includes(article.newspaper);
            const sectionMatch = userPreferences.sections.includes(article.section);
            return newspaperMatch && sectionMatch;
        });

        // Score articles based on subtopic similarity
        if (userPreferences.subtopics.length > 0) {
            filteredArticles = filteredArticles.map(article => {
                const maxSimilarity = userPreferences.subtopics.reduce((max, subtopic) => {
                    const subtopicEmbedding = generateMockEmbedding(subtopic);
                    const similarity = cosineSimilarity(article.embedding, subtopicEmbedding);
                    return Math.max(max, similarity);
                }, 0);

                return { ...article, relevanceScore: maxSimilarity };
            }).sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        // Select top articles and add transitions
        const selectedArticles = filteredArticles.slice(0, 5);
        const episodeSegments = [];

        selectedArticles.forEach((article, index) => {
            episodeSegments.push({
                type: 'article',
                ...article
            });

            if (index < selectedArticles.length - 1) {
                const nextArticle = selectedArticles[index + 1];
                const transitionType = article.section === nextArticle.section ? 'same-section' : 'generic';
                const transition = transitionAudios.find(t => t.type === transitionType) || transitionAudios[3];

                episodeSegments.push({
                    type: 'transition',
                    ...transition
                });
            }
        });

        const totalDuration = episodeSegments.reduce((sum, seg) => sum + seg.duration, 0);

        return {
            id: 'episode-' + Date.now(),
            date: new Date(),
            title: `Your Daily Digest - ${new Date().toLocaleDateString()}`,
            segments: episodeSegments,
            articles: selectedArticles,
            duration: totalDuration,
            articleCount: selectedArticles.length
        };
    }

    async getEpisodeHistory(userId) {
        await new Promise(resolve => setTimeout(resolve, 200));
        // Return mock history
        return [];
    }

    async saveEpisode(episodeId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const saved = JSON.parse(localStorage.getItem('savedEpisodes') || '[]');
        saved.push(episodeId);
        localStorage.setItem('savedEpisodes', JSON.stringify(saved));
        return true;
    }
}

export default new EpisodeService();