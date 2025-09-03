import React from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../../constants';

/**
 * A sleek, reusable navigation item for the bottom nav bar.
 * It displays as a circular icon when inactive, and smoothly expands
 * to show a text label when active.
 */
const SleekNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
}> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex h-12 items-center justify-center rounded-full transition-all duration-300 ease-in-out ${
        isActive
          ? 'bg-indigo-100 px-4 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
          : 'w-12 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className="h-6 w-6 flex-shrink-0" />
        {isActive && (
          <span className="ml-2 whitespace-nowrap text-sm font-medium">
            {label}
          </span>
        )}
      </>
    )}
  </NavLink>
);

/**
 * A reimagined, sleek bottom navigation bar component.
 * It renders as a floating "pill" at the bottom of the screen, providing a modern
 * and minimalist user experience with smooth animations for active states.
 */
const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-4 left-1/2 z-10 w-auto -translate-x-1/2 rounded-full bg-white/70 p-2 shadow-lg backdrop-blur-lg dark:bg-gray-900/70 md:hidden">
      <div className="flex items-center gap-2">
        {/* Groups Link */}
        <SleekNavItem to="/groups" icon={ICONS.GROUPS} label="Groups" />

        {/* Central Add Button */}
        <NavLink
          to="/add-expense"
          className="flex h-12 w-12 transform items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] active:shadow-inner dark:focus:ring-offset-gray-900"
          aria-label="Add Expense"
        >
          <ICONS.ADD className="h-6 w-6" />
        </NavLink>

        {/* Profile Link */}
        <SleekNavItem to="/profile" icon={ICONS.PROFILE} label="Profile" />
      </div>
    </nav>
  );
};

export default BottomNav;
