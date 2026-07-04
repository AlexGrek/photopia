import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
    { label: 'Galleries', to: '/' },
    { label: 'Moodboards', to: '/moodboards' },
];

const PageTabs: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="flex justify-center sm:justify-start gap-2 mb-6">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.to;
                return (
                    <Link
                        key={tab.to}
                        to={tab.to}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                            isActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
};

export default PageTabs;
