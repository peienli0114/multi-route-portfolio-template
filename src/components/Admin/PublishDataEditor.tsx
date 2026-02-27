import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../admin.css';
import portfolioMapData from '../../work_list/portfolioMap.json';

/* ------------------------------------------------------------------ */
/*  Type definitions                                                    */
/* ------------------------------------------------------------------ */
interface PublishItem {
    title: string;
    type: string;
    description: string;
    link: string | null;
    relatedWorks: string[];
}

interface PublishGroup {
    title: string;
    items: PublishItem[];
}

interface PublishData {
    groups: PublishGroup[];
}

interface PublishDataEditorProps {
    initialContent: string;
    onContentChange: (newContent: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const safeParseJson = (jsonString: string) => {
    try {
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
};

const safeStringifyJson = (data: any) => {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return '{}';
    }
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
const PublishDataEditor: React.FC<PublishDataEditorProps> = ({ initialContent, onContentChange }) => {
    const [data, setData] = useState<PublishData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
    const [expandedItems, setExpandedItems] = useState<string[]>([]); // "groupIdx-itemIdx"
    const portfolioMap = portfolioMapData as Record<string, string>;
    const lastSyncedContentRef = useRef<string>('');

    useEffect(() => {
        if (initialContent === lastSyncedContentRef.current) return;

        const parsed = safeParseJson(initialContent);
        if (parsed && Array.isArray(parsed.groups)) {
            setData(parsed);
            setError(null);
            lastSyncedContentRef.current = initialContent;
        } else {
            setData(null);
            setError('無效的發表紀錄資料格式');
        }
    }, [initialContent]);

    const handleDataChange = useCallback((newData: PublishData) => {
        setData(newData);
        const json = safeStringifyJson(newData);
        lastSyncedContentRef.current = json;
        onContentChange(json);
    }, [onContentChange]);

    /* ---------- Group operations ---------- */

    const addGroup = () => {
        if (!data) return;
        const newGroup: PublishGroup = {
            title: '新分類',
            items: [],
        };
        handleDataChange({ ...data, groups: [...data.groups, newGroup] });
        setExpandedGroups([...expandedGroups, data.groups.length]);
    };

    const removeGroup = (groupIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        if (!window.confirm(`確定要刪除「${data.groups[groupIdx].title}」分類？其中所有項目也會被刪除。`)) return;
        const newGroups = data.groups.filter((_, i) => i !== groupIdx);
        handleDataChange({ ...data, groups: newGroups });
        setExpandedGroups(expandedGroups.filter(i => i !== groupIdx).map(i => i > groupIdx ? i - 1 : i));
    };

    const handleGroupTitleChange = (groupIdx: number, value: string) => {
        if (!data) return;
        const newGroups = [...data.groups];
        newGroups[groupIdx] = { ...newGroups[groupIdx], title: value };
        handleDataChange({ ...data, groups: newGroups });
    };

    const moveGroup = (groupIdx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const targetIdx = direction === 'up' ? groupIdx - 1 : groupIdx + 1;
        if (targetIdx < 0 || targetIdx >= data.groups.length) return;
        const newGroups = [...data.groups];
        [newGroups[groupIdx], newGroups[targetIdx]] = [newGroups[targetIdx], newGroups[groupIdx]];
        handleDataChange({ ...data, groups: newGroups });
        setExpandedGroups(expandedGroups.map(i => {
            if (i === groupIdx) return targetIdx;
            if (i === targetIdx) return groupIdx;
            return i;
        }));
    };

    const toggleGroup = (groupIdx: number) => {
        if (expandedGroups.includes(groupIdx)) {
            setExpandedGroups(expandedGroups.filter(i => i !== groupIdx));
        } else {
            setExpandedGroups([...expandedGroups, groupIdx]);
        }
    };

    /* ---------- Item operations ---------- */

    const addItem = (groupIdx: number) => {
        if (!data) return;
        const newItem: PublishItem = {
            title: '',
            type: '論文',
            description: '',
            link: null,
            relatedWorks: [],
        };
        const newGroups = [...data.groups];
        newGroups[groupIdx] = {
            ...newGroups[groupIdx],
            items: [...newGroups[groupIdx].items, newItem],
        };
        handleDataChange({ ...data, groups: newGroups });
        const itemKey = `${groupIdx}-${newGroups[groupIdx].items.length - 1}`;
        setExpandedItems([...expandedItems, itemKey]);
    };

    const removeItem = (groupIdx: number, itemIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        if (!window.confirm('確定要刪除這筆發表紀錄？')) return;
        const newGroups = [...data.groups];
        newGroups[groupIdx] = {
            ...newGroups[groupIdx],
            items: newGroups[groupIdx].items.filter((_, i) => i !== itemIdx),
        };
        handleDataChange({ ...data, groups: newGroups });
        const removedKey = `${groupIdx}-${itemIdx}`;
        setExpandedItems(expandedItems.filter(k => k !== removedKey));
    };

    const duplicateItem = (groupIdx: number, itemIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const itemToCopy = JSON.parse(JSON.stringify(data.groups[groupIdx].items[itemIdx]));
        const newGroups = [...data.groups];
        const newItems = [...newGroups[groupIdx].items];
        newItems.splice(itemIdx + 1, 0, itemToCopy);
        newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
        handleDataChange({ ...data, groups: newGroups });
        const newKey = `${groupIdx}-${itemIdx + 1}`;
        setExpandedItems([...expandedItems, newKey]);
    };

    const handleItemChange = (groupIdx: number, itemIdx: number, field: keyof PublishItem, value: any) => {
        if (!data) return;
        const newGroups = [...data.groups];
        const newItems = [...newGroups[groupIdx].items];
        newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
        newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
        handleDataChange({ ...data, groups: newGroups });
    };

    const toggleRelatedWork = (groupIdx: number, itemIdx: number, code: string) => {
        if (!data) return;
        const item = data.groups[groupIdx].items[itemIdx];
        const currentList = item.relatedWorks || [];
        const newList = currentList.includes(code)
            ? currentList.filter(c => c !== code)
            : [...currentList, code];
        handleItemChange(groupIdx, itemIdx, 'relatedWorks', newList);
    };

    const toggleItemExpand = (groupIdx: number, itemIdx: number) => {
        const key = `${groupIdx}-${itemIdx}`;
        if (expandedItems.includes(key)) {
            setExpandedItems(expandedItems.filter(k => k !== key));
        } else {
            setExpandedItems([...expandedItems, key]);
        }
    };

    const moveItem = (groupIdx: number, itemIdx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const items = data.groups[groupIdx].items;
        const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
        if (targetIdx < 0 || targetIdx >= items.length) return;
        const newItems = [...items];
        [newItems[itemIdx], newItems[targetIdx]] = [newItems[targetIdx], newItems[itemIdx]];
        const newGroups = [...data.groups];
        newGroups[groupIdx] = { ...newGroups[groupIdx], items: newItems };
        handleDataChange({ ...data, groups: newGroups });
    };

    /* ---------- Render ---------- */

    if (error) return <div className="error-box">{error}</div>;
    if (!data) return <div>Loading...</div>;

    const portfolioKeys = Object.keys(portfolioMap);
    const typeOptions = ['論文', '獎項', '競賽', '展覽', '專利', '其他'];

    return (
        <div className="editor-container">
            <div className="editor-controls" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>📰 發表紀錄編輯器</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#888', fontSize: '0.9em', alignSelf: 'center' }}>
                        共 {data.groups.length} 個分類，
                        {data.groups.reduce((sum, g) => sum + g.items.length, 0)} 筆紀錄
                    </span>
                    <button className="btn btn-primary" onClick={addGroup}>+ 新增分類</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.groups.map((group, groupIdx) => {
                    const isGroupExpanded = expandedGroups.includes(groupIdx);
                    return (
                        <div key={groupIdx} className="editor-section" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Group header */}
                            <div
                                onClick={() => toggleGroup(groupIdx)}
                                style={{
                                    padding: '10px 15px',
                                    background: '#eef6f7',
                                    borderBottom: isGroupExpanded ? '1px solid #d0e8e9' : 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '0.85em', color: '#888' }}>{isGroupExpanded ? '▾' : '▸'}</span>
                                    <strong style={{ color: 'var(--color-text-title, #0f8a61)', fontSize: '1.05em' }}>
                                        {group.title || '(未命名)'}
                                    </strong>
                                    <span style={{ color: '#888', fontSize: '0.85em' }}>
                                        ({group.items.length} 筆)
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {groupIdx > 0 && (
                                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8em' }} onClick={(e) => moveGroup(groupIdx, 'up', e)}>↑</button>
                                    )}
                                    {groupIdx < data.groups.length - 1 && (
                                        <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8em' }} onClick={(e) => moveGroup(groupIdx, 'down', e)}>↓</button>
                                    )}
                                    <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.8em' }} onClick={(e) => removeGroup(groupIdx, e)}>刪除</button>
                                </div>
                            </div>

                            {/* Group content */}
                            {isGroupExpanded && (
                                <div style={{ padding: '1rem' }}>
                                    {/* Group title edit */}
                                    <div className="editor-row" style={{ marginBottom: '1rem' }}>
                                        <label className="editor-label">分類標題</label>
                                        <input
                                            className="editor-input"
                                            value={group.title}
                                            onChange={e => handleGroupTitleChange(groupIdx, e.target.value)}
                                            placeholder="分類名稱..."
                                        />
                                    </div>

                                    {/* Items */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {group.items.map((item, itemIdx) => {
                                            const itemKey = `${groupIdx}-${itemIdx}`;
                                            const isItemExpanded = expandedItems.includes(itemKey);
                                            return (
                                                <div key={itemIdx} style={{ border: '1px solid #e1e4e8', borderRadius: '6px', overflow: 'hidden' }}>
                                                    {/* Item header */}
                                                    <div
                                                        onClick={() => toggleItemExpand(groupIdx, itemIdx)}
                                                        style={{
                                                            padding: '8px 12px',
                                                            background: isItemExpanded ? '#f8f9fa' : '#fff',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            borderBottom: isItemExpanded ? '1px solid #e1e4e8' : 'none',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                            <span style={{ fontSize: '0.75em', color: '#888' }}>{isItemExpanded ? '▾' : '▸'}</span>
                                                            <span style={{
                                                                padding: '1px 8px',
                                                                borderRadius: '10px',
                                                                fontSize: '0.78em',
                                                                fontWeight: 500,
                                                                background: item.type === '論文' ? '#e3f2fd' :
                                                                    item.type === '獎項' ? '#fff3e0' :
                                                                        item.type === '競賽' ? '#fce4ec' :
                                                                            item.type === '展覽' ? '#e8f5e9' : '#f5f5f5',
                                                                color: item.type === '論文' ? '#1565c0' :
                                                                    item.type === '獎項' ? '#e65100' :
                                                                        item.type === '競賽' ? '#c62828' :
                                                                            item.type === '展覽' ? '#2e7d32' : '#616161',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {item.type || '未分類'}
                                                            </span>
                                                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {item.title || item.description?.slice(0, 50) || '(未填寫)'}
                                                            </span>
                                                            {item.relatedWorks.length > 0 && (
                                                                <span style={{ color: '#888', fontSize: '0.8em', whiteSpace: 'nowrap' }}>
                                                                    🔗 {item.relatedWorks.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                            {itemIdx > 0 && (
                                                                <button className="btn btn-secondary" style={{ padding: '1px 6px', fontSize: '0.75em' }} onClick={(e) => moveItem(groupIdx, itemIdx, 'up', e)}>↑</button>
                                                            )}
                                                            {itemIdx < group.items.length - 1 && (
                                                                <button className="btn btn-secondary" style={{ padding: '1px 6px', fontSize: '0.75em' }} onClick={(e) => moveItem(groupIdx, itemIdx, 'down', e)}>↓</button>
                                                            )}
                                                            <button className="btn btn-secondary" style={{ padding: '1px 6px', fontSize: '0.75em' }} onClick={(e) => duplicateItem(groupIdx, itemIdx, e)}>複製</button>
                                                            <button className="btn btn-danger" style={{ padding: '1px 6px', fontSize: '0.75em' }} onClick={(e) => removeItem(groupIdx, itemIdx, e)}>✕</button>
                                                        </div>
                                                    </div>

                                                    {/* Item detail */}
                                                    {isItemExpanded && (
                                                        <div style={{ padding: '1rem' }}>
                                                            <div className="editor-grid-2">
                                                                <div className="editor-col">
                                                                    <label className="editor-label">標題</label>
                                                                    <input
                                                                        className="editor-input"
                                                                        value={item.title}
                                                                        onChange={e => handleItemChange(groupIdx, itemIdx, 'title', e.target.value)}
                                                                        placeholder="發表標題..."
                                                                    />
                                                                </div>
                                                                <div className="editor-col">
                                                                    <label className="editor-label">類型</label>
                                                                    <select
                                                                        className="editor-select"
                                                                        value={item.type}
                                                                        onChange={e => handleItemChange(groupIdx, itemIdx, 'type', e.target.value)}
                                                                    >
                                                                        {typeOptions.map(t => (
                                                                            <option key={t} value={t}>{t}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="editor-row" style={{ marginTop: '0.75rem' }}>
                                                                <label className="editor-label">描述</label>
                                                                <textarea
                                                                    className="editor-textarea"
                                                                    rows={3}
                                                                    value={item.description}
                                                                    onChange={e => handleItemChange(groupIdx, itemIdx, 'description', e.target.value)}
                                                                    placeholder="完整描述，包含作者、會議/期刊名稱等..."
                                                                />
                                                            </div>

                                                            <div className="editor-row" style={{ marginTop: '0.75rem' }}>
                                                                <label className="editor-label">連結</label>
                                                                <input
                                                                    className="editor-input"
                                                                    value={item.link || ''}
                                                                    onChange={e => handleItemChange(groupIdx, itemIdx, 'link', e.target.value || null)}
                                                                    placeholder="https://..."
                                                                />
                                                            </div>

                                                            <div className="editor-row" style={{ marginTop: '0.75rem' }}>
                                                                <label className="editor-label">關聯作品</label>
                                                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
                                                                    {portfolioKeys.map(key => {
                                                                        const isSelected = item.relatedWorks.includes(key);
                                                                        return (
                                                                            <label
                                                                                key={key}
                                                                                style={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px',
                                                                                    background: isSelected ? '#e3f2fd' : '#f8f9fa',
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '0.85em',
                                                                                    cursor: 'pointer',
                                                                                    border: `1px solid ${isSelected ? '#90caf9' : '#ddd'}`,
                                                                                }}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSelected}
                                                                                    onChange={() => toggleRelatedWork(groupIdx, itemIdx, key)}
                                                                                    style={{ display: 'none' }}
                                                                                />
                                                                                {isSelected && <span style={{ color: 'green' }}>✓</span>}
                                                                                <span>{key}</span>
                                                                                <span style={{ fontSize: '0.8em', color: '#666' }}>({portfolioMap[key]})</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add item button */}
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => addItem(groupIdx)}
                                            style={{ width: '100%', padding: '6px', fontSize: '0.9em' }}
                                        >
                                            + 新增發表紀錄
                                        </button>
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

export default PublishDataEditor;
