import React from 'react';
import { SquarePlus } from 'lucide-react';
import { Menu } from '@headlessui/react';
import Logo from './Logo';
import PageTabs from './PageTabs';

interface ListPageHeaderProps {
    onAddClick: () => void;
}

// Desktop: logo + tabs share the header row.
// Mobile: tabs drop to their own row below the header (still part of the
// same sticky/blurred block so they scroll together).
const ListPageHeader: React.FC<ListPageHeaderProps> = ({ onAddClick }) => (
    <div className="sticky top-0 z-10 backdrop-blur-2xl">
        <header className="flex justify-between items-center p-6 shadow-md">
            <div className="flex items-baseline gap-6">
                <Logo />
                <div className="hidden sm:block">
                    <PageTabs />
                </div>
            </div>
            <Menu as="div" className="relative">
                <button
                    id="login-btn"
                    onClick={onAddClick}
                    className="bg-gray-900 hover:bg-gray-700 cursor-pointer text-white font-medium py-2 px-4 rounded-2xl transition-colors duration-200 flex items-center gap-2"
                >
                    <SquarePlus size={20} />
                    <span className="hidden sm:inline opacity-55">Add</span>
                </button>
            </Menu>
        </header>
        <div className="sm:hidden flex justify-center pb-4">
            <PageTabs />
        </div>
    </div>
);

export default ListPageHeader;
