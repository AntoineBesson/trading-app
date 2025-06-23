import React, { useEffect, useState } from 'react';
import ModulesService from '../../services/modulesService';
import LessonsService from '../../services/lessonsService';
import '../../admin-panel.css';

export default function LessonsAdminSection() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: '' });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', content_type: 'article', body: '', video_url: '', order: '' });
  const [currentModuleId, setCurrentModuleId] = useState(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await ModulesService.getAll();
      setModules(res.data.modules || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch modules');
    }
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  // Module handlers
  const handleModuleInput = e => setModuleForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditModule = m => { setEditingModule(m); setModuleForm({ title: m.title, description: m.description, order: m.order || '' }); setShowModuleForm(true); };
  const handleDeleteModule = async id => { if (!window.confirm('Delete this module?')) return; await ModulesService.delete(id); fetchModules(); };
  const handleModuleSubmit = async e => {
    e.preventDefault();
    if (editingModule) {
      await ModulesService.update(editingModule.id, moduleForm);
    } else {
      await ModulesService.create(moduleForm);
    }
    setShowModuleForm(false); setEditingModule(null); setModuleForm({ title: '', description: '', order: '' }); fetchModules();
  };

  // Lesson handlers
  const handleLessonInput = e => setLessonForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditLesson = (l, moduleId) => { setEditingLesson(l); setCurrentModuleId(moduleId); setLessonForm({ title: l.title, content_type: l.content_type, body: l.body, video_url: l.video_url, order: l.order || '' }); setShowLessonForm(true); };
  const handleDeleteLesson = async (id) => { if (!window.confirm('Delete this lesson?')) return; await LessonsService.delete(id); fetchModules(); };
  const handleLessonSubmit = async e => {
    e.preventDefault();
    if (editingLesson) {
      await LessonsService.update(editingLesson.id, lessonForm);
      await LessonsService.setModule(editingLesson.id, currentModuleId, lessonForm.order);
    } else {
      const res = await LessonsService.create({ ...lessonForm, module_id: currentModuleId });
      await LessonsService.setModule(res.data.lesson.id, currentModuleId, lessonForm.order);
    }
    setShowLessonForm(false); setEditingLesson(null); setLessonForm({ title: '', content_type: 'article', body: '', video_url: '', order: '' }); fetchModules();
  };
  const handleAddLesson = (moduleId) => { setCurrentModuleId(moduleId); setEditingLesson(null); setLessonForm({ title: '', content_type: 'article', body: '', video_url: '', order: '' }); setShowLessonForm(true); };

  return (
    <div>
      <h2>Modules & Lessons Management</h2>
      {loading ? <div>Loading...</div> : error ? <div style={{color:'red'}}>{error}</div> : (
        <>
          <button className="admin-btn" onClick={() => { setShowModuleForm(true); setEditingModule(null); setModuleForm({ title: '', description: '', order: '' }); }}>Add Module</button>
          <div style={{marginTop:24}}>
            {modules.map(module => (
              <div key={module.id} style={{border:'1px solid #ccc',borderRadius:8,marginBottom:24,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <b>{module.title}</b> <span style={{color:'#888'}}>({module.description})</span> <span style={{color:'#888'}}>Order: {module.order}</span>
                  </div>
                  <div>
                    <button className="admin-btn" onClick={() => handleEditModule(module)}>Edit</button>
                    <button className="admin-btn danger" onClick={() => handleDeleteModule(module.id)} style={{marginLeft:8}}>Delete</button>
                    <button className="admin-btn" onClick={() => handleAddLesson(module.id)} style={{marginLeft:8}}>Add Lesson</button>
                  </div>
                </div>
                <table className="admin-table" style={{width:'100%',marginTop:12}}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(module.lessons || []).map(lesson => (
                      <tr key={lesson.id}>
                        <td>{lesson.title}</td>
                        <td>{lesson.content_type}</td>
                        <td>{lesson.order}</td>
                        <td>
                          <button className="admin-btn" onClick={() => handleEditLesson(lesson, module.id)}>Edit</button>
                          <button className="admin-btn danger" onClick={() => handleDeleteLesson(lesson.id)} style={{marginLeft:8}}>Delete</button>
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
      {showModuleForm && (
        <div style={{marginTop:24, border:'1px solid #ccc', padding:16, borderRadius:8}}>
          <h3>{editingModule ? 'Edit Module' : 'Add Module'}</h3>
          <form className="admin-form" onSubmit={handleModuleSubmit}>
            <div>
              <label>Title<br/>
                <input name="title" value={moduleForm.title} onChange={handleModuleInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Description<br/>
                <input name="description" value={moduleForm.description} onChange={handleModuleInput} style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Order<br/>
                <input name="order" value={moduleForm.order} onChange={handleModuleInput} type="number" style={{width:'100%'}} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn" type="submit">{editingModule ? 'Update' : 'Create'}</button>
              <button className="admin-btn" type="button" onClick={() => { setShowModuleForm(false); setEditingModule(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {showLessonForm && (
        <div style={{marginTop:24, border:'1px solid #ccc', padding:16, borderRadius:8}}>
          <h3>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
          <form className="admin-form" onSubmit={handleLessonSubmit}>
            <div>
              <label>Title<br/>
                <input name="title" value={lessonForm.title} onChange={handleLessonInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Type<br/>
                <select name="content_type" value={lessonForm.content_type} onChange={handleLessonInput} style={{width:'100%'}}>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </label>
            </div>
            <div>
              <label>Body<br/>
                <textarea name="body" value={lessonForm.body} onChange={handleLessonInput} style={{width:'100%',minHeight:60}} />
              </label>
            </div>
            <div>
              <label>Video URL<br/>
                <input name="video_url" value={lessonForm.video_url} onChange={handleLessonInput} style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Order<br/>
                <input name="order" value={lessonForm.order} onChange={handleLessonInput} type="number" style={{width:'100%'}} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn" type="submit">{editingLesson ? 'Update' : 'Create'}</button>
              <button className="admin-btn" type="button" onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
