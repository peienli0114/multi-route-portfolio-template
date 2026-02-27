import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../admin.css';
import CategoryEditor from './CategoryEditor';
import SkillsEditor from './SkillsEditor';
import BlobsEditor from './BlobsEditor';

interface PortfolioRoutesEditorProps {
  initialContent: string;
  onContentChange: (newContent: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveStatus?: string | null;
}

// Helper to safely parse JSON
const safeParseJson = (jsonString: string) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};

// Helper to safely stringify JSON
const safeStringifyJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error('Error stringifying JSON:', e);
    return '{}';
  }
};

const formatSmartCvSummary = (summary: any[]) => {
  if (!Array.isArray(summary)) return '';
  return summary.map(item => {
    if (Array.isArray(item)) {
      return item.map(sub => `- ${sub}`).join('\n');
    }
    return String(item);
  }).join('\n\n');
};

const parseSmartCvSummary = (text: string) => {
  const lines = text.split('\n');
  const result: any[] = [];

  let currentList: string[] = [];
  let currentTextBlock: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      result.push([...currentList]);
      currentList = [];
    }
  };

  const flushText = () => {
    if (currentTextBlock.length > 0) {
      result.push(currentTextBlock.join('\n'));
      currentTextBlock = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Empty line -> Separator (Flush everything, start new block)
    if (!trimmed) {
      flushList();
      flushText();
      continue;
    }

    // List Item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushText(); // Switch from text to list
      currentList.push(trimmed.substring(2).trim());
    }
    // Regular Text
    else {
      flushList(); // Switch from list to text
      currentTextBlock.push(rawLine.trim());
    }
  }

  // Final flush
  flushList();
  flushText();

  return result;
};


// Default template for a new profile
const defaultNewProfileData = {
  siteTitle: "New Profile Title",
  sidebarTitle: "New Profile Sidebar",
  footer: {
    title: "",
    message: "",
    email: ""
  },
  cv: {
    link: "",
    showGroups: []
  },
  skills: undefined,
  home: {
    badge: "",
    title: "",
    intro: []
  },
  cvSummary: [],
  categories: {}
};


