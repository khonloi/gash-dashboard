import { useState } from 'react';

export const useAdvancedModals = () => {
    const [modals, setModals] = useState({});
    const [data, setData] = useState({});

    const openModal = (modalName, modalData = null) => {
        setModals(prev => ({ ...prev, [modalName]: true }));
        if (modalData !== null) {
            setData(prev => ({ ...prev, [modalName]: modalData }));
        }
    };

    const closeModal = (modalName) => {
        setModals(prev => ({ ...prev, [modalName]: false }));
    };

    const isModalOpen = (modalName) => !!modals[modalName];
    const getModalData = (modalName) => data[modalName] || null;

    return {
        openModal,
        closeModal,
        isModalOpen,
        getModalData
    };
};

export default useAdvancedModals;
