import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import portfolioService from '../services/portfolioService';
import contentService from '../services/contentService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getEducationProgress, setEducationProgress } from '../services/educationService';

const NAV_BLUE = '#2563eb';
const PIE_COLORS = [
  '#6366f1', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#38bdf8', '#f59e42', '#10b981', '#e11d48', '#f43f5e', '#0ea5e9', '#facc15', '#a3e635', '#fbbf24', '#f472b6', '#818cf8', '#f87171'
];

const styles = {
  background: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    padding: '2.5rem 0',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    alignItems: 'start',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '2rem',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#222',
  },
  newsItem: {
    marginBottom: '1.2rem',
    padding: '1rem',
    background: '#f8fafc',
    borderRadius: '10px',
  },
  button: {
    background: NAV_BLUE,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 2rem',
    fontWeight: 600,
    fontSize: '1.1rem',
    cursor: 'pointer',
    marginTop: '1.5rem',
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
    transition: 'background 0.2s',
  },
  pieSection: {
    textAlign: 'center',
  },
  summary: {
    fontSize: '1.05rem',
    color: '#444',
    marginBottom: '1rem',
  },
};

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [lastContent, setLastContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [eduProgress, setEduProgress] = useState(null);
  const [eduQuiz, setEduQuiz] = useState(null);
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  // Fetch portfolio for pie chart
  useEffect(() => {
    portfolioService.getPortfolio().then(res => {
      setPortfolio(res.data);
    }).catch(() => setPortfolio(null)).finally(() => setLoadingPortfolio(false));
  }, []);

  // Fetch last educational content (placeholder: fetch first content)
  useEffect(() => {
    contentService.getAllContent(1, 1).then(res => {
      setLastContent(res.data.contents?.[0] || null);
    }).catch(() => setLastContent(null)).finally(() => setLoadingContent(false));
  }, []);

  // Backend sync for education progress/quiz
  useEffect(() => {
    if (isAuthenticated) {
      getEducationProgress().then(res => {
        setEduProgress(res.data.progress || null);
        setEduQuiz(res.data.quiz || null);
        // Also update localStorage for offline fallback
        localStorage.setItem('eduProgress', JSON.stringify(res.data.progress));
        localStorage.setItem('eduQuiz', JSON.stringify(res.data.quiz));
      }).catch(() => {
        // fallback to localStorage already handled below
      });
    } else {
      setEduProgress(JSON.parse(localStorage.getItem('eduProgress')));
      setEduQuiz(JSON.parse(localStorage.getItem('eduQuiz')));
    }
  }, [isAuthenticated]);

  // Prepare pie chart data
  let pieData = [];
  let cash = 0;
  if (portfolio && portfolio.summary) {
    cash = Number(portfolio.summary.user_cash_balance || 0);
    pieData = [
      ...(portfolio.holdings || []).map((h) => ({
        name: h.name || h.symbol || 'Asset',
        value: Number(h.current_value || 0)
      })),
      { name: 'Cash', value: cash }
    ];
  }

  // Helper: Find next lesson route
  function getNextLessonRoute() {
    // Use the same curriculumData as EducationPage
    const curriculumData = {
      stocks: {
        modules: [
          { id: 1, lessons: Array(5) },
          { id: 2, lessons: Array(5) },
          { id: 3, lessons: Array(4) },
          { id: 4, lessons: Array(6) },
          { id: 5, lessons: Array(7) },
          { id: 6, lessons: Array(2) },
          { id: 7, lessons: Array(3) },
        ]
      },
      crypto: {
        modules: [
          { id: 8, lessons: Array(4) },
          { id: 9, lessons: Array(3) },
          { id: 10, lessons: Array(5) },
          { id: 11, lessons: Array(3) },
          { id: 12, lessons: Array(4) },
        ]
      }
    };
    // Find first lesson not completed
    for (const part of ['stocks', 'crypto']) {
      if (!eduProgress || !eduProgress[part]) continue;
      for (let m = 0; m < curriculumData[part].modules.length; m++) {
        const mod = curriculumData[part].modules[m];
        const progressArr = eduProgress[part]?.[m] || [];
        for (let l = 0; l < mod.lessons.length; l++) {
          if (!progressArr[l]) {
            // FIX: Use /content route, not /education
            return `/content?part=${part}&module=${mod.id}&lesson=${l}`;
          }
        }
      }
    }
    // If all complete, go to education home
    return '/content';
  }

  return (
    <div style={styles.background}>
      <div style={styles.container}>
        {/* News Section */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Recent News</div>
          {/* Placeholder news items */}
          <div style={styles.newsItem}><b>Market rallies as tech stocks surge</b><br /><span style={{color:'#555'}}>Tech sector leads gains as investors show renewed confidence in AI-driven companies.</span></div>
          <div style={styles.newsItem}><b>Federal Reserve holds interest rates steady</b><br /><span style={{color:'#555'}}>Analysts expect stable rates to support continued market growth through Q3.</span></div>
          <div style={styles.newsItem}><b>Oil prices dip amid global supply increase</b><br /><span style={{color:'#555'}}>Energy sector faces volatility as OPEC+ increases output.</span></div>
        </div>

        {/* Continue Learning Section */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Continue Learning</div>
          {eduProgress ? (
            <div>
              <b>Stock Market:</b> Lesson {eduProgress.stocks?.[0]?.lastIndexOf(true) + 1 || 1}<br />
              <b>Crypto:</b> Lesson {eduProgress.crypto?.[0]?.lastIndexOf(true) + 1 || 1}
            </div>
          ) : (
            <div>Start your first lesson to track progress!</div>
          )}
          <button style={styles.button} onClick={() => navigate(getNextLessonRoute())}>Continue</button>
          {loadingContent ? (
            <div>Loading your last content...</div>
          ) : lastContent ? (
            <div>
              <b>{lastContent.title}</b>
              <div style={{color:'#555', margin:'0.5rem 0 1rem 0'}}>{lastContent.content_type}</div>
              <button style={styles.button} onClick={() => navigate(`/content/${lastContent.id}`)}>Continue</button>
            </div>
          ) : (
            <div>No recent content found. <button style={styles.button} onClick={() => navigate('/content')}>Browse Content</button></div>
          )}
        </div>

        {/* Portfolio Pie Chart Section */}
        <div style={{...styles.card, gridColumn: '1 / span 2', ...styles.pieSection}}>
          <div style={styles.sectionTitle}>Your Portfolio Overview</div>
          {loadingPortfolio ? (
            <div>Loading portfolio...</div>
          ) : portfolio && portfolio.summary ? (
            <>
              <div style={styles.summary}><b>Total Value:</b> ${portfolio.summary.total_portfolio_value || 'N/A'}</div>
              <div style={styles.summary}><b>Total Cash:</b> ${portfolio.summary.user_cash_balance || 'N/A'}</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.name === 'Cash' ? NAV_BLUE : PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <button style={styles.button} onClick={() => navigate('/trade')}>Start Trading</button>
            </>
          ) : (
            <div>No portfolio data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
