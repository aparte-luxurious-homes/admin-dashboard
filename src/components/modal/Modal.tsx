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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-full mx-[2%] max-w-lg rounded-xl p-6 shadow-lg relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✖
        </button>

        <div className="flex justify-center mb-4">
        </div>

        {/* Modal Title */}
        <h2 className="text-xl font-semibold text-center">{title}</h2>

        {/* Modal Content */}
        <div className="text-gray-600 text-center my-4">{content}</div>

        {/* Modal Footer */}
        {footer && <div className="text-center">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
