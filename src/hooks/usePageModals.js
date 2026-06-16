import { useState } from 'react';

export const usePageModals = () => {
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);
    const [mainModalMode, setMainModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedItem, setSelectedItem] = useState(null);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const openCreateModal = () => {
        setSelectedItem(null);
        setMainModalMode('create');
        setIsMainModalOpen(true);
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setMainModalMode('edit');
        setIsMainModalOpen(true);
    };

    const openViewModal = (item) => {
        setSelectedItem(item);
        setMainModalMode('view');
        setIsMainModalOpen(true);
    };

    const closeMainModal = () => {
        setIsMainModalOpen(false);
        setSelectedItem(null);
    };

    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return {
        isMainModalOpen,
        mainModalMode,
        selectedItem,
        isDeleteModalOpen,
        itemToDelete,
        openCreateModal,
        openEditModal,
        openViewModal,
        closeMainModal,
        openDeleteModal,
        closeDeleteModal,
        setIsMainModalOpen,
        setMainModalMode,
        setSelectedItem,
        setIsDeleteModalOpen,
        setItemToDelete
    };
};

export default usePageModals;
