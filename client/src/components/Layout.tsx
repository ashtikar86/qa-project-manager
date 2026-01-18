import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const Layout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 text-white flex flex-col">
                <div className="p-4 text-2xl font-bold border-b border-slate-700">QA Manager</div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slate-700 hover:text-white">
                        Dashboard
                    </Link>
                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'DDG') && (
                        <Link to="/projects/create" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slate-700 hover:text-white">
                            Create Project
                        </Link>
                    )}
                    <Link to="/projects" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slate-700 hover:text-white">
                        All Projects
                    </Link>
                    {(user.role === 'SUPER_ADMIN') && (
                        <Link to="/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-slate-700 hover:text-white">
                            User Management
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="mb-2 text-sm text-gray-400">Logged in as: {user.username}</div>
                    <button onClick={handleLogout} className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-center">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
