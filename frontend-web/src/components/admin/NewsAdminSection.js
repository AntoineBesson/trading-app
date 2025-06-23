import React, { useEffect, useState } from 'react';
import NewsService from '../../services/newsService';
import '../../admin-panel.css';

export default function NewsAdminSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // news item being edited
  const [form, setForm] = useState({ title: '', preview: '', content: '' });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await NewsService.getAll();
      setNews(res.data.news || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch news');
    }
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const handleInput = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleEdit = item => {
    setEditing(item);
    setForm({ title: item.title, preview: item.preview, content: item.content });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this news item?')) return;
    await NewsService.delete(id);
    fetchNews();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editing) {
      await NewsService.update(editing.id, form);
    } else {
      await NewsService.create(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', preview: '', content: '' });
    fetchNews();
  };

  return (
    <div>
      <h2>News Management</h2>
      {loading ? <div>Loading...</div> : error ? <div style={{color:'red'}}>{error}</div> : (
        <>
          <button className="admin-btn" onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', preview: '', content: '' }); }}>Add News</button>
          <table className="admin-table" style={{width:'100%',marginTop:16}}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Preview</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.preview}</td>
                  <td>{item.created_at?.slice(0,10)}</td>
                  <td>
                    <button className="admin-btn" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="admin-btn danger" onClick={() => handleDelete(item.id)} style={{marginLeft:8}}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {showForm && (
        <div style={{marginTop:24, border:'1px solid #ccc', padding:16, borderRadius:8}}>
          <h3>{editing ? 'Edit News' : 'Add News'}</h3>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div>
              <label>Title<br/>
                <input name="title" value={form.title} onChange={handleInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Preview<br/>
                <input name="preview" value={form.preview} onChange={handleInput} required style={{width:'100%'}} />
              </label>
            </div>
            <div>
              <label>Content<br/>
                <textarea name="content" value={form.content} onChange={handleInput} required style={{width:'100%',minHeight:80}} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn">{editing ? 'Update' : 'Create'}</button>
              <button type="button" className="admin-btn" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
