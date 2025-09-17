export const cosineSimilarity = (vec1, vec2) => {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
};

// Mock embedding generation for subtopics
export const generateMockEmbedding = (text) => {
    // In production, this would call your SBERT API
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
        Math.sin(hash) * 0.5 + 0.5,
        Math.cos(hash) * 0.5 + 0.5,
        Math.sin(hash * 2) * 0.5 + 0.5,
        Math.cos(hash * 2) * 0.5 + 0.5
    ];
};