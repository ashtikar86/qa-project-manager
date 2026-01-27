import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavItem = ({ to, icon, label, exact = false }: { to: string, icon: React.ReactNode, label: string, exact?: boolean }) => {
        const active = exact ? location.pathname === to : isActive(to);
        return (
            <Link to={to} className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${active
                    ? 'bg-blue-600/10 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}>
                <span className={`${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {icon}
                </span>
                <span className="font-medium text-sm">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 hidden md:flex shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-xl">Q</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800 tracking-tight">QA Manager</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
                    <NavItem to="/dashboard" label="Dashboard" icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    } exact />
                    <NavItem to="/projects" label="Projects" icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    } />

                    <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace</div>
                    <NavItem to="/inspections" label="Inspections" icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    } />
                    <NavItem to="/calendar" label="Calendar" icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    } />
                    <NavItem to="/knowledge-bank" label="Knowledge Bank" icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    } />

                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                        <>
                            <div className="px-3 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
                            <NavItem to="/users" label="Users" icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            } />
                            <NavItem to="/settings" label="Settings" icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            } />
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Section */}
            <div className="flex-1 flex flex-col md:ml-64">
                {/* Header Navbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm z-10 sticky top-0">
                    <div className="text-xl font-semibold text-gray-800">
                        {location.pathname === '/dashboard' ? 'Overview' :
                            location.pathname.includes('/projects') ? 'Project Workspace' :
                                location.pathname.includes('/users') ? 'Directory' : 'Workspace'}
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative">
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
                            <svg className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>

                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-bold text-gray-800">{user.name || user.username}</div>
                                <div className="text-xs text-blue-600 font-medium">{user.role}</div>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm ring-1 ring-gray-100">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Viewer */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
