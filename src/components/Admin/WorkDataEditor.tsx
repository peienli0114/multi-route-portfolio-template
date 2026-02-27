import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../admin.css';

/* ------------------------------------------------------------------ */
/*  Type definitions (mirrors WorkDetail in allWorkData.json)          */
/* ------------------------------------------------------------------ */
interface WorkLink {
    name?: string;
    link?: string;
}

interface CoWorker {
    name?: string;
    work?: string;
    link?: string;
}

interface WorkDetail {
    fullName?: string;
    h2Name?: string;
    tableName?: string;
    yearBegin?: string;
    yearEnd?: string;
    intro?: string;
    introList?: string[];
    headPic?: string;
    tags?: string[];
    links?: WorkLink[];
    coWorkers?: CoWorker[];
    content?: string;
    // English fields
    fullNameEn?: string;
    h2NameEn?: string;
    tableNameEn?: string;
    introEn?: string;
    introListEn?: string[];
    tagsEn?: string[];
}

type AllWorkData = Record<string, WorkDetail>;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface WorkDataEditorProps {
    initialContent: string;
    onContentChange: (newContent: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const safeParseJson = (jsonString: string): AllWorkData | null => {
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as AllWorkData;
        }
        return null;
    } catch {
        return null;
    }
};

const safeStringifyJson = (data: any): string => {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return '{}';
    }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const WorkDataEditor: React.FC<WorkDataEditorProps> = ({ initialContent, onContentChange }) => {
    const [data, setData] = useState<AllWorkData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const lastSyncedRef = useRef<string>('');

    /* ---------- sync from parent ---------- */
    useEffect(() => {
        if (initialContent === lastSyncedRef.current) return;
        const parsed = safeParseJson(initialContent);
        if (parsed) {
            setData(parsed);
            setError(null);
            lastSyncedRef.current = initialContent;
        } else if (initialContent.trim() !== '') {
            setData(null);
            setError('無法解析 allWorkData.json：格式不正確');
        }
    }, [initialContent]);

    const pushChange = useCallback(
        (newData: AllWorkData) => {
            setData(newData);
            onContentChange(safeStringifyJson(newData));
        },
        [onContentChange],
    );

    /* ---------- top-level helpers ---------- */
    const toggleExpand = (code: string) => {
        setExpandedKeys(prev =>
            prev.includes(code) ? prev.filter(k => k !== code) : [...prev, code],
        );
    };

    const handleFieldChange = (code: string, field: keyof WorkDetail, value: any) => {
        if (!data) return;
        const newData = { ...data, [code]: { ...data[code], [field]: value } };
        pushChange(newData);
    };

    /* ---------- add / duplicate / delete ---------- */
    const addWork = () => {
        if (!data) return;
        const newCode = window.prompt('請輸入新作品代碼 (例如 mc5, ai3)：');
        if (!newCode) return;
        if (data[newCode]) {
            window.alert('此代碼已存在！');
            return;
        }
        const newDetail: WorkDetail = {
            fullName: '新作品名稱',
            h2Name: '',
            tableName: '新作品',
            yearBegin: new Date().getFullYear().toString(),
            yearEnd: new Date().getFullYear().toString(),
            intro: '',
            introList: [],
            headPic: '',
            tags: [],
            links: [],
            coWorkers: [],
            content: '',
        };
        const newData = { [newCode]: newDetail, ...data };
        pushChange(newData);
        setExpandedKeys(prev => [...prev, newCode]);
    };

    const duplicateWork = (code: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const newCode = window.prompt(`複製 "${code}" — 請輸入新代碼：`);
        if (!newCode) return;
        if (data[newCode]) {
            window.alert('此代碼已存在！');
            return;
        }
        const copy: WorkDetail = JSON.parse(JSON.stringify(data[code]));
        const entries = Object.entries(data);
        const idx = entries.findIndex(([k]) => k === code);
        entries.splice(idx + 1, 0, [newCode, copy]);
        pushChange(Object.fromEntries(entries));
        setExpandedKeys(prev => [...prev, newCode]);
    };

    const deleteWork = (code: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        if (!window.confirm(`確定要刪除作品「${code}」嗎？`)) return;
        const { [code]: _, ...rest } = data;
        pushChange(rest);
        setExpandedKeys(prev => prev.filter(k => k !== code));
    };

    const renameWorkCode = (oldCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const newCode = window.prompt(`修改代碼「${oldCode}」為：`, oldCode);
        if (!newCode || newCode === oldCode) return;
        if (data[newCode]) {
            window.alert('此代碼已存在！');
            return;
        }
        const entries = Object.entries(data).map(([k, v]) =>
            k === oldCode ? [newCode, v] : [k, v],
        );
        pushChange(Object.fromEntries(entries));
        setExpandedKeys(prev => prev.map(k => (k === oldCode ? newCode : k)));
    };

    /* ---------- introList helpers ---------- */
    const addIntroItem = (code: string) => {
        if (!data) return;
        const detail = data[code];
        handleFieldChange(code, 'introList', [...(detail.introList || []), '']);
    };
    const updateIntroItem = (code: string, idx: number, value: string) => {
        if (!data) return;
        const list = [...(data[code].introList || [])];
        list[idx] = value;
        handleFieldChange(code, 'introList', list);
    };
    const removeIntroItem = (code: string, idx: number) => {
        if (!data) return;
        const list = [...(data[code].introList || [])];
        list.splice(idx, 1);
        handleFieldChange(code, 'introList', list);
    };
    const moveIntroItem = (code: string, idx: number, dir: -1 | 1) => {
        if (!data) return;
        const list = [...(data[code].introList || [])];
        const target = idx + dir;
        if (target < 0 || target >= list.length) return;
        [list[idx], list[target]] = [list[target], list[idx]];
        handleFieldChange(code, 'introList', list);
    };

    /* ---------- tags helpers ---------- */
    const handleTagsChange = (code: string, value: string) => {
        const tags = value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        handleFieldChange(code, 'tags', tags);
    };

    /* ---------- tagsEn helpers ---------- */
    const handleTagsEnChange = (code: string, value: string) => {
        const tags = value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        handleFieldChange(code, 'tagsEn', tags);
    };

    /* ---------- introListEn helpers ---------- */
    const addIntroEnItem = (code: string) => {
        if (!data) return;
        const detail = data[code];
        handleFieldChange(code, 'introListEn', [...(detail.introListEn || []), '']);
    };
    const updateIntroEnItem = (code: string, idx: number, value: string) => {
        if (!data) return;
        const list = [...(data[code].introListEn || [])];
        list[idx] = value;
        handleFieldChange(code, 'introListEn', list);
    };
    const removeIntroEnItem = (code: string, idx: number) => {
        if (!data) return;
        const list = [...(data[code].introListEn || [])];
        list.splice(idx, 1);
        handleFieldChange(code, 'introListEn', list);
    };
    const moveIntroEnItem = (code: string, idx: number, dir: -1 | 1) => {
        if (!data) return;
        const list = [...(data[code].introListEn || [])];
        const target = idx + dir;
        if (target < 0 || target >= list.length) return;
        [list[idx], list[target]] = [list[target], list[idx]];
        handleFieldChange(code, 'introListEn', list);
    };

    /* ---------- links helpers ---------- */
    const addLink = (code: string) => {
        if (!data) return;
        handleFieldChange(code, 'links', [...(data[code].links || []), { name: '', link: '' }]);
    };
    const updateLink = (code: string, idx: number, field: keyof WorkLink, value: string) => {
        if (!data) return;
        const links = [...(data[code].links || [])];
        links[idx] = { ...links[idx], [field]: value };
        handleFieldChange(code, 'links', links);
    };
    const removeLink = (code: string, idx: number) => {
        if (!data) return;
        const links = [...(data[code].links || [])];
        links.splice(idx, 1);
        handleFieldChange(code, 'links', links);
    };

    /* ---------- coWorkers helpers ---------- */
    const addCoWorker = (code: string) => {
        if (!data) return;
        handleFieldChange(code, 'coWorkers', [
            ...(data[code].coWorkers || []),
            { name: '', work: '', link: '' },
        ]);
    };
    const updateCoWorker = (code: string, idx: number, field: keyof CoWorker, value: string) => {
        if (!data) return;
        const workers = [...(data[code].coWorkers || [])];
        workers[idx] = { ...workers[idx], [field]: value };
        handleFieldChange(code, 'coWorkers', workers);
    };
    const removeCoWorker = (code: string, idx: number) => {
        if (!data) return;
        const workers = [...(data[code].coWorkers || [])];
        workers.splice(idx, 1);
        handleFieldChange(code, 'coWorkers', workers);
    };

    /* ---------- render guards ---------- */
    if (error) return <div className="error-box">{error}</div>;
    if (!data) return <div>Loading…</div>;

    const allCodes = Object.keys(data);
    const filteredCodes = searchQuery
        ? allCodes.filter(code => {
            const d = data[code];
            const haystack = [
                code,
                d.fullName,
                d.tableName,
                d.h2Name,
                ...(d.tags || []),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(searchQuery.toLowerCase());
        })
        : allCodes;

    /* ------------------------------------------------------------------ */
    /*  JSX                                                                */
    /* ------------------------------------------------------------------ */
    return (
        <div className="editor-container">
            {/* ---- toolbar ---- */}
            <div className="editor-controls" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>作品資料編輯器</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        className="editor-input"
                        placeholder="搜尋作品…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '200px' }}
                    />
                    <span style={{ fontSize: '0.85em', color: '#888' }}>
                        共 {filteredCodes.length} / {allCodes.length} 筆
                    </span>
                    <button className="btn btn-primary" onClick={addWork}>
                        + 新增作品
                    </button>
                </div>
            </div>

            {/* ---- list ---- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredCodes.map(code => {
                    const detail = data[code];
                    const isExpanded = expandedKeys.includes(code);

                    return (
                        <div
                            key={code}
                            className="editor-section"
                            style={{ padding: 0, overflow: 'hidden' }}
                        >
                            {/* ---- collapsed header ---- */}
                            <div
                                onClick={() => toggleExpand(code)}
                                style={{
                                    padding: '10px 15px',
                                    background: '#f8f9fa',
                                    borderBottom: isExpanded ? '1px solid #e1e4e8' : 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center',
                                        flex: 1,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            background: '#e3f2fd',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85em',
                                            fontWeight: 600,
                                            color: '#0d47a1',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {code}
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '1.02em',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {detail.tableName || detail.fullName || '(未命名)'}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            color: '#888',
                                            fontSize: '0.88em',
                                            flexShrink: 0,
                                            marginRight: '12px',
                                        }}
                                    >
                                        {detail.yearBegin}
                                        {detail.yearEnd ? ` – ${detail.yearEnd}` : ''}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '2px 8px', fontSize: '0.8em' }}
                                        onClick={e => renameWorkCode(code, e)}
                                        title="修改代碼"
                                    >
                                        代碼
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '2px 8px', fontSize: '0.8em' }}
                                        onClick={e => duplicateWork(code, e)}
                                    >
                                        複製
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        style={{ padding: '2px 8px', fontSize: '0.8em' }}
                                        onClick={e => deleteWork(code, e)}
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>

                            {/* ---- expanded detail ---- */}
                            {isExpanded && (
                                <div style={{ padding: '1.5rem' }}>
                                    {/* === 中文標題 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">🇹🇼 完整名稱 (fullName)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.fullName || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'fullName', e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* === 英文標題 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>🌐 Title (fullNameEn)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.fullNameEn || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'fullNameEn', e.target.value)
                                            }
                                            placeholder="English title..."
                                            style={{ borderColor: '#bbdefb' }}
                                        />
                                    </div>

                                    {/* === 中文副標題 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">🇹🇼 副標題 (h2Name)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.h2Name || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'h2Name', e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* === 英文副標題 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>🌐 Subtitle (h2NameEn)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.h2NameEn || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'h2NameEn', e.target.value)
                                            }
                                            placeholder="English subtitle..."
                                            style={{ borderColor: '#bbdefb' }}
                                        />
                                    </div>

                                    {/* === 中文列表名稱 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">🇹🇼 列表名稱 (tableName)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.tableName || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'tableName', e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* === 英文列表名稱 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>🌐 List Name (tableNameEn)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.tableNameEn || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'tableNameEn', e.target.value)
                                            }
                                            placeholder="English list name..."
                                            style={{ borderColor: '#bbdefb' }}
                                        />
                                    </div>

                                    {/* === 年份 === */}
                                    <div className="editor-grid-2">
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label className="editor-label">起始年份</label>
                                                <input
                                                    className="editor-input"
                                                    value={detail.yearBegin || ''}
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            code,
                                                            'yearBegin',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="YYYY"
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label className="editor-label">結束年份</label>
                                                <input
                                                    className="editor-input"
                                                    value={detail.yearEnd || ''}
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            code,
                                                            'yearEnd',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="YYYY"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* === 中文簡介 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">🇹🇼 簡介 (intro)</label>
                                        <textarea
                                            className="editor-textarea"
                                            rows={4}
                                            value={detail.intro || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'intro', e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* === 英文簡介 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>🌐 Description (introEn)</label>
                                        <textarea
                                            className="editor-textarea"
                                            rows={4}
                                            value={detail.introEn || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'introEn', e.target.value)
                                            }
                                            placeholder="English description..."
                                            style={{ borderColor: '#bbdefb' }}
                                        />
                                    </div>

                                    {/* === 中文重點列表 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">
                                            🇹🇼 重點列表 (introList)
                                            <button
                                                className="btn btn-secondary"
                                                style={{
                                                    marginLeft: '10px',
                                                    padding: '0 8px',
                                                    height: '24px',
                                                    fontSize: '0.8em',
                                                }}
                                                onClick={() => addIntroItem(code)}
                                            >
                                                + 新增
                                            </button>
                                        </label>
                                        {(detail.introList || []).map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    gap: '6px',
                                                    alignItems: 'center',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '0.8em',
                                                        minWidth: '20px',
                                                    }}
                                                >
                                                    {idx + 1}.
                                                </span>
                                                <input
                                                    className="editor-input"
                                                    value={item}
                                                    onChange={e =>
                                                        updateIntroItem(code, idx, e.target.value)
                                                    }
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => moveIntroItem(code, idx, -1)}
                                                    disabled={idx === 0}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => moveIntroItem(code, idx, 1)}
                                                    disabled={
                                                        idx ===
                                                        (detail.introList || []).length - 1
                                                    }
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => removeIntroItem(code, idx)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* === 英文重點列表 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>
                                            🌐 Key Points (introListEn)
                                            <button
                                                className="btn btn-secondary"
                                                style={{
                                                    marginLeft: '10px',
                                                    padding: '0 8px',
                                                    height: '24px',
                                                    fontSize: '0.8em',
                                                }}
                                                onClick={() => addIntroEnItem(code)}
                                            >
                                                + Add
                                            </button>
                                        </label>
                                        {(detail.introListEn || []).map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    gap: '6px',
                                                    alignItems: 'center',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '0.8em',
                                                        minWidth: '20px',
                                                    }}
                                                >
                                                    {idx + 1}.
                                                </span>
                                                <input
                                                    className="editor-input"
                                                    value={item}
                                                    onChange={e =>
                                                        updateIntroEnItem(code, idx, e.target.value)
                                                    }
                                                    style={{ flex: 1, borderColor: '#bbdefb' }}
                                                />
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => moveIntroEnItem(code, idx, -1)}
                                                    disabled={idx === 0}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => moveIntroEnItem(code, idx, 1)}
                                                    disabled={
                                                        idx ===
                                                        (detail.introListEn || []).length - 1
                                                    }
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                    }}
                                                    onClick={() => removeIntroEnItem(code, idx)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* === 中文標籤 === */}
                                    <div className="editor-row">
                                        <label className="editor-label">🇹🇼 標籤 (tags，逗號分隔)</label>
                                        <input
                                            className="editor-input"
                                            value={(detail.tags || []).join(', ')}
                                            onChange={e => handleTagsChange(code, e.target.value)}
                                            placeholder="介面設計, 網頁程式, …"
                                        />
                                        {(detail.tags || []).length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '4px',
                                                    flexWrap: 'wrap',
                                                    marginTop: '6px',
                                                }}
                                            >
                                                {(detail.tags || []).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            background: '#e3f2fd',
                                                            padding: '2px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85em',
                                                            color: '#0d47a1',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* === 英文標籤 === */}
                                    <div className="editor-row">
                                        <label className="editor-label" style={{ color: '#1565c0' }}>🌐 Tags EN (comma-separated)</label>
                                        <input
                                            className="editor-input"
                                            value={(detail.tagsEn || []).join(', ')}
                                            onChange={e => handleTagsEnChange(code, e.target.value)}
                                            placeholder="UI Design, Web Dev, ..."
                                            style={{ borderColor: '#bbdefb' }}
                                        />
                                        {(detail.tagsEn || []).length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '4px',
                                                    flexWrap: 'wrap',
                                                    marginTop: '6px',
                                                }}
                                            >
                                                {(detail.tagsEn || []).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            background: '#bbdefb',
                                                            padding: '2px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85em',
                                                            color: '#0d47a1',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* === 以下為中英共用欄位 === */}

                                    {/* headPic */}
                                    <div className="editor-row" style={{ marginTop: '1rem' }}>
                                        <label className="editor-label">首圖路徑 (headPic)</label>
                                        <input
                                            className="editor-input"
                                            value={detail.headPic || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'headPic', e.target.value)
                                            }
                                            placeholder="留空則使用預設"
                                        />
                                    </div>

                                    {/* links */}
                                    <div className="editor-row">
                                        <label className="editor-label">
                                            連結 (links)
                                            <button
                                                className="btn btn-secondary"
                                                style={{
                                                    marginLeft: '10px',
                                                    padding: '0 8px',
                                                    height: '24px',
                                                    fontSize: '0.8em',
                                                }}
                                                onClick={() => addLink(code)}
                                            >
                                                + 新增連結
                                            </button>
                                        </label>
                                        {(detail.links || []).map((lnk, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    alignItems: 'center',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <input
                                                    className="editor-input"
                                                    value={lnk.name || ''}
                                                    onChange={e =>
                                                        updateLink(code, idx, 'name', e.target.value)
                                                    }
                                                    placeholder="連結名稱"
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    className="editor-input"
                                                    value={lnk.link || ''}
                                                    onChange={e =>
                                                        updateLink(code, idx, 'link', e.target.value)
                                                    }
                                                    placeholder="URL"
                                                    style={{ flex: 2 }}
                                                />
                                                <button
                                                    className="btn btn-danger"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                        flexShrink: 0,
                                                    }}
                                                    onClick={() => removeLink(code, idx)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* coWorkers */}
                                    <div className="editor-row">
                                        <label className="editor-label">
                                            合作者 (coWorkers)
                                            <button
                                                className="btn btn-secondary"
                                                style={{
                                                    marginLeft: '10px',
                                                    padding: '0 8px',
                                                    height: '24px',
                                                    fontSize: '0.8em',
                                                }}
                                                onClick={() => addCoWorker(code)}
                                            >
                                                + 新增合作者
                                            </button>
                                        </label>
                                        {(detail.coWorkers || []).map((cw, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    alignItems: 'center',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <input
                                                    className="editor-input"
                                                    value={cw.name || ''}
                                                    onChange={e =>
                                                        updateCoWorker(
                                                            code,
                                                            idx,
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="姓名"
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    className="editor-input"
                                                    value={cw.work || ''}
                                                    onChange={e =>
                                                        updateCoWorker(
                                                            code,
                                                            idx,
                                                            'work',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="負責工作"
                                                    style={{ flex: 1 }}
                                                />
                                                <input
                                                    className="editor-input"
                                                    value={cw.link || ''}
                                                    onChange={e =>
                                                        updateCoWorker(
                                                            code,
                                                            idx,
                                                            'link',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="連結 (選填)"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    className="btn btn-danger"
                                                    style={{
                                                        padding: '0 6px',
                                                        height: '28px',
                                                        fontSize: '0.75em',
                                                        flexShrink: 0,
                                                    }}
                                                    onClick={() => removeCoWorker(code, idx)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* content (raw markdown/html) */}
                                    <div className="editor-row">
                                        <label className="editor-label">內容 (content)</label>
                                        <textarea
                                            className="editor-textarea code"
                                            rows={5}
                                            value={detail.content || ''}
                                            onChange={e =>
                                                handleFieldChange(code, 'content', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkDataEditor;
