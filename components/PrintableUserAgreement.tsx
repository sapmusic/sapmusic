
import React, { forwardRef } from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface PrintableUserAgreementProps {
  userName: string;
  signupDate: string;
  agreementText: string;
}

const PrintableUserAgreement = forwardRef<HTMLDivElement, PrintableUserAgreementProps>(({ userName, signupDate, agreementText }, ref) => {
  const agreementFullText = agreementText.replace('[DATE]', new Date(signupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

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
        
        <div className="text-xs text-black space-y-3 whitespace-pre-wrap font-serif leading-relaxed">
            {agreementFullText}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-600">
            <h3 className="text-sm font-bold uppercase text-black mb-4">Digitally Signed &amp; Agreed</h3>
             <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                <strong className="text-black">Writer:</strong>
                <span className="text-gray-900 border-b border-gray-400 font-signature text-xl">{userName}</span>

                <strong className="text-black">Date of Agreement:</strong>
                <span className="text-gray-900 border-b border-gray-400">{new Date(signupDate).toLocaleString('en-US', { dateStyle: 'long' })}</span>
            </div>
             <p className="text-gray-800 mt-6 text-[11px]">
                This document was automatically generated upon account creation and serves as a legally binding agreement between the writer and Sap Media Publishing Ltd. By creating an account, the writer acknowledges they have read, understood, and agreed to these terms.
            </p>
        </div>
      </main>
    </div>
  );
});

export default PrintableUserAgreement;
