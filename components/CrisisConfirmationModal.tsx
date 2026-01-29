
import React from 'react';

interface CrisisConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const QuestionMarkCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 1.152-.468 2.198-1.228 2.969-.76.77-1.784 1.25-2.822 1.25h-.01M12 18h.01" />
    </svg>
);

const CrisisConfirmationModal: React.FC<CrisisConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
                <QuestionMarkCircleIcon />
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">Sensitive Content Detected</h2>
                <p className="text-gray-300 mb-8">
                    We detected potentially serious content. Your safety is our priority.
                    <br />
                    Would you like to view a list of emergency resources?
                </p>

                <div className="flex justify-center items-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto px-6 py-2 font-semibold rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800"
                    >
                        No, I'm okay
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full sm:w-auto px-6 py-2 font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
                    >
                        Yes, show resources
                    </button>
                </div>
                 <p className="text-xs text-gray-500 mt-6">
                    This is an automated message. This app is not a substitute for professional medical advice.
                </p>
            </div>
        </div>
    );
};

export default CrisisConfirmationModal;
