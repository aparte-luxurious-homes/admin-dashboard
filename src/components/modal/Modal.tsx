import { useEffect } from "react";
// import Image from "next/image";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, content, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-xl p-4 sm:p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-black 
                     min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full 
                     hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="text-xl">✖</span>
        </button>

        <div className="flex justify-center mb-4">
        </div>

        {/* Modal Title */}
        <h2 className="text-lg sm:text-xl font-semibold text-center pr-10">{title}</h2>

        {/* Modal Content */}
        <div className="text-gray-600 text-center my-4 text-sm sm:text-base">{content}</div>

        {/* Modal Footer */}
        {footer && <div className="text-center mt-6">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
