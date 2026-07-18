import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import './Tables.css';
import './Problems.css';

import '../components/Skeleton.css';

const Problems = () => {
  const [sections, setSections] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeSubsection, setActiveSubsection] = useState(null);
  
  const [itemType, setItemType] = useState('problem');
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemPlatform, setItemPlatform] = useState('');
  const showToast = useToast();

  useEffect(() => {
    checkAdmin();
    fetchProblems();
  }, []);

  const checkAdmin = () => {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
      setIsAdmin(true);
    }
  };

  const fetchProblems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/problems`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getToken = () => localStorage.getItem('token');

  const handleAddSection = async () => {
    const name = window.prompt("Enter new Section Name (e.g., Graph):");
    if (!name) return;
    const desc = window.prompt("Enter description (optional):") || "";
    
    try {
      const res = await fetch(`${API_URL}/api/problems/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name, description: desc })
      });
      if (res.ok) fetchProblems();
      else showToast('Failed to create section.', 'error');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubsection = async (sectionId) => {
    const name = window.prompt("Enter new Subsection Name (e.g., DFS):");
    if (!name) return;
    const desc = window.prompt("Enter description (optional):") || "";
    
    try {
      const res = await fetch(`${API_URL}/api/problems/subsections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ section_id: sectionId, name, description: desc })
      });
      if (res.ok) fetchProblems();
      else showToast('Failed to create subsection.', 'error');
    } catch (e) {
      console.error(e);
    }
  };

  const openItemModal = (subsectionId) => {
    setActiveSubsection(subsectionId);
    setItemTitle('');
    setItemUrl('');
    setItemPlatform('');
    setItemType('problem');
    setShowItemModal(true);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/problems/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          subsection_id: activeSubsection,
          item_type: itemType,
          title: itemTitle,
          url: itemUrl,
          platform: itemPlatform || null
        })
      });
      if (res.ok) {
        setShowItemModal(false);
        fetchProblems();
      } else {
        showToast('Failed to add item.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container problems-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0, color: '#60a5fa' }}>Practice Archive</h1>
        {isAdmin && (
          <button onClick={handleAddSection} className="admin-btn-primary">
            + Add New Section
          </button>
        )}
      </div>

      <div className="sections-container">
        {loading ? (
          <div className="skeleton-container">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
            <div className="skeleton skeleton-title" style={{ marginTop: '2rem' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
          </div>
        ) : !isAdmin ? (
          <div className="coming-soon-card">
            <div className="coming-soon-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2>Problems Section Coming Soon</h2>
            <p>We are currently indexing our curated collection of competitive programming problems, topic-wise practice sets, and editorial resources. Check back shortly!</p>
          </div>
        ) : (
          <>
            <div className="admin-preview-banner" style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px dashed #60a5fa', padding: '0.8rem 1.2rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#60a5fa', fontSize: '0.9rem', textAlign: 'center' }}>
              <strong>Admin Notice:</strong> Students currently see the "Coming Soon" card. As an admin, you can view and build problem sections right here.
            </div>
            {sections.length === 0 && <p className="empty-state">No sections constructed yet.</p>}
            {sections.map(sec => (
          <div key={sec.id} className="problem-section">
            <div className="section-header">
              <h2>{sec.name}</h2>
              {isAdmin && <button onClick={() => handleAddSubsection(sec.id)} className="admin-btn-text">+ Subsection</button>}
            </div>
            {sec.description && <p className="section-desc">{sec.description}</p>}

            <div className="subsections-grid">
              {sec.subsections.map(sub => {
                const contests = sub.items.filter(i => i.item_type === 'contest');
                const problems = sub.items.filter(i => i.item_type === 'problem');
                return (
                  <div key={sub.id} className="problem-subsection">
                    <div className="subsection-header">
                      <h3>{sub.name}</h3>
                      {isAdmin && <button onClick={() => openItemModal(sub.id)} className="admin-btn-text small">+ Add Link</button>}
                    </div>
                    
                    <div className="links-group">
                      <h4 className="group-label">Contests</h4>
                      <ul className="item-list">
                        {contests.map(item => (
                          <li key={item.id}>
                            <a href={item.url} target="_blank" rel="noreferrer" className="item-link">
                              <span className="item-title">{item.title}</span>
                              {item.platform && <span className="item-platform">{item.platform}</span>}
                            </a>
                          </li>
                        ))}
                        {contests.length === 0 && <li className="empty-li">None yet</li>}
                      </ul>

                      <h4 className="group-label" style={{ marginTop: '1rem' }}>Practice Problems</h4>
                      <ul className="item-list">
                        {problems.map(item => (
                          <li key={item.id}>
                            <a href={item.url} target="_blank" rel="noreferrer" className="item-link">
                              <span className="item-title">{item.title}</span>
                              {item.platform && <span className="item-platform">{item.platform}</span>}
                            </a>
                          </li>
                        ))}
                        {problems.length === 0 && <li className="empty-li">None yet</li>}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
          </>
        )}
      </div>

      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Link</h2>
            <form onSubmit={submitItem} className="modal-form">
              <div className="form-group">
                <label>Type</label>
                <select value={itemType} onChange={e => setItemType(e.target.value)} className="form-input">
                  <option value="problem">Single Problem</option>
                  <option value="contest">Entire Contest</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input required value={itemTitle} onChange={e => setItemTitle(e.target.value)} className="form-input" placeholder="e.g. Codeforces Round 123" />
              </div>
              <div className="form-group">
                <label>Platform (Optional)</label>
                <input value={itemPlatform} onChange={e => setItemPlatform(e.target.value)} className="form-input" placeholder="e.g. Codeforces" />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input required type="url" value={itemUrl} onChange={e => setItemUrl(e.target.value)} className="form-input" placeholder="https://..." />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowItemModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Add It</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problems;
