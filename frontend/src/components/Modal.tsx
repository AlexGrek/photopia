import { Fragment, type FC } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';

type ModalSize = 'small' | 'large';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: ModalSize;
    children: React.ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, size = 'small', children }) => {
    const sizeClasses = {
        small: 'max-w-md',
        large: 'max-w-3xl',
    };

    const modalSizeClass = sizeClasses[size];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel
                                className={`w-full ${modalSizeClass} transform overflow-hidden rounded-2xl bg-white/10 p-6 text-left align-middle shadow-xl transition-all border border-gray-700 backdrop-blur-2xl`}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                                    <DialogTitle
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-white"
                                    >
                                        {title}
                                    </DialogTitle>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-white transition-colors"
                                        onClick={onClose}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-4 text-gray-200">{children}</div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default Modal;
