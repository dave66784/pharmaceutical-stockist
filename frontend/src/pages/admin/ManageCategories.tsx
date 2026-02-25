import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/categoryService';
import { Category, SubCategory } from '../../types';

type ModalMode = 'add-category' | 'edit-category' | 'add-subcategory' | 'edit-subcategory' | null;

const ManageCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
    const [subCategories, setSubCategories] = useState<Record<number, SubCategory[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Modal state
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'subcategory'; id: number; name: string } | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const cats = await categoryService.getAllCategories();
            setCategories(cats);
        } catch {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const loadSubCategories = async (categoryId: number) => {
        if (subCategories[categoryId]) return;
        try {
            const subs = await categoryService.getSubCategoriesByCategory(categoryId);
            setSubCategories(prev => ({ ...prev, [categoryId]: subs }));
        } catch {
            setError('Failed to load sub-categories');
        }
    };

    const toggleExpand = async (categoryId: number) => {
        if (expandedCategory === categoryId) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(categoryId);
            await loadSubCategories(categoryId);
        }
    };

    const openModal = (mode: ModalMode, category?: Category, subCategory?: SubCategory) => {
        setModalMode(mode);
        setSelectedCategory(category || null);
        setSelectedSubCategory(subCategory || null);
        setFormName(
            mode === 'edit-category' ? category?.name || '' :
                mode === 'edit-subcategory' ? subCategory?.name || '' : ''
        );
        setFormDescription(
            mode === 'edit-category' ? category?.description || '' :
                mode === 'edit-subcategory' ? subCategory?.description || '' : ''
        );
        setError(null);
    };

    const closeModal = () => {
        setModalMode(null);
        setFormName('');
        setFormDescription('');
        setSelectedCategory(null);
        setSelectedSubCategory(null);
    };

    const handleSave = async () => {
        if (!formName.trim()) { setError('Name is required'); return; }
        setSaving(true);
        setError(null);
        try {
            if (modalMode === 'add-category') {
                await categoryService.createCategory({ name: formName.trim(), description: formDescription.trim() || undefined });
                setSuccess('Category created');
                await fetchCategories();
            } else if (modalMode === 'edit-category' && selectedCategory) {
                await categoryService.updateCategory(selectedCategory.id, { name: formName.trim(), description: formDescription.trim() || undefined });
                setSuccess('Category updated');
                await fetchCategories();
            } else if (modalMode === 'add-subcategory' && selectedCategory) {
                const sub = await categoryService.createSubCategory(selectedCategory.id, { name: formName.trim(), description: formDescription.trim() || undefined });
                setSubCategories(prev => ({
                    ...prev,
                    [selectedCategory.id]: [...(prev[selectedCategory.id] || []), sub]
                }));
                setSuccess('Sub-category created');
            } else if (modalMode === 'edit-subcategory' && selectedSubCategory && selectedCategory) {
                const updated = await categoryService.updateSubCategory(selectedSubCategory.id, {
                    name: formName.trim(),
                    description: formDescription.trim() || undefined,
                    categoryId: selectedCategory.id
                });
                setSubCategories(prev => ({
                    ...prev,
                    [selectedCategory.id]: prev[selectedCategory.id].map(s => s.id === updated.id ? updated : s)
                }));
                setSuccess('Sub-category updated');
            }
            closeModal();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            if (deleteConfirm.type === 'category') {
                await categoryService.deleteCategory(deleteConfirm.id);
                setSuccess('Category deleted');
                await fetchCategories();
                setSubCategories(prev => { const p = { ...prev }; delete p[deleteConfirm.id]; return p; });
                if (expandedCategory === deleteConfirm.id) setExpandedCategory(null);
            } else {
                await categoryService.deleteSubCategory(deleteConfirm.id);
                setSubCategories(prev => {
                    const updated = { ...prev };
                    const catId = Object.entries(updated).find(([, subs]) => subs.some(s => s.id === deleteConfirm.id))?.[0];
                    if (catId) updated[Number(catId)] = updated[Number(catId)].filter(s => s.id !== deleteConfirm.id);
                    return updated;
                });
                setSuccess('Sub-category deleted');
            }
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Delete failed. Category may have products assigned to it.');
        } finally {
            setSaving(false);
            setDeleteConfirm(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
                <button
                    onClick={() => openModal('add-category')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Add Category
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 font-bold">×</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    ✓ {success}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No categories yet.</p>
                    <button onClick={() => openModal('add-category')} className="text-blue-600 hover:underline">
                        Create your first category
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-white rounded-lg shadow overflow-hidden">
                            {/* Category Row */}
                            <div className="flex items-center justify-between px-5 py-4">
                                <button
                                    onClick={() => toggleExpand(cat.id)}
                                    className="flex items-center gap-3 flex-1 text-left"
                                >
                                    <span className={`transition-transform duration-200 ${expandedCategory === cat.id ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <div>
                                        <span className="font-semibold text-gray-900">{cat.name}</span>
                                        <span className="ml-3 text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                            {cat.slug}
                                        </span>
                                        {cat.description && (
                                            <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
                                        )}
                                    </div>
                                </button>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => openModal('add-subcategory', cat)}
                                        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                                    >
                                        + Sub-category
                                    </button>
                                    <button
                                        onClick={() => openModal('edit-category', cat)}
                                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                                        className="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Sub-categories (expanded) */}
                            {expandedCategory === cat.id && (
                                <div className="border-t border-gray-100 bg-gray-50">
                                    {!subCategories[cat.id] ? (
                                        <div className="px-10 py-4 text-sm text-gray-400">Loading...</div>
                                    ) : subCategories[cat.id].length === 0 ? (
                                        <div className="px-10 py-4 text-sm text-gray-400">No sub-categories yet.</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                                                    <th className="px-10 py-2 font-medium">Sub-category</th>
                                                    <th className="py-2 font-medium">Slug</th>
                                                    <th className="py-2 font-medium">Description</th>
                                                    <th className="py-2 pr-5"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subCategories[cat.id].map(sub => (
                                                    <tr key={sub.id} className="border-b border-gray-100 last:border-0 hover:bg-white">
                                                        <td className="px-10 py-2.5 font-medium text-gray-800">{sub.name}</td>
                                                        <td className="py-2.5 text-gray-400 font-mono text-xs">{sub.slug}</td>
                                                        <td className="py-2.5 text-gray-500">{sub.description || '—'}</td>
                                                        <td className="py-2.5 pr-5">
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={() => openModal('edit-subcategory', cat, sub)}
                                                                    className="text-blue-600 hover:underline text-xs"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm({ type: 'subcategory', id: sub.id, name: sub.name })}
                                                                    className="text-red-600 hover:underline text-xs"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalMode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {modalMode === 'add-category' && 'Add Category'}
                                {modalMode === 'edit-category' && 'Edit Category'}
                                {modalMode === 'add-subcategory' && `Add Sub-category to "${selectedCategory?.name}"`}
                                {modalMode === 'edit-subcategory' && `Edit Sub-category "${selectedSubCategory?.name}"`}
                            </h2>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="e.g. Vaccines"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    rows={3}
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={saving}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">
                            Delete{' '}
                            {deleteConfirm.type === 'category' ? 'category' : 'sub-category'}{' '}
                            <strong>"{deleteConfirm.name}"</strong>?
                            {deleteConfirm.type === 'category' && (
                                <span className="block text-sm text-red-600 mt-2">
                                    ⚠️ This will fail if products are assigned to this category.
                                </span>
                            )}
                        </p>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setDeleteConfirm(null); setError(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {saving ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCategories;
