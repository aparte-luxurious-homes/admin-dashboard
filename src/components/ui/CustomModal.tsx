import React from "react";
import { AiOutlineClose } from "react-icons/ai";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const CustomModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-primary bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <div onClick={onClose} className="cursor-pointer text-gray-700 hover:text-gray-800">
            <AiOutlineClose />
          </div>
        </div>

        {/* Modal Content */}
        <div>{children}</div>

        {/* Modal Footer */}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
