import React from 'react';
import { RegisteredSong, Writer, AgreementStatus } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { XIcon } from './icons/XIcon';

interface AgreementDetailModalProps {
  song: RegisteredSong;
  onClose: () => void;
  onDownload: (song: RegisteredSong) => void;
  isDownloading: boolean;
}

const STATUS_DESCRIPTIONS: Record<AgreementStatus, string> = {
    active: 'This agreement is currently in effect.',
    pending: 'This agreement is awaiting admin approval.',
    expired: 'This agreement is no longer in effect.',
    rejected: 'This submission has been rejected.',
};

const StatusBadge: React.FC<{ status: AgreementStatus }> = ({ status }) => {
    const baseClasses = 'text-sm font-bold py-1 px-3 rounded-full capitalize';
    const styles: Record<AgreementStatus, string> = {
        active: 'bg-green-500/20 text-green-300',
        pending: 'bg-yellow-500/20 text-yellow-300',
        expired: 'bg-red-500/20 text-red-400',
        rejected: 'bg-slate-500/20 text-slate-300',
    };
    return <span className={`${baseClasses} ${styles[status]}`} title={STATUS_DESCRIPTIONS[status]}>{status}</span>
};


const AgreementDetailModal: React.FC<AgreementDetailModalProps> = ({ song, onClose, onDownload, isDownloading }) => {
  const agreementFullText = song.agreementText;
  const signatureIsDraw = song.signatureType === 'draw' || (!song.signatureType && song.signatureData.startsWith('data:image/'));

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-slate-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Agreement Details</h2>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                <XIcon className="w-6 h-6" />
            </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex gap-6 p-4 bg-slate-900/50 rounded-lg items-center">
                <img src={song.artworkUrl} alt={song.title} className="h-28 w-28 rounded-md object-cover flex-shrink-0"/>
                <div className="flex-grow">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-3xl font-bold text-white">{song.title}</p>
                            <p className="text-xl text-slate-300">{song.artist}</p>
                        </div>
                        <StatusBadge status={song.status} />
                    </div>
                    <p className="text-sm text-slate-400 mt-2">Registered on: {new Date(song.registrationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="mt-2 flex items-center flex-wrap gap-2 text-xs text-slate-300 font-mono">
                      {song.duration && <span className="bg-slate-700 px-2 py-1 rounded">Duration: {song.duration}</span>}
                      {song.isrc && <span className="bg-slate-700 px-2 py-1 rounded">ISRC: {song.isrc}</span>}
                      {song.upc && <span className="bg-slate-700 px-2 py-1 rounded">UPC: {song.upc}</span>}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="font-semibold text-amber-400 mb-2">Writer Splits</h3>
                <div className="space-y-2">
                    {song.writers.map((writer: Writer) => (
                        <div key={writer.id} className="flex justify-between items-center text-sm bg-slate-800/50 p-2 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-200">{writer.name}</p>
                                <p className="text-xs text-slate-400">
                                    {writer.role.join(', ')}
                                    {writer.society && ` • ${writer.society}`}
                                    {writer.dob && ` • Born ${new Date(writer.dob).toLocaleDateString()}`}
                                    {writer.ipi && ` • IPI: ${writer.ipi}`}
                                    {writer.collectOnBehalf && <span className="text-amber-400 font-bold"> &bull; Collecting on behalf</span>}
                                </p>
                            </div>
                            <p className="text-lg font-bold text-white">{writer.split}%</p>
                        </div>
                    ))}
                </div>
            </div>
            
             <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="font-semibold text-amber-400 mb-2">Publishing Agreement</h3>
                <div className="w-full h-40 bg-slate-800/50 border border-slate-600 rounded-md p-3 text-xs text-slate-300 font-mono overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{agreementFullText}</pre>
                </div>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="font-semibold text-amber-400 mb-3">Digitally Signed &amp; Agreed</h3>
                <div className="w-full flex items-center justify-center p-4 bg-slate-800/50 border border-dashed border-slate-600 rounded-md">
                    {signatureIsDraw ? (
                        <img src={song.signatureData} alt="Signature" className="h-20" />
                    ) : (
                        <p className="font-signature text-5xl text-amber-400">{song.signatureData}</p>
                    )}
                </div>
            </div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800/50">
            <button
                onClick={onClose}
                className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
            >
                Close
            </button>
            <button
                onClick={() => onDownload(song)}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isDownloading ? 'Generating...' : (
                    <>
                        <DownloadIcon className="w-5 h-5" />
                        Download PDF
                    </>
                )}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AgreementDetailModal;