import React, { useState, useEffect } from 'react';

interface AgreementTemplateProps {
    template: string;
    onSave: (newTemplate: string) => Promise<void>;
}

const AgreementTemplate: React.FC<AgreementTemplateProps> = ({ template, onSave }) => {
    const [text, setText] = useState(template);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        setText(template);
    }, [template]);

    useEffect(() => {
        if (saveSuccess) {
            const timer = setTimeout(() => setSaveSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveSuccess]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(text);
        setIsSaving(false);
        setSaveSuccess(true);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Edit Agreement Template</h1>
            <p className="text-slate-400 max-w-3xl">
                Modify the master publishing agreement template below. This text will be presented to users when they register a new song.
                Use <code className="bg-slate-700 text-amber-300 px-1 py-0.5 rounded-sm text-xs">[DATE]</code> as a placeholder for the registration date.
                Changes saved here will apply to all future agreements.
            </p>
            <div className="bg-slate-800 p-6 rounded-lg">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={20}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md p-4 text-sm text-slate-200 font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
            </div>
            <div className="flex justify-end items-center gap-4">
                {saveSuccess && <p className="text-green-400 text-sm">Template saved successfully!</p>}
                <button
                    onClick={handleSave}
                    disabled={isSaving || text === template}
                    className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default AgreementTemplate;
