import React, { useState, useCallback, useRef } from 'react';
import portfolioMapData from '../../work_list/portfolioMap.json';

interface CategoryEditorProps {
  categories: Record<string, string[]>;
  onChange: (categories: Record<string, string[]>) => void;
}

const portfolioMap = portfolioMapData as Record<string, string>;

const CategoryEditor: React.FC<CategoryEditorProps> = ({ categories, onChange }) => {
  const [draggedWork, setDraggedWork] = useState<{ code: string; fromCategory: string | null; fromIndex?: number } | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<{ category: string; index: number } | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all works that are already classified
  const usedWorks = new Set<string>();
  Object.values(categories).forEach((items) => {
    items.forEach((item) => {
      const code = item.includes(':') ? item.split(':').pop()?.trim().toLowerCase() : item.trim().toLowerCase();
      if (code) usedWorks.add(code);
    });
  });

  // Get unclassified works
  const allWorks = Object.keys(portfolioMap);
  const unclassifiedWorks = allWorks.filter((k) => !usedWorks.has(k.toLowerCase()));
  const categoryOrder = Object.keys(categories);

  const handleDropWork = useCallback(
    (targetCategory: string, insertIndex?: number) => {
      if (!draggedWork) return;
      const newCategories = { ...categories };

      // Remove from source category
      let sourceIndex = -1;
      if (draggedWork.fromCategory && newCategories[draggedWork.fromCategory]) {
        const sourceItems = newCategories[draggedWork.fromCategory];
        sourceIndex = sourceItems.findIndex((item) => {
          const code = item.includes(':') ? item.split(':').pop()?.trim().toLowerCase() : item.trim().toLowerCase();
          return code === draggedWork.code.toLowerCase();
        });
        if (sourceIndex !== -1) {
          newCategories[draggedWork.fromCategory] = sourceItems.filter((_, i) => i !== sourceIndex);
        }
      }

      // Add to target category
      if (!newCategories[targetCategory]) {
        newCategories[targetCategory] = [];
      }

      // Check if already exists in target (different from self-reorder)
      const existsInTarget = newCategories[targetCategory].some((item) => {
        const code = item.includes(':') ? item.split(':').pop()?.trim().toLowerCase() : item.trim().toLowerCase();
        return code === draggedWork.code.toLowerCase();
      });

      if (!existsInTarget) {
        // Calculate insert position
        let finalIndex = insertIndex !== undefined ? insertIndex : newCategories[targetCategory].length;

        // If moving within same category and source was before target, adjust index
        if (draggedWork.fromCategory === targetCategory && sourceIndex !== -1 && sourceIndex < finalIndex) {
          finalIndex = Math.max(0, finalIndex - 1);
        }

        newCategories[targetCategory].splice(finalIndex, 0, draggedWork.code);
      }

      onChange(newCategories);
      setDraggedWork(null);
      setDragOverCategory(null);
      setDropTargetIndex(null);
    },
    [draggedWork, categories, onChange]
  );

  const handleDropCategory = useCallback(
    (targetCategory: string) => {
      if (!draggedCategory || draggedCategory === targetCategory) {
        setDraggedCategory(null);
        setDragOverCategory(null);
        return;
      }

      const sourceIndex = categoryOrder.indexOf(draggedCategory);
      const targetIndex = categoryOrder.indexOf(targetCategory);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const newOrder = [...categoryOrder];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCategory);

      const newCategories: Record<string, string[]> = {};
      newOrder.forEach((cat) => {
        newCategories[cat] = categories[cat] || [];
      });

      onChange(newCategories);
      setDraggedCategory(null);
      setDragOverCategory(null);
    },
    [draggedCategory, categoryOrder, categories, onChange]
  );

  const removeWork = useCallback(
    (category: string, workCode: string) => {
      const newCategories = { ...categories };
      newCategories[category] = newCategories[category].filter((item) => {
        const code = item.includes(':') ? item.split(':').pop()?.trim().toLowerCase() : item.trim().toLowerCase();
        return code !== workCode.toLowerCase();
      });
      onChange(newCategories);
    },
    [categories, onChange]
  );

  const addCategory = useCallback(() => {
    const name = window.prompt('輸入新分類名稱:');
    if (name && name.trim() && !categories[name.trim()]) {
      onChange({ ...categories, [name.trim()]: [] });
    }
  }, [categories, onChange]);

  const deleteCategory = useCallback(
    (categoryName: string) => {
      if (!window.confirm(`確定刪除「${categoryName}」？其中的作品將變為未分類。`)) return;
      const newCategories = { ...categories };
      delete newCategories[categoryName];
      onChange(newCategories);
    },
    [categories, onChange]
  );

  const startRenaming = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditingName(categoryName);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishRenaming = () => {
    if (!editingCategory) return;
    const newName = editingName.trim();
    if (newName && newName !== editingCategory && !categories[newName]) {
      const newCategories: Record<string, string[]> = {};
      categoryOrder.forEach((cat) => {
        if (cat === editingCategory) {
          newCategories[newName] = categories[cat];
        } else {
          newCategories[cat] = categories[cat];
        }
      });
      onChange(newCategories);
    }
    setEditingCategory(null);
    setEditingName('');
  };

  const moveCategory = useCallback(
    (categoryName: string, direction: 'up' | 'down') => {
      const index = categoryOrder.indexOf(categoryName);
      if (index === -1) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= categoryOrder.length) return;

      const newOrder = [...categoryOrder];
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

      const newCategories: Record<string, string[]> = {};
      newOrder.forEach((cat) => {
        newCategories[cat] = categories[cat] || [];
      });
      onChange(newCategories);
    },
    [categoryOrder, categories, onChange]
  );

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Left Side: Unclassified Works (Sticky) */}
      <div
        style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: '1rem',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '15px',
            background: unclassifiedWorks.length > 0 ? '#e3f2fd' : '#e8f5e9',
            border: '1px solid ' + (unclassifiedWorks.length > 0 ? '#bbdefb' : '#c8e6c9'),
            borderRadius: '8px',
            minHeight: '200px',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedWork && draggedWork.fromCategory) {
              removeWork(draggedWork.fromCategory, draggedWork.code);
              setDraggedWork(null);
            }
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: unclassifiedWorks.length > 0 ? '#0d47a1' : '#2e7d32', fontSize: '0.95rem' }}>
              {unclassifiedWorks.length > 0 ? '未分類作品 (' + unclassifiedWorks.length + ')' : '✓ 全部已分類!'}
            </strong>
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>
              拖曳到右側分類中
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unclassifiedWorks.map((code) => (
              <div
                key={code}
                draggable
                onDragStart={() => setDraggedWork({ code, fromCategory: null })}
                onDragEnd={() => setDraggedWork(null)}
                title={portfolioMap[code]}
                style={{
                  background: '#fff',
                  padding: '8px 12px',
                  border: '1px solid #90caf9',
                  borderRadius: '6px',
                  fontSize: '0.85em',
                  cursor: 'grab',
                  color: '#1565c0',
                  fontWeight: 500,
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ fontWeight: 600 }}>{code}</span>
                <span style={{ fontSize: '0.75em', color: '#666', marginTop: '2px' }}>
                  {portfolioMap[code]?.slice(0, 20)}{(portfolioMap[code]?.length || 0) > 20 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Categories */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Add Category Button */}
        <button
          onClick={addCategory}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          + 新增分類
        </button>

        {/* Categories List */}
        {categoryOrder.map((categoryName, catIndex) => (
          <div
            key={categoryName}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedWork) {
                setDragOverCategory(categoryName);
              }
            }}
            onDragLeave={() => {
              if (draggedWork) {
                setDragOverCategory(null);
              }
            }}
            onDrop={() => {
              if (draggedCategory) {
                handleDropCategory(categoryName);
              } else if (draggedWork) {
                handleDropWork(categoryName);
              }
            }}
            style={{
              padding: '12px',
              background: dragOverCategory === categoryName ? '#fff3e0' : '#fafafa',
              border: '2px solid ' + (dragOverCategory === categoryName ? '#ffb74d' : '#e0e0e0'),
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              opacity: draggedCategory === categoryName ? 0.5 : 1,
            }}
          >
            {/* Category Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {/* Drag Handle for Category */}
              <span
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDraggedCategory(categoryName);
                }}
                onDragEnd={() => {
                  setDraggedCategory(null);
                  setDragOverCategory(null);
                }}
                style={{ cursor: 'grab', color: '#999', fontSize: '1.1rem', padding: '4px' }}
                title="拖曳調整順序"
              >
                ☰
              </span>
              {editingCategory === categoryName ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishRenaming}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRenaming();
                    if (e.key === 'Escape') {
                      setEditingCategory(null);
                      setEditingName('');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    border: '1px solid #1976d2',
                    borderRadius: '4px',
                  }}
                />
              ) : (
                <span
                  style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', cursor: 'text' }}
                  onDoubleClick={() => startRenaming(categoryName)}
                >
                  {categoryName}
                </span>
              )}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => moveCategory(categoryName, 'up')}
                  disabled={catIndex === 0}
                  style={{
                    padding: '2px 6px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: catIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: catIndex === 0 ? 0.5 : 1,
                    fontSize: '0.8rem',
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveCategory(categoryName, 'down')}
                  disabled={catIndex === categoryOrder.length - 1}
                  style={{
                    padding: '2px 6px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: catIndex === categoryOrder.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: catIndex === categoryOrder.length - 1 ? 0.5 : 1,
                    fontSize: '0.8rem',
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => startRenaming(categoryName)}
                  style={{
                    padding: '2px 6px',
                    background: '#e3f2fd',
                    border: '1px solid #90caf9',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteCategory(categoryName)}
                  style={{
                    padding: '2px 6px',
                    background: '#ffebee',
                    border: '1px solid #ef9a9a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Works in Category */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                minHeight: '36px',
                padding: '8px',
                background: '#fff',
                border: '1px dashed #ccc',
                borderRadius: '4px',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                // When dragging over empty space at end
                if (draggedWork) {
                  setDropTargetIndex({ category: categoryName, index: categories[categoryName]?.length || 0 });
                }
              }}
              onDrop={() => {
                if (draggedWork) {
                  handleDropWork(categoryName, dropTargetIndex?.category === categoryName ? dropTargetIndex.index : undefined);
                }
              }}
            >
              {categories[categoryName]?.length === 0 && (
                <span style={{ color: '#999', fontSize: '0.8em' }}>拖曳作品至此...</span>
              )}
              {categories[categoryName]?.map((item, index) => {
                const code = item.includes(':') ? item.split(':').pop()?.trim() || item : item;
                const displayLabel = item.includes(':') ? item : code;
                const isDropTarget = dropTargetIndex?.category === categoryName && dropTargetIndex?.index === index;
                const isDragging = draggedWork?.code.toLowerCase() === code.toLowerCase() && draggedWork?.fromCategory === categoryName;
                return (
                  <div
                    key={code + '-' + index}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedWork({ code, fromCategory: categoryName, fromIndex: index });
                    }}
                    onDragEnd={() => {
                      setDraggedWork(null);
                      setDropTargetIndex(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedWork && !isDragging) {
                        setDropTargetIndex({ category: categoryName, index });
                        setDragOverCategory(categoryName);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedWork && !isDragging) {
                        handleDropWork(categoryName, index);
                      }
                    }}
                    title={portfolioMap[code.toLowerCase()] || code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isDragging ? '#e0e0e0' : isDropTarget ? '#bbdefb' : '#f5f5f5',
                      padding: '4px 8px',
                      border: isDropTarget ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      cursor: 'grab',
                      userSelect: 'none',
                      opacity: isDragging ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{displayLabel}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWork(categoryName, code);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        padding: '0 2px',
                        fontSize: '1em',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {/* Drop zone for appending to end */}
              {draggedWork && categories[categoryName]?.length > 0 && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropTargetIndex({ category: categoryName, index: categories[categoryName].length });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDropWork(categoryName, categories[categoryName].length);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    background: dropTargetIndex?.category === categoryName && dropTargetIndex?.index === categories[categoryName].length ? '#bbdefb' : '#f0f0f0',
                    border: dropTargetIndex?.category === categoryName && dropTargetIndex?.index === categories[categoryName].length ? '2px dashed #1976d2' : '1px dashed #ccc',
                    borderRadius: '12px',
                    fontSize: '0.75em',
                    color: '#666',
                    cursor: 'default',
                    transition: 'all 0.15s ease',
                  }}
                >
                  + 放到最後
                </div>
              )}
            </div>
          </div>
        ))}

        {categoryOrder.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', background: '#f5f5f5', borderRadius: '8px' }}>
            尚無分類，請點擊上方按鈕新增
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryEditor;
