import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BlobConfig } from '../../types/portfolio';

type BlobsEditorProps = {
    blobs: BlobConfig[];
    onChange: (blobs: BlobConfig[]) => void;
};

const DEFAULT_LARGE_COLORS = ['#fd9225', '#44acaf', '#ff6b6b', '#8b5cf6', '#ec4899', '#06b6d4'];

const generateId = () => `blob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const createDefaultBlob = (size: 'large' | 'small'): BlobConfig => ({
    id: generateId(),
    label: size === 'large' ? 'New\nCategory' : 'New\nSkill',
    size,
    x: '30%',
    y: '30%',
    width: size === 'large' ? '40%' : '12%',
    color: size === 'large' ? DEFAULT_LARGE_COLORS[Math.floor(Math.random() * DEFAULT_LARGE_COLORS.length)] : undefined,
    animDuration: 6 + Math.random() * 3,
    animDelay: Math.random() * 2,
});

/** Preview component that renders blobs as they would appear on the homepage */
const BlobPreview: React.FC<{
    blobs: BlobConfig[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDragEnd: (id: string, x: string, y: string) => void;
}> = ({ blobs, selectedId, onSelect, onDragEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
    /** Offset (in %) from mouse down point to the blob's top-left corner */
    const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent, blobId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!containerRef.current) return;
        onSelect(blobId);

        const rect = containerRef.current.getBoundingClientRect();
        const mousePctX = ((e.clientX - rect.left) / rect.width) * 100;
        const mousePctY = ((e.clientY - rect.top) / rect.height) * 100;

        // Find the blob to get its current left/top
        const blob = blobs.find((b) => b.id === blobId);
        const blobLeft = parseFloat(blob?.x || '0');
        const blobTop = parseFloat(blob?.y || '0');

        // Store offset = mouse position - blob top-left
        dragOffsetRef.current = { dx: mousePctX - blobLeft, dy: mousePctY - blobTop };

        setDragging(blobId);
        setDragPos({ x: blobLeft, y: blobTop });
    }, [onSelect, blobs]);

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !dragging) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mousePctX = ((e.clientX - rect.left) / rect.width) * 100;
            const mousePctY = ((e.clientY - rect.top) / rect.height) * 100;
            const newLeft = mousePctX - dragOffsetRef.current.dx;
            const newTop = mousePctY - dragOffsetRef.current.dy;
            setDragPos({
                x: Math.max(-10, Math.min(95, newLeft)),
                y: Math.max(-10, Math.min(95, newTop)),
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!containerRef.current || !dragging) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mousePctX = ((e.clientX - rect.left) / rect.width) * 100;
            const mousePctY = ((e.clientY - rect.top) / rect.height) * 100;
            const newLeft = mousePctX - dragOffsetRef.current.dx;
            const newTop = mousePctY - dragOffsetRef.current.dy;
            const clampedX = Math.max(0, Math.min(90, newLeft));
            const clampedY = Math.max(0, Math.min(90, newTop));
            onDragEnd(dragging, `${Math.round(clampedX)}%`, `${Math.round(clampedY)}%`);
            setDragging(null);
            setDragPos(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, onDragEnd]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                maxWidth: '500px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '2px dashed #ddd',
                overflow: 'hidden',
                cursor: dragging ? 'grabbing' : 'default',
                userSelect: 'none',
            }}
        >
            {blobs.map((blob) => {
                const isLarge = blob.size === 'large';
                const isDragging = dragging === blob.id;
                const isSelected = selectedId === blob.id;
                const left = isDragging && dragPos ? `${dragPos.x}%` : blob.x;
                const top = isDragging && dragPos ? `${dragPos.y}%` : blob.y;
                const width = blob.width || (isLarge ? '40%' : '12%');

                return (
                    <div
                        key={blob.id}
                        onMouseDown={(e) => handleMouseDown(e, blob.id)}
                        style={{
                            position: 'absolute',
                            left,
                            top,
                            width,
                            aspectRatio: '1',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            cursor: 'grab',
                            transition: isDragging ? 'none' : 'all 0.2s ease',
                            transform: isDragging ? 'scale(1.05)' : undefined,
                            zIndex: isDragging ? 100 : isLarge ? 2 : 10,
                            outline: isSelected ? '3px solid #2563eb' : 'none',
                            outlineOffset: '3px',
                            ...(isLarge
                                ? {
                                    background: `radial-gradient(circle, ${blob.color || '#fd9225'}88 40%, ${blob.color || '#fd9225'}22 100%)`,
                                    opacity: 0.9,
                                }
                                : {
                                    background: 'rgba(255,255,255,0.5)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    backdropFilter: 'blur(2px)',
                                }),
                        }}
                    >
                        <span
                            style={{
                                fontSize: isLarge ? '0.7rem' : '0.55rem',
                                lineHeight: 1.2,
                                color: isLarge ? '#fff' : '#333',
                                fontWeight: 400,
                                whiteSpace: 'pre-line',
                                pointerEvents: 'none',
                            }}
                        >
                            {blob.label.replace(/\\n/g, '\n')}
                        </span>
                    </div>
                );
            })}
            <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                fontSize: '0.65rem',
                color: '#999',
                pointerEvents: 'none',
            }}>
                拖拽可調整位置
            </div>
        </div>
    );
};

const BlobsEditor: React.FC<BlobsEditorProps> = ({ blobs, onChange }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedBlob = blobs.find((b) => b.id === selectedId) || null;

    const updateBlob = useCallback(
        (id: string, updates: Partial<BlobConfig>) => {
            onChange(blobs.map((b) => (b.id === id ? { ...b, ...updates } : b)));
        },
        [blobs, onChange],
    );

    const handleDragEnd = useCallback(
        (id: string, x: string, y: string) => {
            updateBlob(id, { x, y });
        },
        [updateBlob],
    );

    const addBlob = useCallback(
        (size: 'large' | 'small') => {
            const newBlob = createDefaultBlob(size);
            onChange([...blobs, newBlob]);
            setSelectedId(newBlob.id);
        },
        [blobs, onChange],
    );

    const removeBlob = useCallback(
        (id: string) => {
            onChange(blobs.filter((b) => b.id !== id));
            if (selectedId === id) setSelectedId(null);
        },
        [blobs, onChange, selectedId],
    );

    const moveBlob = useCallback(
        (id: string, direction: -1 | 1) => {
            const index = blobs.findIndex((b) => b.id === id);
            if (index < 0) return;
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= blobs.length) return;
            const updated = [...blobs];
            [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
            onChange(updated);
        },
        [blobs, onChange],
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    🫧 首頁氣泡編輯器
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    共 {blobs.length} 個氣泡（{blobs.filter((b) => b.size === 'large').length} 大 / {blobs.filter((b) => b.size === 'small').length} 小）
                </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Preview */}
                <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
                    <BlobPreview
                        blobs={blobs}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDragEnd={handleDragEnd}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => addBlob('large')}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            + 大氣泡
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => addBlob('small')}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            + 小氣泡
                        </button>
                    </div>
                </div>

                {/* Detail Editor */}
                <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
                    {selectedBlob ? (
                        <div
                            style={{
                                background: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '10px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                                    {selectedBlob.size === 'large' ? '🔵 大氣泡' : '⚪ 小氣泡'} 設定
                                </h5>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => moveBlob(selectedBlob.id, -1)}
                                        style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                        title="上移"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveBlob(selectedBlob.id, 1)}
                                        style={{ padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                        title="下移"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeBlob(selectedBlob.id)}
                                        style={{
                                            padding: '2px 8px',
                                            fontSize: '0.75rem',
                                            color: '#dc2626',
                                            cursor: 'pointer',
                                            border: '1px solid #fca5a5',
                                            borderRadius: '4px',
                                            background: '#fef2f2',
                                        }}
                                    >
                                        🗑 刪除
                                    </button>
                                </div>
                            </div>

                            {/* Label */}
                            <div>
                                <label style={labelStyle}>文字內容</label>
                                <textarea
                                    value={selectedBlob.label}
                                    onChange={(e) => updateBlob(selectedBlob.id, { label: e.target.value })}
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                                    placeholder="用換行分隔多行&#10;例如：User&#10;Experience&#10;Research"
                                />
                                <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
                                    每行由一個換行符分隔（對應畫面上的 &lt;br/&gt;）
                                </div>
                            </div>

                            {/* Position */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>X 位置</label>
                                    <input
                                        value={selectedBlob.x}
                                        onChange={(e) => updateBlob(selectedBlob.id, { x: e.target.value })}
                                        style={inputStyle}
                                        placeholder="例如 25%"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Y 位置</label>
                                    <input
                                        value={selectedBlob.y}
                                        onChange={(e) => updateBlob(selectedBlob.id, { y: e.target.value })}
                                        style={inputStyle}
                                        placeholder="例如 10%"
                                    />
                                </div>
                            </div>

                            {/* Size */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>寬度</label>
                                    <input
                                        value={selectedBlob.width || ''}
                                        onChange={(e) => updateBlob(selectedBlob.id, { width: e.target.value || undefined })}
                                        style={inputStyle}
                                        placeholder={selectedBlob.size === 'large' ? '預設 40%' : '預設 12%'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>類型</label>
                                    <select
                                        value={selectedBlob.size}
                                        onChange={(e) =>
                                            updateBlob(selectedBlob.id, {
                                                size: e.target.value as 'large' | 'small',
                                                width: e.target.value === 'large' ? '40%' : '12%',
                                                color: e.target.value === 'large' ? '#fd9225' : undefined,
                                            })
                                        }
                                        style={inputStyle}
                                    >
                                        <option value="large">大 (Large)</option>
                                        <option value="small">小 (Small)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Color (large only) */}
                            {selectedBlob.size === 'large' && (
                                <div>
                                    <label style={labelStyle}>漸層顏色</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="color"
                                            value={selectedBlob.color || '#fd9225'}
                                            onChange={(e) => updateBlob(selectedBlob.id, { color: e.target.value })}
                                            style={{ width: '36px', height: '36px', padding: 0, cursor: 'pointer', border: '1px solid #ccc', borderRadius: '6px' }}
                                        />
                                        <input
                                            value={selectedBlob.color || '#fd9225'}
                                            onChange={(e) => updateBlob(selectedBlob.id, { color: e.target.value })}
                                            style={{ ...inputStyle, flex: 1 }}
                                            placeholder="#fd9225"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Animation */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>動畫時長 (秒)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        max="20"
                                        value={selectedBlob.animDuration ?? 6}
                                        onChange={(e) => updateBlob(selectedBlob.id, { animDuration: parseFloat(e.target.value) || 6 })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>動畫延遲 (秒)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={selectedBlob.animDelay ?? 0}
                                        onChange={(e) => updateBlob(selectedBlob.id, { animDelay: parseFloat(e.target.value) || 0 })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* ID (read-only) */}
                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                                ID: {selectedBlob.id}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                background: '#f8f9fa',
                                border: '1px dashed #ccc',
                                borderRadius: '10px',
                                padding: '2rem',
                                textAlign: 'center',
                                color: '#999',
                            }}
                        >
                            👈 點擊預覽區的氣泡來編輯
                        </div>
                    )}

                    {/* Blob List */}
                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>氣泡列表</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {blobs.map((blob) => (
                                <div
                                    key={blob.id}
                                    onClick={() => setSelectedId(blob.id)}
                                    style={{
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.8rem',
                                        background: selectedId === blob.id ? '#e0edff' : '#fff',
                                        border: selectedId === blob.id ? '1px solid #93c5fd' : '1px solid #eee',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {blob.size === 'large' && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: blob.color || '#fd9225',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    {blob.size === 'small' && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                border: '1px solid #999',
                                                background: '#fff',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {blob.label.replace(/\n/g, ' / ')}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: '#aaa' }}>
                                        ({blob.x}, {blob.y})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#555',
    marginBottom: '3px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.6rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.85rem',
    boxSizing: 'border-box',
    outline: 'none',
};

export default BlobsEditor;
