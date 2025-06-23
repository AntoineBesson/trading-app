import React, { useEffect, useState } from 'react';
import QuizzesService from '../../services/quizzesService';
import LessonsService from '../../services/lessonsService';
import '../../admin-panel.css';

export default function QuizzesAdminSection() {
  const [quizzes, setQuizzes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', lesson_id: '' });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({ question_text: '', choices: '', correct_answer: '', explanation: '', order: '' });
  const [currentQuizId, setCurrentQuizId] = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await QuizzesService.getAll();
      setQuizzes(res.data.quizzes || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch quizzes');
    }
    setLoading(false);
  };

  const fetchLessons = async () => {
    try {
      const res = await LessonsService.getAll();
      setLessons(res.data.lessons || []);
    } catch {}
  };

  useEffect(() => { fetchQuizzes(); fetchLessons(); }, []);

  // Quiz handlers
  const handleQuizInput = e => setQuizForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditQuiz = q => { setEditingQuiz(q); setQuizForm({ title: q.title, description: q.description, lesson_id: q.lesson_id || '' }); setShowQuizForm(true); };
  const handleDeleteQuiz = async id => { if (!window.confirm('Delete this quiz?')) return; await QuizzesService.delete(id); fetchQuizzes(); };
  const handleQuizSubmit = async e => {
    e.preventDefault();
    if (editingQuiz) {
      await QuizzesService.update(editingQuiz.id, quizForm);
    } else {
      await QuizzesService.create(quizForm);
    }
    setShowQuizForm(false); setEditingQuiz(null); setQuizForm({ title: '', description: '', lesson_id: '' }); fetchQuizzes();
  };

  // Question handlers
  const handleQuestionInput = e => setQuestionForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditQuestion = (q, quizId) => { setEditingQuestion(q); setCurrentQuizId(quizId); setQuestionForm({ question_text: q.question_text, choices: JSON.stringify(q.choices), correct_answer: q.correct_answer, explanation: q.explanation, order: q.order || '' }); setShowQuestionForm(true); };
  const handleDeleteQuestion = async (quizId, questionId) => { if (!window.confirm('Delete this question?')) return; await QuizzesService.deleteQuestion(quizId, questionId); fetchQuizzes(); };
  const handleQuestionSubmit = async e => {
    e.preventDefault();
    let choicesArr;
    try { choicesArr = JSON.parse(questionForm.choices); if (!Array.isArray(choicesArr)) throw new Error(); } catch { alert('Choices must be a JSON array of strings.'); return; }
    if (editingQuestion) {
      await QuizzesService.updateQuestion(currentQuizId, editingQuestion.id, { ...questionForm, choices: choicesArr });
    } else {
      await QuizzesService.addQuestion(currentQuizId, { ...questionForm, choices: choicesArr });
    }
    setShowQuestionForm(false); setEditingQuestion(null); setQuestionForm({ question_text: '', choices: '', correct_answer: '', explanation: '', order: '' }); fetchQuizzes();
  };
  const handleAddQuestion = (quizId) => { setCurrentQuizId(quizId); setEditingQuestion(null); setQuestionForm({ question_text: '', choices: '', correct_answer: '', explanation: '', order: '' }); setShowQuestionForm(true); };

  return (
    <div>
      <h2>Quizzes Management</h2>
      {loading ? <div>Loading...</div> : error ? <div style={{color:'red'}}>{error}</div> : (
        <>
          <button className="admin-btn" onClick={() => { setShowQuizForm(true); setEditingQuiz(null); setQuizForm({ title: '', description: '', lesson_id: '' }); }}>Add Quiz</button>
          <div style={{marginTop:24}}>
            {quizzes.map(quiz => (
              <div key={quiz.id} style={{border:'1px solid #ccc',borderRadius:8,marginBottom:24,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <b>{quiz.title}</b> <span style={{color:'#888'}}>({quiz.description})</span> <span style={{color:'#888'}}>Lesson: {lessons.find(l => l.id === quiz.lesson_id)?.title || 'None'}</span>
                  </div>
                  <div>
                    <button className="admin-btn" onClick={() => handleEditQuiz(quiz)}>Edit</button>
                    <button className="admin-btn danger" onClick={() => handleDeleteQuiz(quiz.id)} style={{marginLeft:8}}>Delete</button>
                    <button className="admin-btn" onClick={() => handleAddQuestion(quiz.id)} style={{marginLeft:8}}>Add Question</button>
                  </div>
                </div>
                <table className="admin-table" style={{width:'100%',marginTop:12}}>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Choices</th>
                      <th>Correct</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quiz.questions || []).map(q => (
                      <tr key={q.id}>
                        <td>{q.question_text}</td>
                        <td>{Array.isArray(q.choices) ? q.choices.join(', ') : ''}</td>
                        <td>{q.correct_answer}</td>
                        <td>{q.order}</td>
                        <td>
                          <button className="admin-btn" onClick={() => handleEditQuestion(q, quiz.id)}>Edit</button>
                          <button className="admin-btn danger" onClick={() => handleDeleteQuestion(quiz.id, q.id)} style={{marginLeft:8}}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
      {showQuizForm && (
        <div style={{marginTop:24, border:'1px solid #ccc', padding:16, borderRadius:8}}>
          <h3>{editingQuiz ? 'Edit Quiz' : 'Add Quiz'}</h3>
          <form className="admin-form" onSubmit={handleQuizSubmit}>
            <div>
              <label>Title<br/>
                <input name="title" value={quizForm.title} onChange={handleQuizInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Description<br/>
                <input name="description" value={quizForm.description} onChange={handleQuizInput} style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Lesson<br/>
                <select name="lesson_id" value={quizForm.lesson_id} onChange={handleQuizInput} style={{width:'100%'}}>
                  <option value="">None</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn" type="submit">{editingQuiz ? 'Update' : 'Create'}</button>
              <button className="admin-btn" type="button" onClick={() => { setShowQuizForm(false); setEditingQuiz(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {showQuestionForm && (
        <div style={{marginTop:24, border:'1px solid #ccc', padding:16, borderRadius:8}}>
          <h3>{editingQuestion ? 'Edit Question' : 'Add Question'}</h3>
          <form className="admin-form" onSubmit={handleQuestionSubmit}>
            <div>
              <label>Question Text<br/>
                <input name="question_text" value={questionForm.question_text} onChange={handleQuestionInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Choices (JSON array)<br/>
                <input name="choices" value={questionForm.choices} onChange={handleQuestionInput} required style={{width:'100%'}} placeholder='["A", "B", "C"]' />
              </label>
            </div>
            <div>
              <label>Correct Answer<br/>
                <input name="correct_answer" value={questionForm.correct_answer} onChange={handleQuestionInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Explanation<br/>
                <input name="explanation" value={questionForm.explanation} onChange={handleQuestionInput} style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Order<br/>
                <input name="order" value={questionForm.order} onChange={handleQuestionInput} type="number" style={{width:'100%'}} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn" type="submit">{editingQuestion ? 'Update' : 'Create'}</button>
              <button className="admin-btn" type="button" onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
