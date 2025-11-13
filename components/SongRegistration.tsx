


import React, { useState, useCallback } from 'react';
import { summarizeAgreement } from '../services/geminiService';
import { Writer, RegisteredSong, ManagedWriter, User } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { AddIcon } from './icons/AddIcon';
import WriterSplitInput from './WriterSplitInput';
import SignaturePad from './SignaturePad';
import SelectWriterModal from './SelectWriterModal';
import { UserSearchIcon } from './icons/UserSearchIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface SongData {
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    duration: string;
    isrc: string;
    upc: string;
}

interface SongDataErrors {
    title?: string;
    artist?: string;
    artworkUrl?: string;
    duration?: string;
    isrc?: string;
    upc?: string;
}

interface WriterErrors {
    name?: string;
    role?: string;
    dob?: string;
    society?: string;
    ipi?: string;
}

interface FormErrors {
    songData: SongDataErrors;
    writers: Record<string, WriterErrors>;
    global: {
        splitTotal?: string;
        allWritersAgreed?: string;
        signature?: string;
        agreement?: string;
    }
}

const InputError: React.FC<{ message?: string; }> = ({ message }) => {
    if (!message) return null;
    return (
        <div className={`flex items-start gap-1 text-xs mt-1 text-red-400`}>
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <pre className="whitespace-pre-wrap font-sans">{message}</pre>
        </div>
    );
};


interface SongRegistrationProps {
  onRegistrationComplete: (song: RegisteredSong) => Promise<{ success: boolean; error?: any }>;
  managedWriters: ManagedWriter[];
  currentUser: User;
  onAddManagedWriter: (writer: Omit<ManagedWriter, 'id' | 'userId'>) => Promise<ManagedWriter | null>;
  onRegistrationSuccess: () => void;
  agreementTemplate: string;
}

// FIX: Extracted validation logic into a pure function for synchronous use on submit.
const getFieldError = (
    fieldName: keyof SongData | keyof WriterErrors,
    value: any,
): string => {
    let error = '';
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    const durationRegex = /^\d{1,2}:\d{2}$/;
    const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i;
    const upcRegex = /^\d{12,13}$/;
    const ipiRegex = /^\d{9}$/;

    switch (fieldName) {
        // Song Data Validation
        case 'title':
        case 'artist':
            if (!value.trim()) error = 'This field is required.';
            break;
        case 'artworkUrl':
            if (value && !urlRegex.test(value)) error = 'Please enter a valid URL.';
            break;
        case 'duration':
            if (value && !durationRegex.test(value)) error = 'Format must be mm:ss.';
            break;
        case 'isrc':
            if (value && !isrcRegex.test(value)) error = 'Invalid ISRC format.';
            break;
        case 'upc':
            if (value && !upcRegex.test(value)) error = 'UPC must be 12-13 digits.';
            break;
        // Writer Validation
        case 'name':
            if (!value.trim()) error = 'Writer name is required.';
            break;
        case 'role':
            if (!Array.isArray(value) || value.length === 0) error = 'At least one role is required.';
            break;
        case 'dob':
            if (!value) {
                error = 'Date of birth is required.';
            } else if (new Date(value) >= new Date()) {
                error = 'Date of birth must be in the past.';
            }
            break;
        case 'society':
            if (!value) error = 'Society is required.';
            break;
        case 'ipi':
            // IPI is often optional on forms, but we require it for saving managed writers.
            // Let's treat it as required for full validation.
            if (!value) {
                error = 'IPI number is required.';
            } else if (!ipiRegex.test(value)) {
                error = 'IPI must be 9 digits.';
            }
            break;
    }
    return error;
};

