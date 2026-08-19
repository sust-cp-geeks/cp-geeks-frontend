import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import './Tables.css';
import './Problems.css';

import '../components/Skeleton.css';

const DEFAULT_SECTIONS = [
  {
    id: 1,
    name: "Graph Theory & Trees",
    description: "BFS, DFS, Dijkstra, Segment Trees, and LCA",
    subsections: [
      {
        id: 11,
        name: "Shortest Paths",
        items: [
          { id: 101, title: "Dijkstra Algorithm Practice", url: "https://codeforces.com", platform: "Codeforces", item_type: "problem" }
        ]
      }
    ]
  }
];

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

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');

  const [showSubsectionModal, setShowSubsectionModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [subsectionName, setSubsectionName] = useState('');
  const [subsectionDesc, setSubsectionDesc] = useState('');

  const showToast = useToast();

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
        if (Array.isArray(data.data)) {
          setSections(data.data);
        } else {
          setSections(DEFAULT_SECTIONS);
        }
      } else {
        setSections(DEFAULT_SECTIONS);
      }
    } catch {
      setSections(DEFAULT_SECTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAdmin();
      fetchProblems();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getToken = () => localStorage.getItem('token');

  const openSectionModal = () => {
    setSectionName('');
    setSectionDesc('');
    setShowSectionModal(true);
  };

  const submitSection = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/problems/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name: sectionName, description: sectionDesc })
      });
      if (res.ok) {
        setShowSectionModal(false);
        fetchProblems();
      } else {
        const errText = await res.text().catch(() => 'Unknown error');
        showToast(`Failed to create section: ${errText}`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error.', 'error');
    }
  };

  const openSubsectionModal = (sectionId) => {
    setActiveSection(sectionId);
    setSubsectionName('');
    setSubsectionDesc('');
    setShowSubsectionModal(true);
  };

  const submitSubsection = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/problems/subsections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ section_id: activeSection, name: subsectionName, description: subsectionDesc })
      });
      if (res.ok) {
        setShowSubsectionModal(false);
        fetchProblems();
      } else {
        const errText = await res.text().catch(() => 'Unknown error');
        showToast(`Failed to create subsection: ${errText}`, 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error.', 'error');
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
        const errorText = await res.text().catch(() => 'Unknown error');
        showToast(`Failed to add item: ${errorText}`, 'error');
        console.error('Server error response:', errorText);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container problems-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Practice Archive</h1>
        {isAdmin && (
          <button onClick={openSectionModal} className="admin-btn-primary">
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
        ) : (
          <>
            {sections.length === 0 && <p className="empty-state">No sections constructed yet.</p>}
            {sections.map(sec => (
          <div key={sec.id} className="problem-section">
            <div className="section-header">
              <h2>{sec.name}</h2>
              {isAdmin && <button onClick={() => openSubsectionModal(sec.id)} className="admin-btn-text">+ Subsection</button>}
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

      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Section</h2>
            <form onSubmit={submitSection} className="modal-form">
              <div className="form-group">
                <label>Section Name</label>
                <input required value={sectionName} onChange={e => setSectionName(e.target.value)} className="form-input" placeholder="e.g. Graph Theory" />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea value={sectionDesc} onChange={e => setSectionDesc(e.target.value)} className="form-textarea" placeholder="e.g. BFS, DFS, Dijkstra" rows="3" />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowSectionModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Create Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubsectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Subsection</h2>
            <form onSubmit={submitSubsection} className="modal-form">
              <div className="form-group">
                <label>Subsection Name</label>
                <input required value={subsectionName} onChange={e => setSubsectionName(e.target.value)} className="form-input" placeholder="e.g. Shortest Paths" />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea value={subsectionDesc} onChange={e => setSubsectionDesc(e.target.value)} className="form-textarea" placeholder="e.g. Dijkstra and Bellman Ford" rows="3" />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowSubsectionModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Create Subsection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problems;
