import React, { useState } from 'react';
import NewsAdminSection from '../components/admin/NewsAdminSection';
import LessonsAdminSection from '../components/admin/LessonsAdminSection';
import QuizzesAdminSection from '../components/admin/QuizzesAdminSection';
import UsersAdminSection from '../components/admin/UsersAdminSection';
import '../admin-panel.css';

const TABS = [
  { key: 'news', label: 'News' },
  { key: 'lessons', label: 'Lessons & Modules' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'users', label: 'Users' },
];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('news');

  return (
    <div className="admin-panel-container">
      <h1 style={{color:'#2563eb',marginBottom:'1.5rem'}}>Admin Panel</h1>
      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="admin-section">
        {activeTab === 'news' && <NewsAdminSection />}
        {activeTab === 'lessons' && <LessonsAdminSection />}
        {activeTab === 'quizzes' && <QuizzesAdminSection />}
        {activeTab === 'users' && <UsersAdminSection />}
      </div>
    </div>
  );
}
