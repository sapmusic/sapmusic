import React, { useState, useRef, useEffect } from 'react';
import { RegisteredSong, Writer, AgreementStatus } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ExportIcon } from './icons/ExportIcon';
import { EyeIcon } from './icons/EyeIcon';
import PrintableAgreement from './PrintableAgreement';
import AgreementDetailModal from './AgreementDetailModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SyncIcon } from './icons/SyncIcon';


// Let TypeScript know about the globals from the script tags
declare const jspdf: any;
declare const html2canvas: any;

interface AgreementsProps {
  songs: RegisteredSong[];
  onUpdateSongStatus: (songId: string, status: AgreementStatus) => Promise<void>;
  isAdmin: boolean;
  onResubmitAgreement?: (songId: string) => Promise<void>;
}

const CollectionToggle: React.FC<{ isCollecting: boolean }> = ({ isCollecting }) => {
  const baseClasses = 'w-9 h-5 rounded-full relative p-0.5 transition-colors duration-200 cursor-default';
  const dotClasses = 'w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200';
  
  return (
    <div title={isCollecting ? "Royalties are being collected on behalf of this writer." : "Royalties are not being collected on behalf of this writer."}>
      <div className={`${baseClasses} ${isCollecting ? 'bg-amber-500' : 'bg-slate-600'}`}>
        <div className={`${dotClasses} ${isCollecting ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </div>
  );
};


const WriterDetail: React.FC<{ writer: Writer }> = ({ writer }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <span className="text-slate-300">{writer.name} ({writer.role.join(', ')}{writer.society && `, ${writer.society}`}{writer.ipi && `, IPI: ${writer.ipi}`})</span>
        <div className="flex items-center gap-3">
            <CollectionToggle isCollecting={writer.collectOnBehalf} />
            <span className="font-semibold text-slate-200 w-12 text-right">{writer.split}%</span>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: AgreementStatus }> = ({ status }) => {
    const baseClasses = 'text-xs font-bold py-1 px-2.5 rounded-full capitalize';
    const styles: Record<AgreementStatus, string> = {
        active: 'bg-green-500/20 text-green-300',
        pending: 'bg-yellow-500/20 text-yellow-300',
        expired: 'bg-red-500/20 text-red-400',
        rejected: 'bg-slate-500/20 text-slate-300',
    };
    const tooltips: Record<AgreementStatus, string> = {
        active: 'This agreement is currently in effect.',
        pending: 'This agreement is awaiting admin approval.',
        expired: 'This agreement is no longer in effect.',
        rejected: 'This submission has been rejected.',
    };
    return <span className={`${baseClasses} ${styles[status]}`} title={tooltips[status]}>{status}</span>
};

const AdminStatusSelector: React.FC<{
    currentStatus: AgreementStatus;
    onChange: (newStatus: AgreementStatus) => void;
}> = ({ currentStatus, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const styles: Record<AgreementStatus, string> = {
        active: 'bg-green-500/20 text-green-300 border-green-500/30',
        pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        expired: 'bg-red-500/20 text-red-400 border-red-500/30',
        rejected: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleSelect = (status: AgreementStatus) => {
        onChange(status);
        setIsOpen(false);
    }

    const statuses: AgreementStatus[] = ['active', 'pending', 'expired', 'rejected'];

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`text-xs font-bold py-1 px-2.5 rounded-full capitalize flex items-center gap-1 border ${styles[currentStatus]}`}>
                {currentStatus}
                <ChevronDownIcon className="h-3 w-3" />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full right-0 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg">
                    {statuses.map(status => (
                        <button 
                            key={status}
                            onClick={() => handleSelect(status)}
                            className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-600 capitalize text-slate-200"
                        >
                            {status}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const StatusIndicatorDot: React.FC<{ status: AgreementStatus }> = ({ status }) => {
    const colorClasses: Record<AgreementStatus, string> = {
        active: 'bg-green-500',
        pending: 'bg-yellow-500',
        expired: 'bg-red-500',
        rejected: 'bg-slate-500',
    };
    return <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${colorClasses[status]}`} title={`Status: ${status}`}></span>
};

const AgreementCard: React.FC<{ 
    song: RegisteredSong, 
    onDownload: (song: RegisteredSong) => void,
    onViewDetails: (song: RegisteredSong) => void,
    onUpdateStatus: (status: AgreementStatus) => void,
    isAdmin: boolean,
    isDownloading: boolean,
    onResubmit?: (songId: string) => Promise<void>,
}> = ({ song, onDownload, onViewDetails, onUpdateStatus, isAdmin, isDownloading, onResubmit }) => {
    const [isResubmitting, setIsResubmitting] = useState(false);

    const handleResubmit = async () => {
        if (!onResubmit) return;
        setIsResubmitting(true);
        await onResubmit(song.id);
        setIsResubmitting(false);
    };
    
    return (
    <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col transition-shadow hover:shadow-lg hover:shadow-amber-500/10">
        <div className="p-5 flex gap-5">
             <img src={song.artworkUrl} alt={`${song.title} artwork`} className="w-24 h-24 rounded-md object-cover flex-shrink-0" />
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg text-white flex items-center gap-2">
                            <StatusIndicatorDot status={song.status} />
                            <span className="font-bold">{song.title}</span>
                        </h3>
                        <p className="text-slate-400">{song.artist}</p>
                    </div>
                     {isAdmin ? (
                        <AdminStatusSelector currentStatus={song.status} onChange={onUpdateStatus} />
                    ) : (
                        <StatusBadge status={song.status} />
                    )}
                </div>
                <div className="mt-auto pt-2 flex justify-between items-center">
                    <p className="text-xs text-slate-500">Registered on {new Date(song.registrationDate).toLocaleDateString()}</p>
                    {song.duration && <span className="text-xs font-mono bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">{song.duration}</span>}
                </div>
            </div>
        </div>
        <div className="bg-slate-900/50 px-5 py-3 border-t border-b border-slate-700/50 flex-grow">
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Writer Splits</h4>
            <div className="space-y-1">
                {song.writers.map(writer => <WriterDetail key={writer.id} writer={writer} />)}
            </div>
        </div>
        <div className="p-3 bg-slate-800/50 grid grid-cols-2 gap-2">
            <button onClick={() => onViewDetails(song)} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 py-2 rounded-md transition-colors">
                <EyeIcon className="w-5 h-5" />
                View
            </button>
            <button
                onClick={() => onDownload(song)}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-300 bg-slate-700/50 hover:bg-slate-700 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isDownloading ? (
                    'Generating...'
                ) : (
                    <>
                        <DownloadIcon className="w-5 h-5" />
                        PDF
                    </>
                )}
            </button>
        </div>
        {!isAdmin && (song.status === 'expired' || song.status === 'rejected') && (
            <div className="p-3 pt-0 bg-slate-800/50">
                <button
                    onClick={handleResubmit}
                    disabled={isResubmitting}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-amber-400 bg-slate-700/50 hover:bg-slate-700 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <SyncIcon className="w-5 h-5" />
                    {isResubmitting ? 'Submitting...' : 'Resubmit for Approval'}
                </button>
            </div>
        )}
    </div>
)};

