const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Interview Preparation Service
 * Generates interview questions and tips based on job description
 */
class InterviewPrepService {
  constructor() {
    // Initialize Gemini AI if available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      this.model = null;
    }
  }

  /**
   * Generate interview questions for a job
   */
  async generateQuestions(job, resumeText = null) {
    if (!this.model) {
      return this.fallbackQuestions(job);
    }

    try {
      const prompt = `You are an expert career coach. Generate interview preparation materials for this job:

**Job Details:**
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location.city}, ${job.location.country}
- Description: ${job.description || 'Software engineering role'}

${resumeText ? `**Candidate Resume:**\n${resumeText.substring(0, 500)}` : ''}

Generate:
1. **Common Questions** (5-7 questions typically asked for this role)
2. **Technical Questions** (5-7 technical questions specific to required skills)
3. **Behavioral Questions** (3-5 STAR method questions)
4. **Questions to Ask** (3-5 smart questions candidate should ask interviewer)
5. **Preparation Tips** (3-4 specific tips for this interview)

Return as JSON:
{
  "commonQuestions": ["Question 1", ...],
  "technicalQuestions": ["Tech Q1", ...],
  "behavioralQuestions": ["Behavioral Q1", ...],
  "questionsToAsk": ["Smart question 1", ...],
  "preparationTips": ["Tip 1", ...]
}

Return ONLY valid JSON without markdown formatting.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const questions = JSON.parse(cleanedText);

      return {
        success: true,
        job: {
          id: job.id,
          title: job.title,
          company: job.company
        },
        interview: {
          ...questions,
          aiPowered: true
        }
      };

    } catch (error) {
      console.error('Interview prep AI error:', error.message);
      return this.fallbackQuestions(job);
    }
  }

  /**
   * Fallback questions when AI is not available
   */
  fallbackQuestions(job) {
    const role = job.title.toLowerCase();
    const isEngineer = role.includes('engineer') || role.includes('developer');
    const isManager = role.includes('manager') || role.includes('lead');

    const commonQuestions = [
      'Tell me about yourself and your background',
      `Why are you interested in working at ${job.company}?`,
      'What are your greatest strengths and weaknesses?',
      'Where do you see yourself in 5 years?',
      'Why should we hire you for this position?'
    ];

    const technicalQuestions = isEngineer ? [
      'Describe your experience with the technologies mentioned in the job description',
      'Walk me through a challenging project you worked on',
      'How do you approach debugging and problem-solving?',
      'What development tools and practices do you use?',
      'How do you stay updated with new technologies?'
    ] : [
      'What relevant experience do you have for this role?',
      'How do you prioritize tasks and manage deadlines?',
      'What tools or systems have you used in previous roles?',
      'Describe your workflow for typical projects'
    ];

    const behavioralQuestions = [
      'Tell me about a time you faced a difficult challenge at work',
      'Describe a situation where you had to work with a difficult team member',
      'Give an example of when you showed leadership',
      'Tell me about a time you failed and what you learned'
    ];

    const questionsToAsk = [
      'What does success look like in this role?',
      'What are the biggest challenges facing the team right now?',
      'What is the team structure and who would I be working with?',
      'What opportunities are there for professional development?'
    ];

    const preparationTips = [
      `Research ${job.company}'s recent news, products, and culture`,
      'Prepare specific examples using the STAR method (Situation, Task, Action, Result)',
      'Review the job description and match your experience to required skills',
      'Prepare thoughtful questions about the role and company'
    ];

    if (isManager) {
      technicalQuestions.push(
        'How do you handle conflict within your team?',
        'Describe your management style and philosophy'
      );
      preparationTips.push(
        'Prepare examples of team management and leadership successes'
      );
    }

    return {
      success: true,
      job: {
        id: job.id,
        title: job.title,
        company: job.company
      },
      interview: {
        commonQuestions,
        technicalQuestions,
        behavioralQuestions,
        questionsToAsk,
        preparationTips,
        aiPowered: false
      }
    };
  }

  /**
   * Generate mock interview practice
   */
  async generateMockInterview(job, difficulty = 'medium') {
    if (!this.model) {
      return {
        success: false,
        message: 'AI not available for mock interviews'
      };
    }

    try {
      const prompt = `Create a realistic mock interview scenario for this position:

Job: ${job.title} at ${job.company}
Difficulty: ${difficulty}

Generate a realistic interview dialogue with:
1. Interviewer introduction
2. 3-5 interview questions with expected answer points
3. Evaluation criteria for each answer

Return as JSON:
{
  "scenario": "Interview scenario description",
  "questions": [
    {
      "question": "The question",
      "expectedPoints": ["Point 1", "Point 2"],
      "evaluationCriteria": ["Criteria 1", "Criteria 2"]
    }
  ]
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const mockInterview = JSON.parse(cleanedText);

      return {
        success: true,
        data: mockInterview
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate mock interview',
        error: error.message
      };
    }
  }

  /**
   * Analyze answer to interview question
   */
  async analyzeAnswer(question, answer) {
    if (!this.model) {
      return {
        success: false,
        message: 'AI not available for answer analysis'
      };
    }

    try {
      const prompt = `As an interview coach, analyze this interview answer:

Question: ${question}
Answer: ${answer}

Provide:
1. Score (0-10)
2. Strengths (2-3 points)
3. Areas for improvement (2-3 points)
4. Suggested improvements (specific suggestions)

Return as JSON:
{
  "score": 7,
  "strengths": ["Good structure", "Specific examples"],
  "improvements": ["Could elaborate more", "Add quantifiable results"],
  "suggestions": "Consider using the STAR method..."
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const analysis = JSON.parse(cleanedText);

      return {
        success: true,
        data: analysis
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to analyze answer',
        error: error.message
      };
    }
  }
}

module.exports = InterviewPrepService;
