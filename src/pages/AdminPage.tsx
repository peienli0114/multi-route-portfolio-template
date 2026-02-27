import React, { useState, useEffect } from 'react';
import PortfolioRoutesEditor from '../components/Admin/PortfolioRoutesEditor';
import ExperienceEditor from '../components/Admin/ExperienceEditor';
import WorkDataEditor from '../components/Admin/WorkDataEditor';
import PublishDataEditor from '../components/Admin/PublishDataEditor';
import '../admin.css';

const API_URL = 'http://localhost:3001/api/data-files';

// 檔案名稱 → 中文友善顯示名稱
const FILE_DISPLAY_NAMES: Record<string, string> = {
    'allWorkData.json': '📁 作品資訊',
    'experienceData.json': '📄 CV 經歷',
    'portfolioRoutes.json': '🔗 路由設定',
    'publishData.json': '📰 發表紀錄',
    'skillsData.json': '🛠️ 技能資料',
};

/** 取得檔案的顯示名稱，若無對照則顯示原檔名 */
const getDisplayName = (filename: string): string =>
    FILE_DISPLAY_NAMES[filename] || filename;

const AdminPage = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    useEffect(() => {
        document.title = '作品集資料管理';
    }, []);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Failed to fetch file list.');
                }
                const data = await response.json();
                setFiles(data);
            } catch (err: any) {
                setError(err.message);
            }
        };
        fetchFiles();
    }, []);

    const handleFileSelect = async (filename: string) => {
        setSelectedFile(filename);
        setContent('');
        setSaveStatus(null);
        setError(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch file content for ${filename}.`);
            }
            const data = await response.text();
            setContent(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        setSaveStatus('Saving...');
        setError(null);
        try {
            const response = await fetch(`${API_URL}/${selectedFile}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save file.');
            }

            // Auto-sync portfolioMap.json when allWorkData.json is saved
            if (selectedFile === 'allWorkData.json') {
                try {
                    const allWorkData = JSON.parse(content);
                    const portfolioMap: Record<string, string> = {};
                    for (const [code, detail] of Object.entries(allWorkData)) {
                        const d = detail as any;
                        portfolioMap[code] = (d.tableName || d.fullName || code).replace(/\n/g, ' ').trim();
                    }
                    const mapContent = JSON.stringify(portfolioMap, null, 2) + '\n';
                    await fetch(`${API_URL}/portfolioMap.json`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: mapContent }),
                    });
                } catch (syncErr) {
                    console.error('Failed to sync portfolioMap.json:', syncErr);
                }
            }

            setSaveStatus('Saved successfully!');
            setTimeout(() => setSaveStatus(null), 3000); // Clear message
        } catch (err: any) {
            setError(err.message);
            setSaveStatus('Save failed.');
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-sidebar">
                <h2 className="admin-sidebar-title">Files</h2>
                {error && <div className="error-box">{error}</div>}
                <ul className="admin-file-list">
                    {files.map(file => (
                        <li
                            key={file}
                            onClick={() => handleFileSelect(file)}
                            className={`admin-file-item ${selectedFile === file ? 'active' : ''}`}
                        >
                            {getDisplayName(file)}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="admin-main">
                {selectedFile === 'portfolioRoutes.json' ? (
                    <div className="admin-content-scroll">
                        <PortfolioRoutesEditor
                            initialContent={content}
                            onContentChange={setContent}
                            onSave={handleSave}
                            isSaving={isLoading}
                            saveStatus={saveStatus}
                        />
                    </div>
                ) : selectedFile === 'allWorkData.json' ? (
                    <div className="admin-content-scroll" style={{ position: 'relative' }}>
                        <WorkDataEditor initialContent={content} onContentChange={setContent} />
                        <div style={{
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                            background: 'linear-gradient(transparent, #f5f7f8 12px)',
                            paddingTop: '18px',
                            paddingBottom: '12px',
                        }}>
                            <div className="editor-controls" style={{ marginTop: 0, borderTop: 'none', justifyContent: 'flex-end', boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
                                {saveStatus && <span style={{ marginRight: 'auto', color: '#2e7d32', fontWeight: 500 }}>{saveStatus}</span>}
                                <button className="btn btn-primary" onClick={handleSave} disabled={isLoading} style={{ padding: '0.7rem 2rem', fontSize: '1rem' }}>儲存變更</button>
                            </div>
                        </div>
                    </div>
                ) : selectedFile === 'experienceData.json' ? (
                    <div className="admin-content-scroll">
                        <ExperienceEditor initialContent={content} onContentChange={setContent} />
                        <div className="editor-controls" style={{ marginTop: '1rem', borderTop: 'none' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>Save Changes</button>
                            {saveStatus && <span style={{ marginLeft: '1rem', color: '#2e7d32', fontWeight: 500 }}>{saveStatus}</span>}
                        </div>
                    </div>
                ) : selectedFile === 'publishData.json' ? (
                    <div className="admin-content-scroll" style={{ position: 'relative' }}>
                        <PublishDataEditor initialContent={content} onContentChange={setContent} />
                        <div style={{
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                            background: 'linear-gradient(transparent, #f5f7f8 12px)',
                            paddingTop: '18px',
                            paddingBottom: '12px',
                        }}>
                            <div className="editor-controls" style={{ marginTop: 0, borderTop: 'none', justifyContent: 'flex-end', boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
                                {saveStatus && <span style={{ marginRight: 'auto', color: '#2e7d32', fontWeight: 500 }}>{saveStatus}</span>}
                                <button className="btn btn-primary" onClick={handleSave} disabled={isLoading} style={{ padding: '0.7rem 2rem', fontSize: '1rem' }}>儲存變更</button>
                            </div>
                        </div>
                    </div>
                ) : selectedFile ? (
                    <div className="admin-content-scroll">
                        <div className="editor-section">
                            <div className="editor-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Editing: {selectedFile}</span>
                                <div>
                                    <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>Save</button>
                                    {saveStatus && <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#2e7d32' }}>{saveStatus}</span>}
                                </div>
                            </div>
                            <textarea
                                className="editor-textarea code"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                style={{ minHeight: '600px' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="admin-content-scroll">
                        <div className="editor-section">
                            <p style={{ color: '#666' }}>Select a file from the sidebar to start editing.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;