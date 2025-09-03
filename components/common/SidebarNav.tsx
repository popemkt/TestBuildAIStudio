import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../../constants';
import { useAppStore } from '../../store/appStore';
import Avatar from './Avatar';

const SidebarNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
}> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg p-3 text-base font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
          : 'text-gray-600 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-800'
      }`
    }
  >
    <Icon className="h-6 w-6 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

const SidebarNav: React.FC = () => {
  const { currentUser } = useAppStore();

  return (
    <nav className="hidden w-64 flex-shrink-0 flex-col justify-between p-4 md:flex">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <ICONS.SPARKLES className="h-8 w-8 text-indigo-500" />
          <h1 className="text-2xl font-bold">SplitSmart</h1>
        </div>
        <div className="space-y-2">
          <SidebarNavItem to="/groups" icon={ICONS.GROUPS} label="Groups" />
          <SidebarNavItem to="/profile" icon={ICONS.PROFILE} label="Profile" />
        </div>
        <NavLink to="/add-expense" className="mt-6 block">
          <button
            tabIndex={-1}
            className="font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform flex items-center justify-center gap-2 shadow-sm disabled:shadow-none active:scale-[0.98] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-700 focus:ring-indigo-500 hover:-translate-y-0.5 hover:shadow-lg active:shadow-inner disabled:hover:translate-y-0 py-3 px-6 text-base w-full"
          >
            <ICONS.ADD className="h-5 w-5" />
            Add Expense
          </button>
        </NavLink>
      </div>
      {currentUser && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-200/50 p-3 dark:bg-gray-800/50">
          <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="md" />
          <div>
            <p className="font-semibold">{currentUser.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser.email}
            </p>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SidebarNav;
