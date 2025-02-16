# 🚀 ClassPulse

<div align="center">
  <h3>AI-Powered Teaching Assistant</h3>
  <p>Bridging the gap between professors and students with real-time insights</p>
</div>

## 💡 Inspiration

Education is evolving, but professors often struggle to gauge real-time student understanding during lectures or identify key learning gaps from homework. Inspired by the idea of using AI to bridge this gap, we set out to build a solution that provides professors with deeper, actionable insights—making classrooms more interactive and helping students succeed.

## 🎯 What it does

ClassPulse is an AI-powered assistant for professors that helps them better understand their students through two key approaches:

### 🎓 Real-time Classroom Insights
- Listens to live lectures and generates targeted questions
- Collects and analyzes student responses in real-time
- Provides immediate feedback on student comprehension
- Helps professors adjust their teaching on the fly

### 📚 Smart Homework Analysis
- Automated grading with detailed question-level analysis
- Identifies common mistakes and learning patterns
- Surfaces actionable insights for targeted intervention
- Saves professors countless hours of manual grading

## 🛠 How we built it

### Backend Architecture
- FastAPI for robust API development
- PostgreSQL via Supabase for scalable data storage
- OpenAI/Gemini APIs for advanced NLP capabilities
- Background jobs for homework analysis

### Frontend Stack
```
Next.js 15 | React 19 | TypeScript | Tailwind CSS | shadcn/ui | Recharts
```

### AI Integration
```
OpenAI API | Google Gemini Pro | Natural Language Processing | Pattern Recognition
```

## 🎯 Challenges we ran into

- **Summarization Accuracy**: Fine-tuning AI prompts to generate meaningful insights without overwhelming users
- **Real-time Processing**: Optimizing the system for immediate feedback during live sessions
- **Data Integration**: Seamlessly combining insights from multiple sources

## 🏆 Accomplishments that we're proud of

- Built a real-time AI system that enhances classroom engagement
- Automated homework analysis with actionable insights
- Created an intuitive interface for complex data visualization
- Integrated multiple AI models for enhanced accuracy

## 🎓 What we learned

- Advanced techniques for educational data summarization
- Integration strategies for multiple AI models
- Real-time data processing and visualization
- Building scalable education technology

## 🚀 Quick Start

### Backend Setup

1. Clone and setup environment:
```bash
git clone https://github.com/speedstorm1/treehacks25.git
cd treehacks25/treehacks-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_ai_api_key
OPENAI_API_KEY=your_openai_api_key
```

3. Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. Install dependencies:
```bash
cd ../treehacks-frontend
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app in action!

## 📈 What's next for ClassPulse

- **Enhanced Student Insights**: Long-term performance tracking across assignments
- **Student Engagement Tools**: Interactive features for personalized feedback
- **Broader AI Integration**: Support for new models and improved accuracy
- **Analytics Dashboard**: Advanced visualization of learning patterns
- **Mobile Support**: Real-time insights on the go

## 🔌 API Documentation

### Sessions
```
GET    /api/sessions            # List all sessions
POST   /api/sessions            # Create new session
GET    /api/sessions/{id}       # Get session details
GET    /api/sessions/{id}/stats # Get session statistics
```

### Assignments
```
GET    /assignment              # List assignments
POST   /assignment              # Create assignment
GET    /assignment/{id}         # Get assignment details
GET    /assignment/{id}/insights # Get assignment insights
```

### Topics
```
GET    /api/topics             # List topics
POST   /api/topics             # Create topic
PUT    /api/topics/{id}        # Update topic
DELETE /api/topics/{id}        # Delete topic
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ during TreeHacks 2024
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI features powered by OpenAI and Google's Gemini Pro

---

<div align="center">
  Made with 🌟 by Team ClassPulse
</div>