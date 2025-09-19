// src/components/gastritis/modals/ImagePopupModal.tsx
import React from 'react';
import Modal from '@/components/ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  title: string;
}

const ImagePopupModal: React.FC<Props> = ({ isOpen, onClose, imageSrc, title }) => {
  if (!imageSrc) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      <div className="p-4 bg-black/20">
        <img src={imageSrc} alt={title} className="w-full h-auto object-contain rounded-lg" />
      </div>
    </Modal>
  );
};

export default ImagePopupModal;