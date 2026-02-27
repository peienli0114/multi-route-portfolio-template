import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../admin.css';
import portfolioMapData from '../../work_list/portfolioMap.json';

interface ExperienceEntry {
    type: string;
    organisation: string;
    role: string;
    begin: string;
    end: string;
    description: string;
    relatedWorks: string[];
    showDefault: boolean;
    showGroups: string[];
    tags: string[];
}

interface ExperienceData {
    typeOrder: string[];
    entries: ExperienceEntry[];
}

interface ExperienceEditorProps {
    initialContent: string;
    onContentChange: (newContent: string) => void;
}

const safeParseJson = (jsonString: string) => {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
};

const safeStringifyJson = (data: any) => {
    try {
        return JSON.stringify(data, null, 2);
    } catch (e) {
        return '{}';
    }
};

const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ initialContent, onContentChange }) => {
    const [data, setData] = useState<ExperienceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const portfolioMap = portfolioMapData as Record<string, string>;
    const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
    const lastSyncedContentRef = useRef<string>('');

    useEffect(() => {
        // Prevent re-parsing if content hasn't actually changed
        if (initialContent === lastSyncedContentRef.current) return;

        const parsed = safeParseJson(initialContent);
        if (parsed && Array.isArray(parsed.entries) && Array.isArray(parsed.typeOrder)) {
            setData(parsed);
            setError(null);
            lastSyncedContentRef.current = initialContent;
        } else {
            setData(null);
            setError('Invalid Experience Data Structure');
        }
    }, [initialContent]);

    const handleDataChange = useCallback((newData: ExperienceData) => {
        setData(newData);
        onContentChange(safeStringifyJson(newData));
    }, [onContentChange]);

    const handleEntryChange = (index: number, field: keyof ExperienceEntry, value: any) => {
        if (!data) return;
        const newEntries = [...data.entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        handleDataChange({ ...data, entries: newEntries });
    };

    const handleArrayFieldChange = (index: number, field: 'tags', value: string) => {
        const arrayValue = value.split(',').map(s => s.trim()).filter(s => s);
        handleEntryChange(index, field, arrayValue);
    };

    const toggleArrayItem = (index: number, field: 'relatedWorks' | 'showGroups', item: string) => {
        if (!data) return;
        const entry = data.entries[index];
        const currentList = entry[field] || [];
        let newList;
        if (currentList.includes(item)) {
            newList = currentList.filter(i => i !== item);
        } else {
            newList = [...currentList, item];
        }
        handleEntryChange(index, field, newList);
    };

    const addEntry = () => {
        if (!data) return;
        const newEntry: ExperienceEntry = {
            type: "Work Experience",
            organisation: "New Organisation",
            role: "New Role",
            begin: new Date().getFullYear().toString(),
            end: "",
            description: "",
            relatedWorks: [],
            showDefault: true,
            showGroups: ["show_default"],
            tags: []
        };
        const newEntries = [newEntry, ...data.entries];
        handleDataChange({ ...data, entries: newEntries });
        setExpandedIndices([0, ...expandedIndices.map(i => i + 1)]);
    };

    const duplicateEntry = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        const entryToCopy = JSON.parse(JSON.stringify(data.entries[index]));
        // Make sure to add it right after the original or at top? Let's add after.
        const newEntries = [...data.entries];
        newEntries.splice(index + 1, 0, entryToCopy);
        handleDataChange({ ...data, entries: newEntries });
        setExpandedIndices([...expandedIndices, index + 1]);
    };

    const removeEntry = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!data) return;
        if (!window.confirm("Are you sure you want to delete this entry?")) return;
        const newEntries = data.entries.filter((_, i) => i !== index);
        handleDataChange({ ...data, entries: newEntries });
        setExpandedIndices(expandedIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const toggleExpand = (index: number) => {
        if (expandedIndices.includes(index)) {
            setExpandedIndices(expandedIndices.filter(i => i !== index));
        } else {
            setExpandedIndices([...expandedIndices, index]);
        }
    };

    // Auto-sort by Date (Desc) for JSON organization
    const autoSortJson = () => {
        if (!data) return;
        const sortedEntries = [...data.entries].sort((a, b) => {
            const dateA = new Date(a.begin).getTime() || 0;
            const dateB = new Date(b.begin).getTime() || 0;
            return dateB - dateA;
        });
        handleDataChange({ ...data, entries: sortedEntries });
    };

    const collectAllGroups = () => {
        if (!data) return [];
        const groups = new Set<string>();
        groups.add("show_default");
        data.entries.forEach(e => e.showGroups.forEach(g => groups.add(g)));
        return Array.from(groups);
    };

    if (error) return <div className="error-box">{error}</div>;
    if (!data) return <div>Loading...</div>;

    const allGroups = collectAllGroups();
    const portfolioKeys = Object.keys(portfolioMap);

    return (
        <div className="editor-container">
            <div className="editor-controls" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>Experience Editor</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={autoSortJson}>Auto Sort JSON by Date</button>
                    <button className="btn btn-primary" onClick={addEntry}>+ Add Entry</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.entries.map((entry, index) => {
                    const isExpanded = expandedIndices.includes(index);
                    return (
                        <div key={index} className="editor-section" style={{ padding: '0', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleExpand(index)}
                                style={{
                                    padding: '10px 15px',
                                    background: '#f8f9fa',
                                    borderBottom: isExpanded ? '1px solid #e1e4e8' : 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
                                    <strong style={{ minWidth: '120px', color: '#555' }}>{entry.type}</strong>
                                    <span style={{ fontWeight: 600, fontSize: '1.05em' }}>{entry.organisation}</span>
                                    <span style={{ color: '#666' }}>{entry.role}</span>
                                    <span style={{ marginLeft: 'auto', color: '#888', fontSize: '0.9em', marginRight: '15px' }}>
                                        {entry.begin} - {entry.end || 'Present'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8em' }} onClick={(e) => duplicateEntry(index, e)}>Copy</button>
                                    <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.8em' }} onClick={(e) => removeEntry(index, e)}>Delete</button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '1.5rem' }}>
                                    <div className="editor-grid-2">
                                        <div className="editor-col">
                                            <label className="editor-label">Type</label>
                                            <select
                                                className="editor-select"
                                                value={entry.type}
                                                onChange={(e) => handleEntryChange(index, 'type', e.target.value)}
                                            >
                                                {data.typeOrder.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="editor-col">
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label className="editor-label">Begin Date</label>
                                                    <input
                                                        className="editor-input"
                                                        value={entry.begin}
                                                        onChange={(e) => handleEntryChange(index, 'begin', e.target.value)}
                                                        placeholder="YYYY/MM/DD"
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="editor-label">End Date</label>
                                                    <input
                                                        className="editor-input"
                                                        value={entry.end}
                                                        onChange={(e) => handleEntryChange(index, 'end', e.target.value)}
                                                        placeholder="YYYY/MM/DD or Present"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="editor-grid-2">
                                        <div className="editor-col">
                                            <label className="editor-label">Organisation</label>
                                            <input
                                                className="editor-input"
                                                value={entry.organisation}
                                                onChange={(e) => handleEntryChange(index, 'organisation', e.target.value)}
                                            />
                                        </div>
                                        <div className="editor-col">
                                            <label className="editor-label">Role</label>
                                            <input
                                                className="editor-input"
                                                value={entry.role}
                                                onChange={(e) => handleEntryChange(index, 'role', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="editor-row">
                                        <label className="editor-label">Description</label>
                                        <textarea
                                            className="editor-textarea"
                                            rows={3}
                                            value={entry.description}
                                            onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                        />
                                    </div>

                                    <div className="editor-grid-2">
                                        <div className="editor-col">
                                            <label className="editor-label">Tags</label>
                                            <input
                                                className="editor-input"
                                                value={entry.tags.join(', ')}
                                                onChange={(e) => handleArrayFieldChange(index, 'tags', e.target.value)}
                                                placeholder="UX, Research, etc."
                                            />
                                        </div>

                                        <div className="editor-col">
                                            <label className="editor-label">Show Groups (Display Config)</label>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                                                {allGroups.map(group => (
                                                    <label key={group} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eee', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9em', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={entry.showGroups.includes(group)}
                                                            onChange={() => toggleArrayItem(index, 'showGroups', group)}
                                                        />
                                                        {group}
                                                    </label>
                                                ))}
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0 8px', height: '24px', fontSize: '0.8em' }}
                                                    onClick={() => {
                                                        const newGroup = window.prompt("New Group Name (e.g., 'show_design'):");
                                                        if (newGroup) toggleArrayItem(index, 'showGroups', newGroup);
                                                    }}
                                                >
                                                    + New Group
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="editor-row">
                                        <label className="editor-label">Related Works</label>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                                            {portfolioKeys.map(key => (
                                                <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: entry.relatedWorks.includes(key) ? '#e3f2fd' : '#f8f9fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.9em', cursor: 'pointer', border: '1px solid #ddd' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={entry.relatedWorks.includes(key)}
                                                        onChange={() => toggleArrayItem(index, 'relatedWorks', key)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    {entry.relatedWorks.includes(key) && <span style={{ color: 'green' }}>✓</span>}
                                                    <span>{key}</span>
                                                    <span style={{ fontSize: '0.8em', color: '#666' }}>({portfolioMap[key]})</span>
                                                </label>
                                            ))}
                                        </div>
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

export default ExperienceEditor;
