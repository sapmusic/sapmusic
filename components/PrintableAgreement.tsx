import React, { forwardRef } from 'react';
import { RegisteredSong } from '../types';
import { LogoIcon } from './icons/LogoIcon';

interface PrintableAgreementProps {
  song: RegisteredSong;
}

const PrintableAgreement = forwardRef<HTMLDivElement, PrintableAgreementProps>(({ song }, ref) => {
  const agreementFullText = song.agreementText;
  const signatureIsDraw = song.signatureType === 'draw' || (!song.signatureType && song.signatureData.startsWith('data:image/'));

  // Using black and dark grays for maximum print contrast.
  return (
    <div ref={ref} className="bg-white text-black font-sans p-12" style={{ width: '210mm' }}>
      <header className="flex items-center justify-between border-b pb-4 border-gray-600">
         <div className="flex items-center gap-3">
            <LogoIcon className="h-10 w-10 text-black" />
            <div>
              <h1 className="text-xl font-bold text-black">Sap Media Publishing Ltd</h1>
              <p className="text-xs text-black">Powered by Sap Media Publishing LLC</p>
            </div>
          </div>
           <div className="text-right text-xs text-gray-800">
              <p>5830 E 2nd St, Ste 7000</p>
              <p>29084 Casper, WY 82609 United States</p>
          </div>
      </header>

      <main className="mt-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-black">Exclusive Publishing Agreement</h2>

        <div className="mb-8 p-4 border border-gray-500 rounded-md">
            <h3 className="text-sm font-bold uppercase text-black mb-2">Composition Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-900">
                <div><span className="font-semibold text-black">Title:</span> {song.title}</div>
                <div><span className="font-semibold text-black">Artist:</span> {song.artist}</div>
                <div><span className="font-semibold text-black">Registration Date:</span> {new Date(song.registrationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div><span className="font-semibold text-black">Status:</span> <span className="font-bold capitalize">{song.status}</span></div>
                {song.duration && <div><span className="font-semibold text-black">Duration:</span> {song.duration}</div>}
                {song.isrc && <div><span className="font-semibold text-black">ISRC:</span> {song.isrc}</div>}
                {song.upc && <div className="col-span-2"><span className="font-semibold text-black">UPC:</span> {song.upc}</div>}
            </div>
        </div>
        
        <div className="mb-8 p-4 border border-gray-500 rounded-md">
            <h3 className="text-sm font-bold uppercase text-black mb-2">Writer Splits</h3>
             <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-600">
                        <th className="text-left py-1 pr-2 font-semibold text-black">Writer Name</th>
                        <th className="text-left py-1 px-2 font-semibold text-black">Role</th>
                        <th className="text-left py-1 px-2 font-semibold text-black">DOB</th>
                        <th className="text-left py-1 px-2 font-semibold text-black">Society</th>
                        <th className="text-left py-1 px-2 font-semibold text-black">IPI</th>
                        <th className="text-right py-1 pl-2 font-semibold text-black">Split %</th>
                    </tr>
                </thead>
                <tbody>
                    {song.writers.map(writer => (
                        <tr key={writer.id} className="border-b border-gray-500 last:border-b-0">
                            <td className="py-1.5 pr-2 text-gray-900">
                                {writer.name}
                                {writer.collectOnBehalf && <span className="text-gray-700 text-[10px] italic"> (Collecting on behalf)</span>}
                            </td>
                            <td className="py-1.5 px-2 text-gray-900">{writer.role.join(', ')}</td>
                            <td className="py-1.5 px-2 text-gray-900">{writer.dob ? new Date(writer.dob).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-1.5 px-2 text-gray-900">{writer.society || 'N/A'}</td>
                            <td className="py-1.5 px-2 text-gray-900">{writer.ipi || 'N/A'}</td>
                            <td className="py-1.5 pl-2 text-right font-semibold text-black">{writer.split}%</td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>


        <div className="text-xs text-black space-y-3 whitespace-pre-wrap font-serif leading-relaxed">
            {agreementFullText}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-600">
            <h3 className="text-sm font-bold uppercase text-black mb-4">Digitally Signed &amp; Agreed</h3>
            <div className="w-full p-4 border border-dashed border-gray-600 rounded-md min-h-[120px] flex items-center justify-start bg-gray-100">
                {signatureIsDraw ? (
                    <img src={song.signatureData} alt="Signature" className="h-20" />
                ) : (
                    <p className="font-signature text-5xl text-amber-500">{song.signatureData}</p>
                )}
            </div>
             <div className="mt-4 p-4 border border-gray-500 rounded-lg text-xs text-black bg-gray-50">
                <h4 className="font-semibold text-black mb-3 text-sm border-b border-gray-500 pb-2">Agreement Attestation</h4>
                <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                    <strong className="text-black">Signing Date & Time:</strong>
                    <span className="text-gray-900">{new Date(song.registrationDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    
                </div>
                <p className="text-gray-800 mt-3 pt-3 border-t border-gray-500 text-[11px]">
                    This signature, along with the individual writer agreements captured during registration, constitutes a legally binding agreement.
                </p>
            </div>
        </div>
      </main>
    </div>
  );
});

export default PrintableAgreement;