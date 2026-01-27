import { useEffect, useState } from 'react';
import api from '../api/axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const [inspectionsRes, projectsRes] = await Promise.all([
                api.get('/inspections'),
                api.get('/projects')
            ]);

            const newEvents: any[] = [];

            // Add Inspections
            inspectionsRes.data.forEach((i: any) => {
                newEvents.push({
                    date: new Date(i.inspectionDate),
                    title: `Insp: ${i.callNumber}`,
                    type: 'inspection',
                    project: i.project?.poNumber,
                    color: 'bg-blue-100 text-blue-700 border-blue-200'
                });
            });

            // Add PO Expiries and DP Extensions
            projectsRes.data.forEach((p: any) => {
                if (p.poExpiryDate) {
                    newEvents.push({
                        date: new Date(p.poExpiryDate),
                        title: `Expiry: ${p.poNumber}`,
                        type: 'expiry',
                        project: p.poNumber,
                        color: 'bg-red-100 text-red-700 border-red-200'
                    });
                }
                if (p.dpExtensionDate) {
                    newEvents.push({
                        date: new Date(p.dpExtensionDate),
                        title: `DP Ext: ${p.poNumber}`,
                        type: 'dpext',
                        project: p.poNumber,
                        color: 'bg-orange-100 text-orange-700 border-orange-200'
                    });
                }
            });

            setEvents(newEvents);
        } catch (error) {
            console.error('Failed to fetch calendar events', error);
        } finally {
            setLoading(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad at the beginning of the month
    const startPadding = monthStart.getDay();
    const paddedDays = [...Array(startPadding).fill(null), ...calendarDays];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">QA Calendar</h1>
                    <p className="text-gray-500 mt-1">Timeline of inspections, expiries, and extensions.</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-lg font-bold text-gray-700 min-w-[150px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {paddedDays.map((day, idx) => {
                        if (!day) return <div key={`pad-${idx}`} className="h-32 border-b border-r border-gray-100 bg-gray-50/30"></div>;

                        const dayEvents = events.filter(e => isSameDay(e.date, day));

                        return (
                            <div key={day.toString()} className="h-32 border-b border-r border-gray-100 p-2 overflow-y-auto hover:bg-gray-50/50 transition-colors">
                                <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-600'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="mt-2 space-y-1">
                                    {dayEvents.map((event, eIdx) => (
                                        <div key={eIdx} className={`text-[10px] p-1 rounded border leading-tight ${event.color}`} title={`${event.title} - ${event.project}`}>
                                            <div className="font-bold truncate">{event.title}</div>
                                            <div className="opacity-75 truncate">{event.project}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Inspection</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">PO Expiry</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">DP Extension</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
