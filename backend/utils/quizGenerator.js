const axios = require('axios');

const perplexityClient = axios.create({
  baseURL: 'https://api.perplexity.ai',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
  timeout: 30000,
});

async function generateQuizWithPerplexity(courseTitle, courseContent) {
  const limitedContent = (courseContent || '').substring(0, 3000);

  const prompt = `
You are an expert educational content developer. Create a 5-question multiple choice quiz from this course content.
COURSE TITLE: "${courseTitle}"
COURSE CONTENT:
---
${limitedContent}
---
Return ONLY JSON in this format:
{
  "title": "Quiz: ${courseTitle}",
  "questions": [
    {
      "questionIndex": 0,
      "question": "What is ...?",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "..."
    }
  ]
}
`;

  try {
    const response = await perplexityClient.post('/chat/completions', {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating educational quizzes. You ONLY respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = response.data.choices[0].message.content;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse JSON from Perplexity response');
      data = JSON.parse(match[0]);
    }

    if (!data.questions || data.questions.length === 0) {
      throw new Error('Generated quiz has no questions');
    }

    return data;
  } catch (err) {
    console.error('Perplexity status:', err.response?.status);
    console.error('Perplexity data:', err.response?.data);
    throw new Error(err.response?.data?.error || err.message);
  }
}

module.exports = { generateQuizWithPerplexity };
