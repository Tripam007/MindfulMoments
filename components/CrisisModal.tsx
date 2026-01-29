
import React from 'react';

interface CrisisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExclamationTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-gray-800 border border-red-500 rounded-lg p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center">
                <ExclamationTriangleIcon />
                <h2 className="text-2xl font-bold text-red-400 mb-4">Immediate Support is Available</h2>
                <p className="text-gray-300 mb-6">
                    Your safety is the most important thing. If you are in crisis or having thoughts of harming yourself, please reach out for help immediately. You are not alone.
                </p>

                <div className="bg-gray-700 p-4 rounded-md text-left space-y-3">
                    <h3 className="font-semibold text-lg text-white mb-2">Emergency Resources:</h3>
                    <div className="text-indigo-400">
                        <p className="font-bold">988 Suicide & Crisis Lifeline:</p>
                        <p>Call or Text <a href="tel:988" className="underline font-mono">988</a></p>
                    </div>
                     <div className="text-indigo-400">
                        <p className="font-bold">Crisis Text Line:</p>
                        <p>Text <strong className="font-mono">HOME</strong> to <strong className="font-mono">741741</strong></p>
                    </div>
                     <div className="text-indigo-400">
                        <p className="font-bold">Online Chat:</p>
                        <a href="https://988lifeline.org/chat/" target="_blank" rel="noopener noreferrer" className="hover:underline">988lifeline.org/chat</a>
                    </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-6">
                    This is an automated message based on the content of your entry. This app is not a substitute for professional medical advice.
                </p>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-3 text-lg font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrisisModal;