type StatusFilter = AgreementStatus | 'all';

const FilterButton: React.FC<{
    label: string, 
    value: StatusFilter, 
    activeFilter: StatusFilter, 
    setFilter: (value: StatusFilter) => void
}> = ({ label, value, activeFilter, setFilter }) => {
    const isActive = value === activeFilter;
    return (
        <button
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    )
}

const Agreements: React.FC<AgreementsProps> = ({ songs, onUpdateSongStatus, isAdmin, onResubmitAgreement }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [printingSong, setPrintingSong] = useState<RegisteredSong | null>(null);
    const [selectedSong, setSelectedSong] = useState<RegisteredSong | null>(null);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const printableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (printingSong && printableRef.current) {
            const element = printableRef.current;
            html2canvas(element, { scale: 2 }).then((canvas: any) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const imgWidth = pdfWidth - 20; // with margin
                const imgHeight = imgWidth / ratio;
                
                let heightLeft = imgHeight;
                let position = 10;
                
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight + 10;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                  heightLeft -= pdfHeight;
                }
                
                pdf.save(`Agreement-${printingSong.title.replace(' ','_')}-${printingSong.artist.replace(' ','_')}.pdf`);
            }).catch((err: any) => {
                console.error("Error generating PDF:", err);
            }).finally(() => {
                setPrintingSong(null); // Reset after saving or on error
                setGeneratingPdfId(null);
            });
        }
    }, [printingSong]);

    const handleDownload = (song: RegisteredSong) => {
        if (generatingPdfId) return; // Prevent concurrent downloads
        setGeneratingPdfId(song.id);
        setPrintingSong(song);
    };

    const filteredSongs = songs.filter(song => {
        const lowerCaseTerm = searchTerm.toLowerCase();

        const statusMatch = statusFilter === 'all' || song.status === statusFilter;

        const searchMatch = !lowerCaseTerm || 
            song.title.toLowerCase().includes(lowerCaseTerm) ||
            song.artist.toLowerCase().includes(lowerCaseTerm) ||
            song.writers.some(writer => writer.name.toLowerCase().includes(lowerCaseTerm));
        
        return statusMatch && searchMatch;
    });

    const handleExportCSV = () => {
        if (filteredSongs.length === 0) return;

        const headers = ['Song Title', 'Artist', 'Registration Date', 'Status', 'Duration', 'ISRC', 'UPC', 'Writer Name', 'Writer Role', 'Writer Split %', 'Writer DOB', 'Writer Society', 'Writer IPI', 'Collecting on Behalf'];
        
        const csvRows = [headers.join(',')];

        filteredSongs.forEach(song => {
            song.writers.forEach(writer => {
                const row = [
                    song.title,
                    song.artist,
                    song.registrationDate,
                    song.status,
                    song.duration || '',
                    song.isrc || '',
                    song.upc || '',
                    writer.name,
                    writer.role.join('; '),
                    writer.split,
                    writer.dob || '',
                    writer.society || '',
                    writer.ipi || '',
                    writer.collectOnBehalf ? 'Yes' : 'No'
                ];
                // Escape commas in fields by wrapping in double quotes
                const formattedRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
                csvRows.push(formattedRow);
            });
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sap_music_agreements_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Agreements</h1>
      
      <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input 
                type="text"
                placeholder="Search by song title, artist, or writer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-400 mr-2">Status:</span>
            <FilterButton label="All" value="all" activeFilter={statusFilter} setFilter={setStatusFilter} />
            <FilterButton label="Active" value="active" activeFilter={statusFilter} setFilter={setStatusFilter} />
            <FilterButton label="Pending" value="pending" activeFilter={statusFilter} setFilter={setStatusFilter} />
            <FilterButton label="Expired" value="expired" activeFilter={statusFilter} setFilter={setStatusFilter} />
            <FilterButton label="Rejected" value="rejected" activeFilter={statusFilter} setFilter={setStatusFilter} />
            <div className="flex-grow"></div>
            <button
                onClick={handleExportCSV}
                disabled={filteredSongs.length === 0}
                className="flex items-center gap-2 text-sm font-semibold text-amber-400 bg-slate-700/50 hover:bg-slate-700 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ExportIcon className="w-5 h-5" />
                Export to CSV
            </button>
        </div>
      </div>


      <div>
        {songs.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSongs.length > 0 ? (
                    filteredSongs.map(song => (
                        <AgreementCard 
                            key={song.id} 
                            song={song} 
                            onDownload={handleDownload}
                            onViewDetails={setSelectedSong}
                            onUpdateStatus={(newStatus) => onUpdateSongStatus(song.id, newStatus)}
                            isAdmin={isAdmin}
                            isDownloading={generatingPdfId === song.id}
                            onResubmit={onResubmitAgreement}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400">No agreements found for the current filters.</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="text-center py-16 bg-slate-800/50 rounded-lg">
                <p className="text-slate-400">There are no agreements to display yet.</p>
                <p className="mt-2 text-sm text-slate-500">Register a new song to create the first agreement.</p>
            </div>
        )}
      </div>

      {printingSong && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              <PrintableAgreement ref={printableRef} song={printingSong} />
          </div>
      )}

      {selectedSong && (
          <AgreementDetailModal 
            song={selectedSong}
            onClose={() => setSelectedSong(null)}
            onDownload={handleDownload}
            isDownloading={generatingPdfId === selectedSong.id}
          />
      )}
    </div>
  );
};

export default Agreements;