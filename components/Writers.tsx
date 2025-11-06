import React, { useState, useMemo } from 'react';
import { ManagedWriter } from '../types';
import { UserPlusIcon } from './icons/UserPlusIcon';
import WriterFormModal from './WriterFormModal';
import { SortAscendingIcon } from './icons/SortAscendingIcon';
import { SortDescendingIcon } from './icons/SortDescendingIcon';

interface WritersProps {
  writers: ManagedWriter[];
  onAddWriter: (writer: Omit<ManagedWriter, 'id' | 'userId'>) => Promise<ManagedWriter | null>;
}

const WriterCard: React.FC<{ writer: ManagedWriter }> = ({ writer }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
        <div>
            <p className="font-semibold text-white">{writer.name}</p>
            <p className="text-sm text-slate-400">
                Born: {new Date(writer.dob).toLocaleDateString()} &bull; Society: {writer.society} {writer.ipi && `• IPI: ${writer.ipi}`}
            </p>
        </div>
    </div>
);

const Writers: React.FC<WritersProps> = ({ writers, onAddWriter }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortedWriters = useMemo(() => {
        return [...writers].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });
    }, [writers, sortOrder]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Managed Writers</h1>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                         <span className="text-sm font-semibold text-slate-400">Sort by name:</span>
                        <button 
                            onClick={() => setSortOrder('asc')}
                            className={`p-2 rounded-md transition-colors ${sortOrder === 'asc' ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                            title="Sort Ascending (A-Z)"
                        >
                            <SortAscendingIcon className="h-5 w-5" />
                        </button>
                        <button
                             onClick={() => setSortOrder('desc')}
                             className={`p-2 rounded-md transition-colors ${sortOrder === 'desc' ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                             title="Sort Descending (Z-A)"
                        >
                            <SortDescendingIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors duration-200"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        Add New Writer
                    </button>
                </div>
            </div>

            {sortedWriters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedWriters.map(writer => (
                        <WriterCard key={writer.id} writer={writer} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400">Your writer library is empty.</p>
                    <button onClick={() => setIsModalOpen(true)} className="mt-4 text-amber-400 font-semibold hover:underline">
                        Add your first writer
                    </button>
                </div>
            )}

            {isModalOpen && (
                <WriterFormModal 
                    onClose={() => setIsModalOpen(false)}
                    onAddWriter={async (writer) => {
                        await onAddWriter(writer);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default Writers;