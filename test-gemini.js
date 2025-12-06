/**
 * Test Gemini AI Integration
 * Quick test to verify AI-powered resume analysis
 */

const sampleResume = `
John Doe
Senior Software Engineer

SUMMARY:
Experienced software engineer with 5 years of expertise in building scalable web applications
and cloud-native solutions. Strong proficiency in JavaScript, React, Node.js, and AWS.

EXPERIENCE:
Senior Software Engineer at TechCorp (2021 - Present)
- Led development of microservices architecture using Node.js and Docker
- Implemented CI/CD pipelines using Jenkins and AWS
- Mentored junior developers and conducted code reviews

Frontend Developer at WebSolutions (2019 - 2021)
- Built responsive web applications using React and TypeScript
- Optimized application performance, reducing load time by 40%
- Collaborated with UX team to implement modern UI designs

SKILLS:
Programming: JavaScript, TypeScript, Python, Java
Frontend: React, Vue.js, HTML5, CSS3, Tailwind
Backend: Node.js, Express, FastAPI, Spring Boot
DevOps: Docker, Kubernetes, Jenkins, GitHub Actions
Cloud: AWS (EC2, S3, Lambda), Azure
Database: PostgreSQL, MongoDB, Redis

EDUCATION:
Bachelor of Science in Computer Science
University of California, 2019
AWS Certified Solutions Architect

PREFERRED LOCATIONS:
San Francisco, USA
London, UK
Remote
`;

async function testGeminiIntegration() {
    console.log('🧪 Testing Gemini AI Integration...\n');
    
    try {
        const response = await fetch('http://localhost:3000/api/resume/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resumeText: sampleResume,
                topN: 5
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ API Call Successful!\n');
            
            console.log('📊 Resume Analysis:');
            console.log('==================');
            console.log('AI-Powered:', data.resumeAnalysis.aiPowered ? '✨ Yes' : '🔄 Fallback');
            console.log('Summary:', data.resumeAnalysis.summary);
            console.log('Skills Found:', data.resumeAnalysis.skills.length);
            console.log('Experience:', data.resumeAnalysis.experience, 'years');
            console.log('Roles:', data.resumeAnalysis.roles.join(', '));
            console.log('Education:', data.resumeAnalysis.education.join(', '));
            console.log('Locations:', data.resumeAnalysis.locations.join(', '));
            
            console.log('\n🎯 Job Matches:');
            console.log('================');
            data.recommendations.slice(0, 5).forEach((match, i) => {
                console.log(`\n${i + 1}. ${match.job.title} at ${match.job.company}`);
                console.log(`   Match Score: ${match.percentage}% (${match.matchLevel})`);
                console.log(`   Location: ${match.job.location.city || match.job.location.country}`);
                console.log(`   Match Breakdown:`);
                console.log(`   - Skills: ${Math.round(match.breakdown.skills * 100)}%`);
                console.log(`   - Role: ${Math.round(match.breakdown.role * 100)}%`);
                console.log(`   - Location: ${Math.round(match.breakdown.location * 100)}%`);
                console.log(`   - Experience: ${Math.round(match.breakdown.experience * 100)}%`);
            });
            
            console.log('\n💡 AI Career Insights:');
            console.log('======================');
            console.log('AI-Powered:', data.insights.aiPowered ? '✨ Yes' : '🔄 Fallback');
            console.log('Average Match Score:', data.insights.averageScore + '%');
            console.log('Excellent Matches:', data.insights.excellentMatches);
            console.log('Good Matches:', data.insights.goodMatches);
            
            if (data.insights.recommendations) {
                console.log('\nRecommendations:');
                data.insights.recommendations.forEach((rec, i) => {
                    console.log(`${i + 1}. ${rec}`);
                });
            }
            
            console.log('\n✨ Test Complete! Gemini AI is working correctly.');
        } else {
            console.error('❌ API Error:', data.error);
        }
    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

testGeminiIntegration();