const SongRegistration: React.FC<SongRegistrationProps> = ({ onRegistrationComplete, managedWriters, currentUser, onAddManagedWriter, onRegistrationSuccess, agreementTemplate }) => {
  const [songData, setSongData] = useState<SongData>({
    title: '', artist: '', album: '', artworkUrl: '', duration: '', isrc: '', upc: '',
  });
  const [step, setStep] = useState(1);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [registrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [agreementText, setAgreementText] = useState(agreementTemplate.replace('[DATE]', new Date(registrationDate).toLocaleDateString()));
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [submitForSync, setSubmitForSync] = useState(false);
  
  const [isUpdateWriterModalOpen, setIsUpdateWriterModalOpen] = useState(false);
  const [isAddFromLibraryModalOpen, setIsAddFromLibraryModalOpen] = useState(false);
  const [writerToUpdate, setWriterToUpdate] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({ songData: {}, writers: {}, global: {} });
  const [touched, setTouched] = useState({
      songData: {} as Record<keyof SongData, boolean>,
      writers: {} as Record<string, Record<keyof WriterErrors, boolean>>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((
    fieldName: keyof SongData | keyof WriterErrors,
    value: any,
    writerId?: string
  ) => {
    const error = getFieldError(fieldName, value);
    if (writerId) {
        setErrors(prev => ({
            ...prev,
            writers: {
                ...prev.writers,
                [writerId]: { ...prev.writers[writerId], [fieldName]: error || undefined }
            }
        }));
    } else {
        setErrors(prev => ({
            ...prev,
            songData: { ...prev.songData, [fieldName as keyof SongData]: error || undefined }
        }));
    }
  }, []);

  const handleSongDataChange = (field: keyof SongData, value: string) => {
    setSongData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSongDataBlur = (field: keyof SongData) => {
    setTouched(prev => ({ ...prev, songData: { ...prev.songData, [field]: true } }));
    validateField(field, songData[field]);
  };
  
  const handleWriterChange = (updatedWriter: Writer) => {
    const otherWritersSplit = writers.reduce((acc, writer) => (writer.id !== updatedWriter.id ? acc + writer.split : acc), 0);
    const clampedSplit = Math.max(0, Math.min(updatedWriter.split, 100 - otherWritersSplit));
    const finalWriter = { ...updatedWriter, split: clampedSplit };
    
    setWriters(writers.map(w => w.id === finalWriter.id ? finalWriter : w));
    
    // Live validation for changed fields
    Object.keys(finalWriter).forEach(keyStr => {
      const key = keyStr as keyof WriterErrors;
      if (['name', 'role', 'dob', 'society', 'ipi'].includes(key)) {
        validateField(key, finalWriter[key as keyof Writer], finalWriter.id);
      }
    });
  };

  const handleWriterBlur = (writerId: string, field: keyof WriterErrors) => {
    setTouched(prev => ({
        ...prev,
        writers: { ...prev.writers, [writerId]: { ...prev.writers[writerId], [field]: true } }
    }));
    const writer = writers.find(w => w.id === writerId);
    if (writer) {
        validateField(field, (writer as any)[field], writerId);
    }
  };

  const handleProceedToStep2 = () => {
    let hasErrors = false;
    const newErrors: SongDataErrors = {};
    const newTouched: Partial<Record<keyof SongData, boolean>> = {};

    (Object.keys(songData) as Array<keyof SongData>).forEach(key => {
        const error = getFieldError(key, songData[key]);
        if (error) {
            newErrors[key] = error;
            hasErrors = true;
        }
        newTouched[key] = true;
    });

    setErrors(prev => ({ ...prev, songData: newErrors }));
    setTouched(prev => ({ ...prev, songData: newTouched as any }));

    if (!hasErrors) {
        setStep(2);
        if (writers.length === 0) {
            setWriters([{ id: `writer-${Date.now()}-0`, name: '', role: [], split: 100, agreed: false, collectOnBehalf: false, dob: '', society: '', ipi: '' }]);
        }
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(await summarizeAgreement(agreementText));
    setIsSummarizing(false);
  };
  
  const handleAddWriterManually = () => {
      setWriters([...writers, { id: `writer-${Date.now()}-${writers.length}`, name: '', role: [], split: 0, agreed: false, collectOnBehalf: false, dob: '', society: '', ipi: '' }]);
  }
  
  const handleRemoveWriter = (writerId: string) => {
      setWriters(writers.filter(w => w.id !== writerId));
      setErrors(prev => {
        const newWriterErrors = { ...prev.writers };
        delete newWriterErrors[writerId];
        return { ...prev, writers: newWriterErrors };
      });
  }
  
  const handleOpenUpdateWriterModal = (writerId: string) => {
      setWriterToUpdate(writerId);
      setIsUpdateWriterModalOpen(true);
  }

  const handleSelectWriterToUpdate = (selectedWriter: ManagedWriter) => {
      if (writerToUpdate) {
          setWriters(writers.map(w => w.id === writerToUpdate ? {
              ...w, writerId: selectedWriter.id, name: selectedWriter.name, dob: selectedWriter.dob, society: selectedWriter.society, ipi: selectedWriter.ipi,
          } : w));
      }
      setIsUpdateWriterModalOpen(false);
      setWriterToUpdate(null);
  };

  const handleAddWriterFromLibrary = (selectedWriter: ManagedWriter) => {
    const newWriter: Writer = {
        id: `writer-${Date.now()}`, writerId: selectedWriter.id, name: selectedWriter.name, role: [], split: 0, agreed: false, collectOnBehalf: false, dob: selectedWriter.dob, society: selectedWriter.society, ipi: selectedWriter.ipi,
    };
    setWriters(prevWriters => [...prevWriters, newWriter]);
    setIsAddFromLibraryModalOpen(false);
  };
  
  const handleSubmit = async () => {
      const newErrors: FormErrors = { songData: {}, writers: {}, global: {} };
      let isFormValid = true;

      // Validate song data
      (Object.keys(songData) as Array<keyof SongData>).forEach(key => {
        const error = getFieldError(key, songData[key]);
        if (error) {
            newErrors.songData[key] = error;
            isFormValid = false;
        }
      });
      
      // Validate writers
      writers.forEach(writer => {
        const writerErrors: WriterErrors = {};
        (Object.keys({name: '', role: [], dob: '', society: '', ipi: ''}) as Array<keyof WriterErrors>).forEach(key => {
            const error = getFieldError(key, (writer as any)[key]);
            if (error) {
                writerErrors[key] = error;
                isFormValid = false;
            }
        });
        if (Object.keys(writerErrors).length > 0) {
            newErrors.writers[writer.id] = writerErrors;
        }
      });

      // Validate global conditions
      if (writers.reduce((acc, w) => acc + w.split, 0) !== 100) {
          newErrors.global.splitTotal = 'Total split must equal 100%.';
          isFormValid = false;
      }
      if (writers.length === 0 || !writers.every(w => w.agreed)) {
          newErrors.global.allWritersAgreed = 'All writers must agree to their split.';
          isFormValid = false;
      }
      if (!signatureData) {
          newErrors.global.signature = 'A signature is required to complete the agreement.';
          isFormValid = false;
      }
      if (!hasAgreed) {
          newErrors.global.agreement = 'You must agree to the terms.';
          isFormValid = false;
      }
      
      setErrors(newErrors);

      // Touch all fields to show errors
      const newTouched: any = { songData: {}, writers: {} };
      (Object.keys(songData) as Array<keyof SongData>).forEach(key => { newTouched.songData[key] = true; });
      writers.forEach(writer => {
        newTouched.writers[writer.id] = {};
        (Object.keys({name: '', role: [], dob: '', society: '', ipi: ''}) as Array<keyof WriterErrors>).forEach(key => {
            newTouched.writers[writer.id][key] = true;
        });
      });
      setTouched(newTouched);

      if (!isFormValid) return;

      setIsSubmitting(true);
      
      // FIX: Refactored writer saving logic to be a functional map, avoiding mutation
      // during iteration and resolving a potential race condition.
      const writersToSubmit = await Promise.all(writers.map(async (writer) => {
          // A writer is new if they don't have a writerId and have all required fields.
          if (!writer.writerId && writer.name && writer.dob && writer.society && writer.ipi) {
              const newManagedWriter = await onAddManagedWriter({
                  name: writer.name,
                  dob: writer.dob,
                  society: writer.society,
                  ipi: writer.ipi,
              });
              if (newManagedWriter) {
                  // Return a new writer object with the ID from the database
                  return { ...writer, writerId: newManagedWriter.id };
              }
          }
          // If not a new writer, or if saving failed, return the original writer object
          return writer;
      }));

      const newSong: RegisteredSong = {
          id: `song-${Date.now()}`,
          userId: currentUser.id,
          title: songData.title,
          artist: songData.artist,
          artworkUrl: songData.artworkUrl || `https://picsum.photos/seed/${songData.title}/200/200`,
          registrationDate,
          writers: writersToSubmit,
          signatureData,
          signatureType,
          status: 'pending',
          syncStatus: submitForSync ? 'pending' : 'none',
          agreementText: agreementText,
          duration: songData.duration,
          isrc: songData.isrc,
          upc: songData.upc,
      };
      
      const { success, error } = await onRegistrationComplete(newSong);
      setIsSubmitting(false);

      if (success) {
          setStep(3); // Go to success screen
      } else {
            let errorMessage = 'An unexpected submission error occurred. Please try again.';
            if (error && typeof error === 'object' && 'message' in error) {
                const dbError = error as { message: string, details?: string, hint?: string, code?: string };
                
                // Friendly message for specific, known errors
                if (dbError.message.includes('songs_duration_format_chk')) {
                    errorMessage = "Submission failed: The 'Duration' format is invalid. Please use mm:ss (e.g., 03:45) or leave it blank.";
                } 
                // Add more else-if blocks here for other known errors in the future
                else {
                    // Generic but more detailed error for unknown issues
                    let formattedMessage = `Submission failed with a database error:\n`;
                    formattedMessage += `\nMessage: ${dbError.message}`;
                    if (dbError.details) formattedMessage += `\nDetails: ${dbError.details}`;
                    if (dbError.hint) formattedMessage += `\nHint: ${dbError.hint}`;
                    if (dbError.code) formattedMessage += `\nCode: ${dbError.code}`;
                    errorMessage = formattedMessage;
                }
            } else if (error) {
                // Fallback for non-database-object errors
                errorMessage = `Submission failed: ${error.toString()}`;
            }

            setErrors(prev => ({
                ...prev,
                global: {
                    ...prev.global,
                    agreement: errorMessage,
                }
            }));
      }
  }

  const getFieldStatusClasses = (isTouched: boolean, error?: string) => {
    if (!isTouched) return 'border-slate-600';
    return error ? 'border-red-500' : 'border-green-500';
  };
  
  const renderStep1 = () => (
     <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2"><span className="font-bold text-slate-400 text-3xl">1</span>Enter Song Details</h2>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm text-slate-300 block mb-1">Song Title *</label>
                    <input type="text" value={songData.title} onChange={e => handleSongDataChange('title', e.target.value)} onBlur={() => handleSongDataBlur('title')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.title, errors.songData.title)}`} />
                    <InputError message={touched.songData.title ? errors.songData.title : ''} />
                </div>
                 <div>
                    <label className="text-sm text-slate-300 block mb-1">Main Artist *</label>
                    <input type="text" value={songData.artist} onChange={e => handleSongDataChange('artist', e.target.value)} onBlur={() => handleSongDataBlur('artist')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.artist, errors.songData.artist)}`} />
                    <InputError message={touched.songData.artist ? errors.songData.artist : ''} />
                </div>
            </div>
             <div>
                <label className="text-sm text-slate-300 block mb-1">Album / Release Title</label>
                <input type="text" value={songData.album} onChange={e => handleSongDataChange('album', e.target.value)} onBlur={() => handleSongDataBlur('album')} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2" />
            </div>
            <div>
                <label className="text-sm text-slate-300 block mb-1">Spotify URL (Optional)</label>
                <input type="text" value={songData.artworkUrl} onChange={e => handleSongDataChange('artworkUrl', e.target.value)} onBlur={() => handleSongDataBlur('artworkUrl')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.artworkUrl, errors.songData.artworkUrl)}`} placeholder="https://open.spotify.com/track/..." />
                 <InputError message={touched.songData.artworkUrl ? errors.songData.artworkUrl : ''} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-sm text-slate-300 block mb-1">Duration (mm:ss)</label>
                    <input type="text" value={songData.duration} onChange={e => handleSongDataChange('duration', e.target.value)} onBlur={() => handleSongDataBlur('duration')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.duration, errors.songData.duration)}`} placeholder="e.g. 3:45" />
                    <InputError message={touched.songData.duration ? errors.songData.duration : ''} />
                </div>
                <div>
                    <label className="text-sm text-slate-300 block mb-1">ISRC (Optional)</label>
                    <input type="text" value={songData.isrc} onChange={e => handleSongDataChange('isrc', e.target.value)} onBlur={() => handleSongDataBlur('isrc')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.isrc, errors.songData.isrc)}`} />
                    <InputError message={touched.songData.isrc ? errors.songData.isrc : ''} />
                </div>
                <div>
                    <label className="text-sm text-slate-300 block mb-1">UPC (Optional)</label>
                    <input type="text" value={songData.upc} onChange={e => handleSongDataChange('upc', e.target.value)} onBlur={() => handleSongDataBlur('upc')} className={`w-full bg-slate-700 border rounded-md px-3 py-2 ${getFieldStatusClasses(touched.songData.upc, errors.songData.upc)}`} />
                    <InputError message={touched.songData.upc ? errors.songData.upc : ''} />
                </div>
            </div>
             <div className="flex justify-end pt-4">
                <button
                    onClick={handleProceedToStep2}
                    className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-md hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Confirm Details & Proceed
                </button>
            </div>
        </div>
    </div>
  );

  const renderSuccessScreen = () => (
    <div className="bg-slate-800 p-8 rounded-lg text-center flex flex-col items-center">
        <CheckCircleIcon className="h-16 w-16 text-green-400" />
        <h2 className="text-2xl font-bold text-white mt-4">Submission Successful!</h2>
        <p className="text-slate-400 mt-2 max-w-md">
            Your song registration for "<span className="font-semibold text-slate-300">{songData.title}</span>" has been received and is now pending review by our team.
        </p>
        <div className="mt-6 flex gap-4">
            <button
                onClick={onRegistrationSuccess}
                className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-md hover:bg-amber-400"
            >
                Return to Dashboard
            </button>
        </div>
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <h1 className="text-3xl font-bold text-white">Register a New Song</h1>

      {step === 1 && renderStep1()}
      
      {step === 2 && (
        <>
          <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-800 rounded-lg items-center text-center md:text-left border-b-4 border-green-500">
              <img src={songData.artworkUrl || `https://picsum.photos/seed/${songData.title}/200/200`} alt={songData.title} className="h-32 w-32 rounded-lg object-cover shadow-lg flex-shrink-0 bg-slate-700"/>
              <div className="flex-grow">
                  <p className="text-sm font-bold text-green-400">SONG DETAILS CONFIRMED</p>
                  <p className="text-4xl font-bold text-white tracking-tight mt-1">{songData.title}</p>
                  <p className="text-xl text-slate-300 mt-1">{songData.artist}</p>
                  {songData.album && <p className="text-md text-slate-400">{songData.album}</p>}
              </div>
              <button onClick={() => setStep(1)} className="bg-slate-700 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors duration-200 mt-4 md:mt-0">
                  Edit Details
              </button>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2"><span className="font-bold text-slate-400 text-3xl">2</span>Define Writer Splits</h2>
            <div className="space-y-3">
              {writers.map(writer => (
                <WriterSplitInput 
                    key={writer.id} 
                    writer={writer} 
                    onChange={handleWriterChange} 
                    onRemove={handleRemoveWriter}
                    onFindWriter={handleOpenUpdateWriterModal}
                    isEditable={true}
                    errors={errors.writers[writer.id]}
                    touched={touched.writers[writer.id]}
                    onBlur={handleWriterBlur}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
                <button 
                    onClick={() => setIsAddFromLibraryModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors duration-200"
                >
                    <UserSearchIcon className="h-5 w-5" />
                    Add Writer from Library
                </button>
                <button 
                    onClick={handleAddWriterManually} 
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-sm"
                >
                    <AddIcon className="h-5 w-5" />
                    Add Manually
                </button>
            </div>
             <div className={`mt-4 text-right font-bold ${writers.reduce((acc, w) => acc + w.split, 0) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                Total Split: {writers.reduce((acc, w) => acc + w.split, 0)}%
            </div>
            <InputError message={errors.global.splitTotal} />
            <InputError message={errors.global.allWritersAgreed} />
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
             <h2 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2"><span className="font-bold text-slate-400 text-3xl">3</span>Publishing Agreement</h2>
             <div className="mb-4">
                <label className="text-xs text-slate-400 block mb-1">Registration Date</label>
                <input type="date" value={registrationDate} readOnly className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-300"/>
            </div>
            <textarea
                readOnly
                value={agreementText}
                className="w-full h-48 bg-slate-700/50 border border-slate-600 rounded-md p-4 text-sm text-slate-300 font-mono"
            />
            <button onClick={handleSummarize} disabled={isSummarizing} className="mt-4 flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-slate-600 transition-colors">
                <SparklesIcon className="h-5 w-5" />
                {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
            </button>
            {summary && (
                <div className="mt-4 p-4 bg-indigo-900/30 border-l-4 border-indigo-400 rounded-r-lg">
                    <h3 className="font-bold text-indigo-300">AI-Generated Summary</h3>
                    <div className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{summary}</div>
                </div>
            )}
          </div>
          
           <div className="bg-slate-800 p-6 rounded-lg">
             <h2 className="text-xl font-semibold mb-4 text-amber-400 flex items-center gap-2"><span className="font-bold text-slate-400 text-3xl">4</span>Sign &amp; Complete Registration</h2>
            <SignaturePad 
              onSignatureChange={(data, type) => {
                setSignatureData(data);
                setSignatureType(type);
              }} 
            />
            <InputError message={errors.global.signature} />
            
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <label htmlFor="sync-submit" className="flex items-start cursor-pointer">
                    <input 
                        id="sync-submit"
                        type="checkbox" 
                        checked={submitForSync}
                        onChange={(e) => setSubmitForSync(e.target.checked)}
                        className="h-5 w-5 mt-0.5 bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-400 rounded"
                    />
                    <div className="ml-3">
                        <span className="font-semibold text-slate-200">Submit for Sync Licensing</span>
                        <p className="text-sm text-slate-400">
                            Check this box to submit this song for consideration in our sync licensing catalog for opportunities in film, TV, ads, and games.
                        </p>
                    </div>
                </label>
            </div>


            <div className="mt-6 flex items-start">
                <input 
                    id="agree-terms"
                    type="checkbox" 
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="h-5 w-5 mt-0.5 bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-400 rounded"
                />
                <label htmlFor="agree-terms" className="ml-3 text-sm text-slate-300">
                    By checking this box, I confirm that I am authorized to sign on behalf of all listed writers and agree that this digital signature constitutes a legally binding agreement for this song registration under the terms of the Sap Media Publishing Agreement. Each writer's "I Agree" click serves as their individual consent to their specified split.
                </label>
            </div>
             <InputError message={errors.global.agreement} />
          </div>
          
          <div className="flex justify-end">
            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-amber-500 text-slate-900 font-bold text-lg py-3 px-10 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-wait transition-all"
            >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </>
      )}

      {step === 3 && renderSuccessScreen()}

      {isUpdateWriterModalOpen && (
        <SelectWriterModal
            writers={managedWriters}
            onSelect={handleSelectWriterToUpdate}
            onClose={() => setIsUpdateWriterModalOpen(false)}
        />
      )}

      {isAddFromLibraryModalOpen && (
        <SelectWriterModal
            writers={managedWriters}
            onSelect={handleAddWriterFromLibrary}
            onClose={() => setIsAddFromLibraryModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SongRegistration;