import React, { useState, useCallback, useEffect, useRef } from 'react';
import defaultSkillsData from '../../work_list/skillsData.json';

type SkillTool = {
    name: string;
    description?: string;
    image?: string;
};

type SkillCategory = {
    name: string;
    tools: SkillTool[];
};

type SkillGroup = {
    title: string;
    categories: SkillCategory[];
};

interface SkillsEditorProps {
    /** Current skills override for the profile, or undefined/null for "use global default" */
    skills: SkillGroup[] | undefined | null;
    /** Callback when skills data changes */
    onChange: (skills: SkillGroup[] | undefined) => void;
}

// Load global default skills
const loadGlobalSkills = (): SkillGroup[] => {
    const data = defaultSkillsData as { groups?: SkillGroup[] };
    return Array.isArray(data.groups) ? data.groups : [];
};

const GLOBAL_SKILLS = loadGlobalSkills();

const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
    const isCustom = Array.isArray(skills);
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    const [editingName, setEditingName] = useState<{
        type: 'group' | 'category' | 'tool';
        groupIdx: number;
        catIdx?: number;
        toolIdx?: number;
    } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const workingSkills: SkillGroup[] = isCustom ? skills : GLOBAL_SKILLS;

    useEffect(() => {
        if (editingName && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingName]);

    // Toggle between global default and custom mode
    const handleToggleCustom = useCallback(() => {
        if (isCustom) {
            // Switch back to global: clear the override
            if (window.confirm('切換回全域技能資料？目前自訂的修改將會被移除。')) {
                onChange(undefined);
            }
        } else {
            // Switch to custom: copy global data as starting point
            onChange(JSON.parse(JSON.stringify(GLOBAL_SKILLS)));
        }
    }, [isCustom, onChange]);

    const toggleGroup = useCallback((groupIdx: number) => {
        setExpandedGroups((prev) => ({ ...prev, [groupIdx]: !prev[groupIdx] }));
    }, []);

    // --- Group operations ---
    const addGroup = useCallback(() => {
        const newGroups = [...workingSkills, { title: '新技能群組', categories: [] }];
        onChange(newGroups);
        setExpandedGroups((prev) => ({ ...prev, [newGroups.length - 1]: true }));
    }, [workingSkills, onChange]);

    const deleteGroup = useCallback(
        (groupIdx: number) => {
            const group = workingSkills[groupIdx];
            if (!window.confirm(`確定刪除「${group.title}」群組？`)) return;
            const newGroups = workingSkills.filter((_, i) => i !== groupIdx);
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const moveGroup = useCallback(
        (groupIdx: number, direction: -1 | 1) => {
            const newIdx = groupIdx + direction;
            if (newIdx < 0 || newIdx >= workingSkills.length) return;
            const newGroups = [...workingSkills];
            [newGroups[groupIdx], newGroups[newIdx]] = [newGroups[newIdx], newGroups[groupIdx]];
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const renameGroup = useCallback(
        (groupIdx: number, newTitle: string) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].title = newTitle;
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    // --- Category operations ---
    const addCategory = useCallback(
        (groupIdx: number) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].categories.push({ name: '新類別', tools: [] });
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const deleteCategory = useCallback(
        (groupIdx: number, catIdx: number) => {
            const cat = workingSkills[groupIdx].categories[catIdx];
            if (!window.confirm(`確定刪除「${cat.name}」類別？`)) return;
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].categories.splice(catIdx, 1);
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const renameCategory = useCallback(
        (groupIdx: number, catIdx: number, newName: string) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].categories[catIdx].name = newName;
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const moveCategory = useCallback(
        (groupIdx: number, catIdx: number, direction: -1 | 1) => {
            const newIdx = catIdx + direction;
            const cats = workingSkills[groupIdx].categories;
            if (newIdx < 0 || newIdx >= cats.length) return;
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            const arr = newGroups[groupIdx].categories;
            [arr[catIdx], arr[newIdx]] = [arr[newIdx], arr[catIdx]];
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    // --- Tool operations ---
    const addTool = useCallback(
        (groupIdx: number, catIdx: number) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].categories[catIdx].tools.push({ name: '新工具' });
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const deleteTool = useCallback(
        (groupIdx: number, catIdx: number, toolIdx: number) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            newGroups[groupIdx].categories[catIdx].tools.splice(toolIdx, 1);
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const updateTool = useCallback(
        (groupIdx: number, catIdx: number, toolIdx: number, field: keyof SkillTool, value: string) => {
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            const tool = newGroups[groupIdx].categories[catIdx].tools[toolIdx];
            if (field === 'name') {
                tool.name = value;
            } else if (field === 'description') {
                if (value.trim()) {
                    tool.description = value;
                } else {
                    delete tool.description;
                }
            } else if (field === 'image') {
                if (value.trim()) {
                    tool.image = value;
                } else {
                    delete tool.image;
                }
            }
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const moveTool = useCallback(
        (groupIdx: number, catIdx: number, toolIdx: number, direction: -1 | 1) => {
            const tools = workingSkills[groupIdx].categories[catIdx].tools;
            const newIdx = toolIdx + direction;
            if (newIdx < 0 || newIdx >= tools.length) return;
            const newGroups = JSON.parse(JSON.stringify(workingSkills)) as SkillGroup[];
            const arr = newGroups[groupIdx].categories[catIdx].tools;
            [arr[toolIdx], arr[newIdx]] = [arr[newIdx], arr[toolIdx]];
            onChange(newGroups);
        },
        [workingSkills, onChange],
    );

    const handleFinishEditing = useCallback(() => {
        setEditingName(null);
    }, []);

    return (
        <div>
            {/* Toggle banner */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isCustom ? '#fff3e0' : '#e8f5e9',
                    border: `1px solid ${isCustom ? '#ffe0b2' : '#c8e6c9'}`,
                    borderRadius: '6px',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    <strong style={{ fontSize: '0.95rem' }}>
                        {isCustom ? '🔧 自訂技能（此路徑專用）' : '🌐 使用全域技能資料'}
                    </strong>
                    <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '2px' }}>
                        {isCustom
                            ? '目前使用自訂技能資料，僅用於此路徑的 CV。'
                            : '目前使用 skillsData.json 的全域技能資料。點擊「自訂」可為此路徑設定獨立的技能內容。'}
                    </div>
                </div>
                <button
                    className={`btn ${isCustom ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleToggleCustom}
                    style={{ whiteSpace: 'nowrap', padding: '6px 14px', fontSize: '0.88rem' }}
                >
                    {isCustom ? '↩ 還原全域' : '✏️ 自訂技能'}
                </button>
            </div>

            {/* Skills tree */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workingSkills.map((group, gIdx) => {
                    const isExpanded = expandedGroups[gIdx] ?? false;
                    return (
                        <div
                            key={gIdx}
                            style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#fafafa',
                            }}
                        >
                            {/* Group header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 14px',
                                    background: '#f5f5f5',
                                    borderBottom: isExpanded ? '1px solid #e0e0e0' : 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => toggleGroup(gIdx)}
                            >
                                <span style={{ fontSize: '0.85rem', width: '16px', textAlign: 'center' }}>
                                    {isExpanded ? '▾' : '▸'}
                                </span>
                                {editingName?.type === 'group' && editingName.groupIdx === gIdx ? (
                                    <input
                                        ref={editInputRef}
                                        className="editor-input"
                                        style={{ flex: 1, padding: '2px 6px', fontSize: '0.95rem', fontWeight: 600 }}
                                        defaultValue={group.title}
                                        onClick={(e) => e.stopPropagation()}
                                        onBlur={(e) => {
                                            if (isCustom) renameGroup(gIdx, e.target.value);
                                            handleFinishEditing();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (isCustom) renameGroup(gIdx, (e.target as HTMLInputElement).value);
                                                handleFinishEditing();
                                            }
                                            if (e.key === 'Escape') handleFinishEditing();
                                        }}
                                    />
                                ) : (
                                    <strong
                                        style={{ flex: 1, fontSize: '0.95rem' }}
                                        onDoubleClick={(e) => {
                                            if (!isCustom) return;
                                            e.stopPropagation();
                                            setEditingName({ type: 'group', groupIdx: gIdx });
                                        }}
                                    >
                                        {group.title}
                                    </strong>
                                )}
                                <span style={{ fontSize: '0.78rem', color: '#888' }}>
                                    {group.categories.length} 類別,{' '}
                                    {group.categories.reduce((s, c) => s + c.tools.length, 0)} 工具
                                </span>
                                {isCustom && (
                                    <div
                                        style={{ display: 'flex', gap: '4px' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                            onClick={() => moveGroup(gIdx, -1)}
                                            disabled={gIdx === 0}
                                            title="上移"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                            onClick={() => moveGroup(gIdx, 1)}
                                            disabled={gIdx === workingSkills.length - 1}
                                            title="下移"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                            onClick={() => setEditingName({ type: 'group', groupIdx: gIdx })}
                                            title="重新命名"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                            onClick={() => deleteGroup(gIdx)}
                                            title="刪除群組"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Group body */}
                            {isExpanded && (
                                <div style={{ padding: '10px 14px' }}>
                                    {group.categories.map((cat, cIdx) => (
                                        <div
                                            key={cIdx}
                                            style={{
                                                marginBottom: '12px',
                                                padding: '8px 12px',
                                                background: '#fff',
                                                borderRadius: '4px',
                                                border: '1px solid #eee',
                                            }}
                                        >
                                            {/* Category header */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                {editingName?.type === 'category' &&
                                                    editingName.groupIdx === gIdx &&
                                                    editingName.catIdx === cIdx ? (
                                                    <input
                                                        ref={editInputRef}
                                                        className="editor-input"
                                                        style={{ flex: 1, padding: '2px 6px', fontSize: '0.9rem', fontWeight: 500 }}
                                                        defaultValue={cat.name}
                                                        onBlur={(e) => {
                                                            if (isCustom) renameCategory(gIdx, cIdx, e.target.value);
                                                            handleFinishEditing();
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (isCustom)
                                                                    renameCategory(gIdx, cIdx, (e.target as HTMLInputElement).value);
                                                                handleFinishEditing();
                                                            }
                                                            if (e.key === 'Escape') handleFinishEditing();
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{ flex: 1, fontWeight: 500, fontSize: '0.9rem', color: '#555' }}
                                                        onDoubleClick={() => {
                                                            if (!isCustom) return;
                                                            setEditingName({ type: 'category', groupIdx: gIdx, catIdx: cIdx });
                                                        }}
                                                    >
                                                        📂 {cat.name}
                                                    </span>
                                                )}
                                                {isCustom && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '2px 5px', fontSize: '0.72rem' }}
                                                            onClick={() => moveCategory(gIdx, cIdx, -1)}
                                                            disabled={cIdx === 0}
                                                            title="上移"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '2px 5px', fontSize: '0.72rem' }}
                                                            onClick={() => moveCategory(gIdx, cIdx, 1)}
                                                            disabled={cIdx === group.categories.length - 1}
                                                            title="下移"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '2px 5px', fontSize: '0.72rem' }}
                                                            onClick={() =>
                                                                setEditingName({ type: 'category', groupIdx: gIdx, catIdx: cIdx })
                                                            }
                                                            title="重新命名"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '2px 5px', fontSize: '0.72rem' }}
                                                            onClick={() => deleteCategory(gIdx, cIdx)}
                                                            title="刪除類別"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tools list */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {cat.tools.map((tool, tIdx) => (
                                                    <div
                                                        key={tIdx}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '4px 8px',
                                                            background: '#f9f9f9',
                                                            borderRadius: '3px',
                                                            border: '1px solid #f0f0f0',
                                                        }}
                                                    >
                                                        {isCustom ? (
                                                            <>
                                                                <input
                                                                    className="editor-input"
                                                                    style={{ flex: 2, padding: '2px 6px', fontSize: '0.85rem' }}
                                                                    value={tool.name}
                                                                    onChange={(e) =>
                                                                        updateTool(gIdx, cIdx, tIdx, 'name', e.target.value)
                                                                    }
                                                                    placeholder="工具名稱"
                                                                />
                                                                <input
                                                                    className="editor-input"
                                                                    style={{ flex: 1, padding: '2px 6px', fontSize: '0.82rem' }}
                                                                    value={tool.image || ''}
                                                                    onChange={(e) =>
                                                                        updateTool(gIdx, cIdx, tIdx, 'image', e.target.value)
                                                                    }
                                                                    placeholder="證書圖片"
                                                                />
                                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '1px 4px', fontSize: '0.7rem' }}
                                                                        onClick={() => moveTool(gIdx, cIdx, tIdx, -1)}
                                                                        disabled={tIdx === 0}
                                                                        title="上移"
                                                                    >
                                                                        ↑
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '1px 4px', fontSize: '0.7rem' }}
                                                                        onClick={() => moveTool(gIdx, cIdx, tIdx, 1)}
                                                                        disabled={tIdx === cat.tools.length - 1}
                                                                        title="下移"
                                                                    >
                                                                        ↓
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-danger"
                                                                        style={{ padding: '1px 4px', fontSize: '0.7rem' }}
                                                                        onClick={() => deleteTool(gIdx, cIdx, tIdx)}
                                                                        title="刪除"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span style={{ flex: 1, fontSize: '0.85rem' }}>{tool.name}</span>
                                                                {tool.image && (
                                                                    <span
                                                                        style={{
                                                                            fontSize: '0.75rem',
                                                                            color: '#888',
                                                                            background: '#eee',
                                                                            padding: '1px 6px',
                                                                            borderRadius: '3px',
                                                                        }}
                                                                    >
                                                                        📎 {tool.image}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                                {isCustom && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{
                                                            padding: '3px 8px',
                                                            fontSize: '0.78rem',
                                                            alignSelf: 'flex-start',
                                                            marginTop: '2px',
                                                        }}
                                                        onClick={() => addTool(gIdx, cIdx)}
                                                    >
                                                        + 新增工具
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isCustom && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 10px', fontSize: '0.82rem', marginTop: '4px' }}
                                            onClick={() => addCategory(gIdx)}
                                        >
                                            + 新增類別
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {isCustom && (
                    <button
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.9rem', alignSelf: 'flex-start' }}
                        onClick={addGroup}
                    >
                        + 新增技能群組
                    </button>
                )}
            </div>
        </div>
    );
};

export default SkillsEditor;