const PortfolioRoutesEditor: React.FC<PortfolioRoutesEditorProps> = ({
  initialContent,
  onContentChange,
  onSave,
  isSaving,
  saveStatus
}) => {
  const [allData, setAllData] = useState<any>(() => safeParseJson(initialContent) || {});
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [cvSummaryDraft, setCvSummaryDraft] = useState<string>('');
  const [homeIntroDraft, setHomeIntroDraft] = useState<string>('');
  const [dataVersion, setDataVersion] = useState(0);
  const lastSyncedRef = useRef<{ key: string; version: number }>({
    key: '',
    version: -1,
  });

  const lastSyncedContentRef = useRef<string>('');

  useEffect(() => {
    // Prevent loop: if incoming content matches already synced, don't re-initialize
    if (initialContent === lastSyncedContentRef.current) return;

    const parsedData = safeParseJson(initialContent);
    if (parsedData) {
      setAllData(parsedData);
      setSelectedProfileKey((prevKey) => {
        if (prevKey && parsedData[prevKey]) {
          return prevKey;
        }
        const keys = Object.keys(parsedData);
        return keys.length ? keys[0] : '';
      });
      setDataVersion((version) => version + 1);
      setError(null);
      lastSyncedContentRef.current = initialContent;
    } else {
      setAllData({});
      setSelectedProfileKey('');
      setDataVersion((version) => version + 1);
      setError('Initial content is not valid JSON. Please correct it in the raw editor or add a new profile.');
    }
  }, [initialContent]);

  // Update parent when allData changes
  useEffect(() => {
    onContentChange(safeStringifyJson(allData));
  }, [allData, onContentChange]);

  const selectedProfileData = allData[selectedProfileKey];
  const defaultProfileData = allData['default'] || {};
  const profileKeys = Object.keys(allData);


  useEffect(() => {
    const shouldSync =
      lastSyncedRef.current.key !== selectedProfileKey ||
      lastSyncedRef.current.version !== dataVersion;

    if (!shouldSync) {
      return;
    }

    const profileData = allData[selectedProfileKey];
    if (!profileData) {
      setCvSummaryDraft('');
      setHomeIntroDraft('');
      return;
    }

    setCvSummaryDraft(formatSmartCvSummary(profileData.cvSummary || []));
    setHomeIntroDraft(
      Array.isArray(profileData.home?.intro)
        ? profileData.home.intro.join('\n\n')
        : '',
    );
    lastSyncedRef.current = { key: selectedProfileKey, version: dataVersion };
  }, [selectedProfileKey, dataVersion, allData]);


  const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProfileKey(e.target.value);
  }, []);

  const handleFieldChange = useCallback((profileKey: string, path: string[], value: any) => {
    setAllData((prevData: any) => {
      const newData = JSON.parse(JSON.stringify(prevData));
      let current = newData[profileKey];
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleStringArrayChange = useCallback(
    (profileKey: string, path: string[], value: string) => {
      setHomeIntroDraft(value);
      const paragraphs = value.split(/\n\s*\n/);
      const formatted = paragraphs
        .map((block) => block.replace(/\r/g, '').split('\n').join('  \n')) // Preserve single newlines as Markdown br
        .filter((item) => item.trim().length > 0);
      handleFieldChange(profileKey, path, formatted);
    },
    [handleFieldChange],
  );

  const handleFooterChange = useCallback((profileKey: string, field: string, value: string) => {
    handleFieldChange(profileKey, ['footer', field], value);
  }, [handleFieldChange]);

  const handleCvChange = useCallback((profileKey: string, field: string, value: string) => {
    if (field === 'showGroups') {
      handleFieldChange(profileKey, ['cv', field], value.split(',').map(s => s.trim()).filter(s => s));
    } else {
      handleFieldChange(profileKey, ['cv', field], value);
    }
  }, [handleFieldChange]);

  const handleAddProfile = useCallback(() => {
    const newKey = window.prompt('Enter a unique key for the new profile (e.g., "my_new_path"):');
    if (newKey && !profileKeys.includes(newKey)) {
      setAllData((prevData: any) => {
        const newData = { ...prevData, [newKey]: JSON.parse(JSON.stringify(defaultNewProfileData)) };
        return newData;
      });
      setSelectedProfileKey(newKey);
      setError(null);
    } else if (newKey) {
      setError(`Error: Profile key "${newKey}" already exists or is invalid.`);
    }
  }, [profileKeys]);

  const handleCopyProfile = useCallback(() => {
    if (!selectedProfileKey) return;
    const newKey = window.prompt(`Enter a unique key for the new profile (copy of "${selectedProfileKey}"):`);

    if (newKey && !profileKeys.includes(newKey)) {
      setAllData((prevData: any) => {
        const profileToCopy = JSON.parse(JSON.stringify(prevData[selectedProfileKey]));
        const newData = { ...prevData, [newKey]: profileToCopy };
        return newData;
      });
      setSelectedProfileKey(newKey);
      setError(null);
    } else if (newKey) {
      setError(`Error: Profile key "${newKey}" already exists or is invalid.`);
    }
  }, [profileKeys, selectedProfileKey]);

  const handleDeleteProfile = useCallback(() => {
    if (!selectedProfileKey) return;
    if (selectedProfileKey === 'default') {
      setError('Cannot delete the "default" profile.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete profile "${selectedProfileKey}"? This cannot be undone.`)) {
      const newAllData = { ...allData };
      delete newAllData[selectedProfileKey];
      setAllData(newAllData);
      const remainingKeys = Object.keys(newAllData);
      setSelectedProfileKey(remainingKeys.length > 0 ? remainingKeys[0] : '');
      setError(null);
    }
  }, [selectedProfileKey, allData]);


  if (profileKeys.length === 0) {
    return (
      <div className="editor-container">
        <h2>Portfolio Routes Editor</h2>
        {error && <p className="error-box">{error}</p>}
        <p>No profiles found. Click "Add Profile" to create one.</p>
        <button onClick={handleAddProfile} className="btn btn-primary">Add Profile</button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      {error && <div className="error-box">{error}</div>}

      {/* Sticky Control Bar */}
      <div
        className="editor-controls"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          borderBottom: '2px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '12px 16px',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label htmlFor="profile-select" className="editor-label" style={{ marginBottom: 0 }}>https://your-portfolio.vercel.app/#/</label>
          <select
            id="profile-select"
            value={selectedProfileKey}
            onChange={handleProfileChange}
            className="editor-select"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            {profileKeys.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <button onClick={handleAddProfile} className="btn btn-secondary" style={{ padding: '6px 12px' }}>+ Add</button>
          {selectedProfileKey && (
            <>
              <button onClick={handleCopyProfile} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Copy</button>
              <button
                onClick={handleDeleteProfile}
                className="btn btn-danger"
                disabled={selectedProfileKey === 'default'}
                style={{ padding: '6px 12px' }}
              >
                Delete
              </button>
            </>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Save Button */}
          {onSave && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {saveStatus && (
                <span style={{
                  color: saveStatus.includes('success') || saveStatus.includes('Saved') ? '#2e7d32' : '#1976d2',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}>
                  {saveStatus}
                </span>
              )}
              <button
                onClick={onSave}
                className="btn btn-primary"
                disabled={isSaving}
                style={{
                  padding: '8px 20px',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                {isSaving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedProfileData && (
        <>
          <div className="editor-section">
            <h3 className="editor-section-title">Profile: {selectedProfileKey}</h3>

            <div className="editor-grid-2">
              <div className="editor-col">
                <label className="editor-label">Site Title</label>
                <input
                  type="text"
                  className="editor-input"
                  value={selectedProfileData.siteTitle || ''}
                  placeholder={defaultProfileData.siteTitle || ''}
                  onChange={(e) => handleFieldChange(selectedProfileKey, ['siteTitle'], e.target.value)}
                />
              </div>
              <div className="editor-col">
                <label className="editor-label">Sidebar Title</label>
                <input
                  type="text"
                  className="editor-input"
                  value={selectedProfileData.sidebarTitle || ''}
                  placeholder={defaultProfileData.sidebarTitle || ''}
                  onChange={(e) => handleFieldChange(selectedProfileKey, ['sidebarTitle'], e.target.value)}
                />
              </div>
            </div>
            <div className="editor-grid-2" style={{ marginTop: '0.5rem' }}>
              <div className="editor-col">
                <label className="editor-label">Site Title (EN)</label>
                <input
                  type="text"
                  className="editor-input"
                  value={selectedProfileData.siteTitleEn || ''}
                  placeholder="English site title..."
                  onChange={(e) => handleFieldChange(selectedProfileKey, ['siteTitleEn'], e.target.value)}
                />
              </div>
              <div className="editor-col">
                <label className="editor-label">Sidebar Title (EN)</label>
                <input
                  type="text"
                  className="editor-input"
                  value={selectedProfileData.sidebarTitleEn || ''}
                  placeholder="English sidebar title..."
                  onChange={(e) => handleFieldChange(selectedProfileKey, ['sidebarTitleEn'], e.target.value)}
                />
              </div>
            </div>
            <div className="editor-row" style={{ marginTop: '1rem' }}>
              <label className="editor-label">語言 / Language</label>
              <select
                className="editor-select"
                value={selectedProfileData.lang || 'zh'}
                onChange={(e) => handleFieldChange(selectedProfileKey, ['lang'], e.target.value)}
                style={{ width: 'auto', minWidth: '200px' }}
              >
                <option value="zh">中文 (Chinese)</option>
                <option value="en">English (英文)</option>
              </select>
              <div className="editor-help-text" style={{ marginTop: '4px' }}>
                選擇「English」時，作品資訊將優先顯示英文欄位內容（含 Site Title EN / Sidebar Title EN）
              </div>
            </div>
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">Footer Content</h4>
            <div className="editor-grid-2" style={{ marginBottom: '1rem' }}>
              <div>
                <label className="editor-label">Footer Title</label>
                <input
                  type="text"
                  className="editor-input"
                  value={selectedProfileData.footer?.title || ''}
                  placeholder={defaultProfileData.footer?.title || ''}
                  onChange={(e) => handleFooterChange(selectedProfileKey, 'title', e.target.value)}
                />
              </div>
              <div>
                <label className="editor-label">Footer Email</label>
                <input
                  type="email"
                  className="editor-input"
                  value={selectedProfileData.footer?.email || ''}
                  placeholder={defaultProfileData.footer?.email || ''}
                  onChange={(e) => handleFooterChange(selectedProfileKey, 'email', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="editor-label">Footer Message</label>
              <textarea
                className="editor-input"
                value={selectedProfileData.footer?.message || ''}
                placeholder={defaultProfileData.footer?.message || ''}
                onChange={(e) => handleFooterChange(selectedProfileKey, 'message', e.target.value)}
                rows={2}
                style={{ minHeight: '60px' }}
              />
            </div>
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">CV Settings</h4>
            <div className="editor-row">
              <label className="editor-label">CV Link (Google Drive/PDF URL)</label>
              <input
                type="url"
                className="editor-input"
                value={selectedProfileData.cv?.link || ''}
                placeholder={defaultProfileData.cv?.link || ''}
                onChange={(e) => handleCvChange(selectedProfileKey, 'link', e.target.value)}
              />
            </div>
            <div className="editor-row">
              <label className="editor-label">Show Groups (comma-separated IDs)</label>
              <input
                type="text"
                className="editor-input"
                value={selectedProfileData.cv?.showGroups?.join(', ') || ''}
                placeholder={defaultProfileData.cv?.showGroups?.join(', ') || ''}
                onChange={(e) => handleCvChange(selectedProfileKey, 'showGroups', e.target.value)}
              />
            </div>
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">CV Skills（技能編輯）</h4>
            <div className="editor-help-text" style={{ marginBottom: '1rem' }}>
              每個路徑可以使用全域技能或自訂技能。自訂技能僅影響此路徑的 CV 顯示。
            </div>
            <SkillsEditor
              skills={selectedProfileData.skills}
              onChange={(newSkills) => handleFieldChange(selectedProfileKey, ['skills'], newSkills)}
            />
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">Home Page Content</h4>
            <div className="editor-help-text" style={{ marginBottom: '1rem' }}>Use <b>double line breaks</b> to separate paragraphs.</div>

            <div className="editor-row">
              <label className="editor-label">Badge (Subtitle)</label>
              <input
                type="text"
                className="editor-input"
                value={selectedProfileData.home?.badge || ''}
                placeholder={defaultProfileData.home?.badge || ''}
                onChange={(e) => handleFieldChange(selectedProfileKey, ['home', 'badge'], e.target.value)}
              />
            </div>
            <div className="editor-row">
              <label className="editor-label">Title (Main Headline)</label>
              <input
                type="text"
                className="editor-input"
                value={selectedProfileData.home?.title || ''}
                placeholder={defaultProfileData.home?.title || ''}
                onChange={(e) => handleFieldChange(selectedProfileKey, ['home', 'title'], e.target.value)}
              />
            </div>
            <div className="editor-row">
              <label className="editor-label">Introduction</label>
              <textarea
                className="editor-textarea"
                value={homeIntroDraft}
                placeholder={"Write your intro here.\n\nNew paragraph."}
                onChange={(e) => handleStringArrayChange(selectedProfileKey, ['home', 'intro'], e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">Home Blobs（首頁氣泡）</h4>
            <div className="editor-help-text" style={{ marginBottom: '1rem' }}>
              控制首頁右側的技能氣泡，可拖拽調整位置、調整大小、顏色與文字。每個路由可以有不同的氣泡配置。
            </div>
            <BlobsEditor
              blobs={selectedProfileData.blobs || selectedProfileData.home?.blobs || []}
              onChange={(newBlobs) => handleFieldChange(selectedProfileKey, ['blobs'], newBlobs)}
            />
          </div>

          <div className="editor-section">
            <div className="editor-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>CV Summary</span>
              <span className="editor-help-text">Smart Editor</span>
            </div>
            <div className="editor-help-text" style={{ marginBottom: '1rem' }}>
              Format: <b>Double Enter</b> for new paragraph. <b>Single Enter</b> for line break. Start with <code>- </code> for bullets.
            </div>
            <textarea
              className="editor-textarea code"
              value={cvSummaryDraft}
              onChange={(e) => {
                setCvSummaryDraft(e.target.value);
                const parsed = parseSmartCvSummary(e.target.value);
                handleFieldChange(selectedProfileKey, ['cvSummary'], parsed);
              }}
              rows={10}
              placeholder={"your.email@example.com\n\n**Experience**:\n- Job 1\n- Job 2"}
            />
          </div>

          <div className="editor-section">
            <h4 className="editor-section-title">Categories</h4>
            <CategoryEditor
              categories={selectedProfileData.categories || {}}
              onChange={(newCategories) => handleFieldChange(selectedProfileKey, ['categories'], newCategories)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PortfolioRoutesEditor;
