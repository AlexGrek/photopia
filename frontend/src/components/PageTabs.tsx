import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
    { label: 'Galleries', to: '/' },
    { label: 'Moodboards', to: '/moodboards' },
];

const PageTabs: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="flex items-baseline gap-5">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.to;
                return (
                    <Link
                        key={tab.to}
                        to={tab.to}
                        className={`text-lg font-extralight tracking-wide transition-colors duration-200 ${
                            isActive
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
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
