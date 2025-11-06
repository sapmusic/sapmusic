
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import SongRegistration from './components/SongRegistration';
import Agreements from './components/Agreements';
import Writers from './components/Writers';
import { RegisteredSong, ManagedWriter, User, Earning, PayoutRequest, PayoutStatus, AgreementStatus, ChatSession, ChatMessage, SyncDeal, DealStatus, SyncStatus, PayPalDetails, BankDetails, Role } from './types';
import { mockWriters, mockUsers, mockEarnings, mockPayouts, mockChatSessions, mockChatMessages, mockSyncDeals, PUBLISHING_AGREEMENT_TEXT } from './constants';
import ManageEarnings from './components/ManageEarnings';
import UserManagement from './components/UserManagement';
import ProfileSettings from './components/ProfileSettings';
import UserEarnings from './components/UserEarnings';
import ManagePayouts from './components/ManagePayouts';
import ManageRoles from './components/ManageRoles';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import AdminApproval from './components/AdminApproval';
import LiveSupport from './components/LiveSupport';
import { getChatbotResponse } from './services/geminiService';
import SyncLicensing from './components/SyncLicensing';
import SongDetailModal from './components/SongDetailModal';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import AgreementTemplate from './components/AgreementTemplate';


type View = 'dashboard' | 'new-song' | 'agreements' | 'writers' | 'user-management' | 'earnings' | 'settings' | 'profile' | 'manager-roles' | 'payouts' | 'approval' | 'live-support' | 'sync-licensing' | 'agreement-template';

// Helper to convert snake_case keys from Supabase to camelCase
const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('_', ''));
const keysToCamel = (o: any): any => {
    if (Array.isArray(o)) {
        return o.map(v => keysToCamel(v));
    } else if (o !== null && typeof o === 'object') {
        return Object.keys(o).reduce((acc, key) => {
            acc[toCamel(key)] = keysToCamel(o[key]);
            return acc;
        }, {} as any);
    }
    return o;
};

// Helper to reconstruct a User object from a flat Supabase response
const reconstructUser = (rawUser: any): User => {
    const user: User = {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        role: rawUser.role,
        status: rawUser.status,
        hasProfile: true, // Mark that this user has a profile in the database
    };
    if (rawUser.payoutType === 'paypal' && rawUser.paypalEmail) {
        user.payoutMethod = {
            method: 'paypal',
            email: rawUser.paypalEmail
        };
    } else if (rawUser.payoutType === 'bank') {
        user.payoutMethod = {
            method: 'bank',
            accountHolderName: rawUser.accountHolderName,
            bankName: rawUser.bankName,
            swiftBic: rawUser.swiftBic,
            accountNumberIban: rawUser.accountNumberIban,
            country: rawUser.country,
        };
    }
    return user;
};

// Consistent query for fetching song data
// FIX: Removed `agreement_text` to prevent crashes if the column doesn't exist in the database.
// The app will now inject this data on the client-side.
const SONG_SELECT_QUERY = `
    id,
    user_id,
    title,
    artist:main_artist,
    artwork_url,
    registration_date,
    writers:writers_data,
    signature_data,
    sync_status,
    duration,
    isrc,
    upc,
    status
`;


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [songs, setSongs] = useState<RegisteredSong[]>([]);
  const [managedWriters, setManagedWriters] = useState<ManagedWriter[]>([]);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>(mockEarnings);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(mockPayouts);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(mockChatSessions);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [syncDeals, setSyncDeals] = useState<SyncDeal[]>(mockSyncDeals);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [viewingSong, setViewingSong] = useState<RegisteredSong | null>(null);
  const [agreementTemplate, setAgreementTemplate] = useState<string>(PUBLISHING_AGREEMENT_TEXT);
  const [isAgreementTemplateFeatureEnabled, setIsAgreementTemplateFeatureEnabled] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
        if (session) {
            // Fetch agreement template first, and check if the feature is enabled.
            let currentAgreementTemplate = PUBLISHING_AGREEMENT_TEXT;
            const { data: settingsData, error: settingsError } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'publishing_agreement_text')
                .single();
            
            if (settingsError) {
                if (settingsError.code === '42P01') {
                    // This is expected if the table doesn't exist. Disable the feature silently.
                    setIsAgreementTemplateFeatureEnabled(false);
                } else {
                    // For any other error, warn the admin and disable the feature.
                    console.warn("Could not fetch agreement template, using default. Error:", settingsError.message);
                    setIsAgreementTemplateFeatureEnabled(false);
                }
            } else if (settingsData) {
                currentAgreementTemplate = settingsData.value;
                setAgreementTemplate(settingsData.value);
                setIsAgreementTemplateFeatureEnabled(true);
            } else {
                // Table exists but is empty, which is a valid state.
                setIsAgreementTemplateFeatureEnabled(true);
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            // Fetch all data in parallel. RLS handles filtering based on user role.
            const [writersResult, songsResult] = await Promise.all([
                supabase.from('managed_writers').select('id, user_id, name, dob, society, ipi:ipi_cae'),
                supabase.from('songs').select(SONG_SELECT_QUERY)
            ]);
            
            if (writersResult.error) {
                console.error("Error fetching managed writers:", writersResult.error);
            } else if (writersResult.data) {
                setManagedWriters(keysToCamel(writersResult.data));
            }

            if (songsResult.error) {
                console.error("Error fetching songs:", songsResult.error.message, songsResult.error);
            } else if (songsResult.data) {
                // FIX: Map over fetched songs and inject the agreement text from the current template.
                // This ensures the rest of the app functions correctly without relying on the database column.
                const songsData = (keysToCamel(songsResult.data) as Omit<RegisteredSong, 'agreementText'>[]).map(song => ({
                    ...song,
                    agreementText: currentAgreementTemplate.replace('[DATE]', new Date(song.registrationDate).toLocaleDateString())
                }));
                setSongs(songsData.sort((a: RegisteredSong, b: RegisteredSong) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()));
            }


            if (error) {
                console.error("Error fetching user profile:", error.message, error);
                if (error.code === 'PGRST116') { // No rows found
                     console.warn("No user profile found for authenticated user. This can happen for accounts created before the database trigger was set up. Please sign out and sign up again, or contact support.");
                } else if (error.code === '42P01') { // Table does not exist
                     console.error("FATAL: The 'users' table was not found. Please ensure you have run the schema script located in `supabase/schema.sql` in your Supabase project's SQL Editor.");
                }
                await supabase.auth.signOut();
            } else if (data) {
                const profile = reconstructUser(keysToCamel(data));
                
                // Link live user to their corresponding data context
                if (profile.role === 'admin') {
                    setCurrentUser({ ...mockUsers.find(u => u.role === 'admin')!, ...profile });

                    // Fetch both profiles and auth users in parallel for efficiency and resilience.
                    const [profilesResult, authUsersResult] = await Promise.all([
                        supabase.from('users').select('*'),
                        supabase.functions.invoke('get-all-users')
                    ]);

                    let profilesMap = new Map<string, User>();
                    if (profilesResult.error) {
                        console.error("Admin could not fetch user profiles:", profilesResult.error.message);
                        // Proceed with an empty map; auth users will be the source of truth.
                    } else if (profilesResult.data) {
                        const profiles = (keysToCamel(profilesResult.data) as any[]).map(reconstructUser);
                        profilesMap = new Map<string, User>(profiles.map(p => [p.id, p]));
                    }

                    if (authUsersResult.error) {
                        console.error("CRITICAL: Admin could not fetch auth users:", authUsersResult.error.message);
                        // As a fallback, show only the profiles that were successfully fetched.
                        setUsers(Array.from(profilesMap.values()));
                    } else if (authUsersResult.data.users) {
                        const authUsers = authUsersResult.data.users;
                        const allSystemUsers: User[] = authUsers.map((authUser: any) => {
                            if (profilesMap.has(authUser.id)) {
                                // Profile exists: merge data, using auth email as source of truth.
                                return { ...profilesMap.get(authUser.id)!, email: authUser.email };
                            } else {
                                // No profile: create a placeholder user object.
                                return {
                                    id: authUser.id,
                                    name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                                    email: authUser.email,
                                    role: 'user',
                                    status: 'active',
                                    hasProfile: false,
                                };
                            }
                        });
                        setUsers(allSystemUsers);
                    } else {
                        // Function succeeded but returned no users; this is unlikely but possible.
                        // Fall back to showing profiles.
                        setUsers(Array.from(profilesMap.values()));
                    }
                } else {
                     // For regular users, link to mock data if they are a demo user, otherwise just use their profile
                     if (session.user.email === 'bookharrison2000@gmail.com') {
                         setCurrentUser({ ...mockUsers.find(u => u.id === 'user-alex')!, ...profile });
                     } else {
                        setCurrentUser(profile); // New user with no mock data linked
                     }
                }

            }
        } else {
            setCurrentUser(null);
            setCurrentView('dashboard');
            setManagedWriters([]);
            setSongs([]);
        }
    };
    fetchUserData();
  }, [session]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const addSong = async (song: RegisteredSong): Promise<{ success: boolean; error?: any }> => {
    // FIX: Removed `agreement_text` from the payload to prevent insertion errors on databases with an older schema.
    const payload = {
        user_id: song.userId,
        title: song.title,
        main_artist: song.artist,
        artwork_url: song.artworkUrl,
        registration_date: song.registrationDate,
        writers_data: song.writers,
        signature_data: song.signatureData,
        sync_status: song.syncStatus,
        duration: song.duration || null,
        isrc: song.isrc || null,
        upc: song.upc || null,
        status: song.status,
    };
    
    const { data, error } = await supabase.from('songs').insert([payload]).select(SONG_SELECT_QUERY).single();

    if (error) {
        console.error("Error registering song:", JSON.stringify(error, null, 2));
        return { success: false, error: error };
    } else if (data) {
        // FIX: Merge the original song object (which has the correct signed agreement text for this session)
        // with the data returned from the DB (which has the new server-generated ID).
        const dbSongData = keysToCamel(data);
        const newSong: RegisteredSong = {
            ...song,
            ...dbSongData,
        };
        setSongs(prevSongs => [newSong, ...prevSongs]);
        return { success: true };
    }
    return { success: false, error: 'An unknown error occurred during song registration.' };
  };
  
  const updateSongStatus = async (songId: string, status: AgreementStatus) => {
    const { data, error } = await supabase
      .from('songs')
      .update({ status: status })
      .eq('id', songId)
      .select(SONG_SELECT_QUERY)
      .single();

    if (error) {
        console.error("Error updating song status:", error);
    } else if (data) {
        // FIX: Manually inject agreement text into the updated song object using the current template.
        const fetchedSongData = keysToCamel(data);
        const finalUpdatedSong: RegisteredSong = {
            ...fetchedSongData,
            agreementText: agreementTemplate.replace('[DATE]', new Date(fetchedSongData.registrationDate).toLocaleDateString())
        };
        setSongs(songs.map(s => (s.id === songId ? finalUpdatedSong : s)));

        const songOwner = users.find(u => u.id === finalUpdatedSong.userId);
        
        if (songOwner && songOwner.email) {
            try {
                const { error: functionError } = await supabase.functions.invoke('send-email', {
                    body: {
                        userEmail: songOwner.email,
                        userName: songOwner.name,
                        songTitle: finalUpdatedSong.title,
                        newStatus: finalUpdatedSong.status,
                    },
                });
                if (functionError) {
                    console.error('Error invoking send-email function:', functionError);
                }
            } catch (e) {
                console.error('Failed to invoke email function:', e);
            }
        }
    }
  };

  const resubmitAgreement = async (songId: string) => {
    const songToResubmit = songs.find(s => s.id === songId);
    if (!songToResubmit) {
        console.error("Song to resubmit not found");
        return;
    }

    const { data, error } = await supabase
      .from('songs')
      .update({ status: 'pending' })
      .eq('id', songId)
      .select(SONG_SELECT_QUERY)
      .single();

    if (error) {
        console.error("Error resubmitting song:", error);
        return;
    }
    
    if (data) {
        // FIX: Manually inject agreement text into the updated song object.
        const fetchedSongData = keysToCamel(data);
        const updatedSong: RegisteredSong = {
            ...fetchedSongData,
            agreementText: agreementTemplate.replace('[DATE]', new Date(fetchedSongData.registrationDate).toLocaleDateString())
        };
        setSongs(songs.map(s => (s.id === songId ? updatedSong : s)));

        const admin = users.find(u => u.role === 'admin');
        const user = users.find(u => u.id === updatedSong.userId);

        if (admin && user && admin.email) {
            try {
                const { error: functionError } = await supabase.functions.invoke('send-email', {
                    body: {
                        userEmail: admin.email,
                        userName: admin.name,
                        songTitle: `"${updatedSong.title}" by ${user.name}`,
                        newStatus: 'pending_admin_notification',
                    },
                });
                if (functionError) {
                    console.error('Error invoking send-email function for admin:', functionError);
                }
            } catch (e) {
                console.error('Failed to invoke email function for admin:', e);
            }
        }
    }
  };

  const updateSongSyncStatus = async (songId: string, syncStatus: SyncStatus) => {
    const { data, error } = await supabase
      .from('songs')
      .update({ sync_status: syncStatus })
      .eq('id', songId)
      .select(SONG_SELECT_QUERY)
      .single();

    if (error) {
        console.error("Error updating song sync status:", error);
    } else if (data) {
        // FIX: Manually inject agreement text into the updated song object.
        const fetchedSongData = keysToCamel(data);
        const updatedSong: RegisteredSong = {
            ...fetchedSongData,
            agreementText: agreementTemplate.replace('[DATE]', new Date(fetchedSongData.registrationDate).toLocaleDateString())
        };
        setSongs(songs.map(s => (s.id === songId ? updatedSong : s)));
    }
  };
  
  const toggleUserStatus = async (userId: string) => {
     const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    const newStatus = userToToggle.status === 'active' ? 'deactivated' : 'active';
    const { data, error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating user status:", error);
    } else if (data) {
        setUsers(users.map(u => u.id === userId ? reconstructUser(keysToCamel(data)) : u));
    }
  };

  const updateUserRole = async (userId: string, role: Role) => {
      if (currentUser?.id === userId || currentUser?.role !== 'admin') {
          console.warn("Permission denied: Cannot change own role or not an admin.");
          return;
      }
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating user role:", error);
    } else if (data) {
        setUsers(users.map(u => u.id === userId ? reconstructUser(keysToCamel(data)) : u));
    }
  };
  
  const addManagedWriter = async (writer: Omit<ManagedWriter, 'id' | 'userId'>): Promise<ManagedWriter | null> => {
    if (!currentUser) return null;

    const { data, error } = await supabase
        .from('managed_writers')
        .insert([{
            user_id: currentUser.id,
            name: writer.name,
            dob: writer.dob,
            society: writer.society,
            ipi_cae: writer.ipi,
        }])
        .select('id, user_id, name, dob, society, ipi:ipi_cae')
        .single();
    
    if (error) {
        console.error("Error adding managed writer:", error.message, error);
        return null;
    }

    if (data) {
        const newWriter = keysToCamel(data) as ManagedWriter;
        setManagedWriters(prev => [newWriter, ...prev]);
        return newWriter;
    }

    return null;
  };

  const addEarning = (earning: Omit<Earning, 'id'>) => {
    const newEarning: Earning = {
        id: `earn-${Date.now()}`,
        ...earning
    };
    setEarnings(prev => [newEarning, ...prev]);
  };
  
  const updateUser = async (updatedUser: User) => {
    const updatePayload: { [key: string]: any } = {
        name: updatedUser.name,
    };
    
    if (updatedUser.payoutMethod?.method === 'paypal') {
        const paypalDetails = updatedUser.payoutMethod as PayPalDetails;
        updatePayload.payout_type = 'paypal';
        updatePayload.paypal_email = paypalDetails.email;
        // Set bank fields to null to clear them
        updatePayload.account_holder_name = null;
        updatePayload.bank_name = null;
        updatePayload.swift_bic = null;
        updatePayload.account_number_iban = null;
        updatePayload.country = null;
    } else if (updatedUser.payoutMethod?.method === 'bank') {
        const bankDetails = updatedUser.payoutMethod as BankDetails;
        updatePayload.payout_type = 'bank';
        updatePayload.account_holder_name = bankDetails.accountHolderName;
        updatePayload.bank_name = bankDetails.bankName;
        updatePayload.swift_bic = bankDetails.swiftBic;
        updatePayload.account_number_iban = bankDetails.accountNumberIban;
        updatePayload.country = bankDetails.country;
        // Set paypal field to null
        updatePayload.paypal_email = null;
    } else {
        // Case where payoutMethod is removed or undefined
        updatePayload.payout_type = null;
        updatePayload.paypal_email = null;
        updatePayload.account_holder_name = null;
        updatePayload.bank_name = null;
        updatePayload.swift_bic = null;
        updatePayload.account_number_iban = null;
        updatePayload.country = null;
    }

     const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', updatedUser.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
    } else if (data) {
      const updatedProfile = reconstructUser(keysToCamel(data));
      setCurrentUser(prev => ({...prev, ...updatedProfile}));
      setUsers(users.map(u => u.id === updatedUser.id ? updatedProfile : u));
    }
  }

  const addPayoutRequest = (request: Omit<PayoutRequest, 'id' | 'status'>) => {
      const newRequest: PayoutRequest = {
          id: `payout-${Date.now()}`,
          status: 'pending',
          ...request,
      };
      setPayoutRequests(prev => [newRequest, ...prev]);
  };

  const updatePayoutStatus = (payoutId: string, status: PayoutStatus) => {
      setPayoutRequests(payoutRequests.map(p => p.id === payoutId ? { ...p, status } : p));
  };

  const createSyncDeal = (deal: Omit<SyncDeal, 'id' | 'status' | 'offerDate'>) => {
    const newDeal: SyncDeal = {
        id: `deal-${Date.now()}`,
        status: 'offered',
        offerDate: new Date().toISOString().split('T')[0],
        ...deal,
    };
    setSyncDeals(prev => [newDeal, ...prev]);
  };

  const updateSyncDealStatus = (dealId: string, status: DealStatus) => {
      setSyncDeals(syncDeals.map(d => d.id === dealId ? { ...d, status } : d));
  };

    const updateAgreementTemplate = async (newText: string) => {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'publishing_agreement_text', value: newText });

        if (error) {
            console.error("Error updating agreement template:", error);
        } else {
            setAgreementTemplate(newText);
        }
    };


  const handleAdminSendMessage = (text: string, sessionId: string, senderId: string) => {
      const sender = users.find(u => u.id === senderId) || { id: 'admin', name: 'Admin' };
      
      const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sessionId,
          senderId,
          senderName: sender.name,
          text,
          timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, newMessage]);

      setChatSessions(prev => prev.map(session => 
          session.id === sessionId 
          ? { 
              ...session, 
              lastMessage: text, 
              timestamp: newMessage.timestamp,
              isReadByAdmin: true
            }
          : session
      ));
  };
  
  const handleUserSendMessage = async (text: string, user: User) => {
      const sessionId = `session-${user.id}`;
      const sessionExists = chatSessions.some(s => s.id === sessionId);

      const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sessionId,
          senderId: user.id,
          senderName: user.name,
          text,
          timestamp: new Date().toISOString(),
      };

      if (!sessionExists) {
          const newSession: ChatSession = {
              id: sessionId,
              userId: user.id,
              userName: user.name,
              lastMessage: text,
              timestamp: newMessage.timestamp,
              isReadByAdmin: false,
          };
          setChatSessions(prev => [newSession, ...prev.filter(s => s.id !== sessionId)]);
      } else {
            setChatSessions(prev => prev.map(session => 
              session.id === sessionId 
              ? { ...session, lastMessage: text, timestamp: newMessage.timestamp, isReadByAdmin: false }
              : session
          ));
      }
      
      setChatMessages(prev => [...prev, newMessage]);

      // Gemini bot response logic
      setIsBotTyping(true);
      try {
          const response = await getChatbotResponse(text);

          const botMessage: ChatMessage = {
              id: `msg-${Date.now()}-bot`,
              sessionId,
              senderId: 'gemini-assistant',
              senderName: 'Support Assistant',
              text: response.text,
              groundingChunks: response.groundingChunks,
              timestamp: new Date().toISOString(),
          };
          setChatMessages(prev => [...prev, botMessage]);

          setChatSessions(prev => prev.map(session => 
              session.id === sessionId 
              ? { ...session, lastMessage: response.text, timestamp: botMessage.timestamp, isReadByAdmin: false }
              : session
          ));

      } catch (error) {
          console.error("Error getting chatbot response:", error);
          const errorMessage: ChatMessage = {
              id: `msg-${Date.now()}-error`,
              sessionId,
              senderId: 'gemini-assistant',
              senderName: 'Support Assistant',
              text: "I'm having trouble connecting right now. An admin has been notified.",
              timestamp: new Date().toISOString(),
          };
          setChatMessages(prev => [...prev, errorMessage]);
      } finally {
          setIsBotTyping(false);
      }
  };
  
  const markSessionAsRead = (sessionId: string) => {
      setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isReadByAdmin: true } : s));
  };


  const renderView = () => {
    if (!currentUser) return null; // Should not happen if currentUser is checked before calling
    
    const userSongs = songs.filter(song => song.userId === currentUser.id);

    switch (currentView) {
      case 'dashboard':
        return currentUser.role === 'admin' 
          ? <AdminDashboard songs={songs} onRegisterNew={() => setCurrentView('new-song')} onViewSongDetails={setViewingSong} />
          : <UserDashboard songs={userSongs} earnings={earnings} currentUser={currentUser} onRegisterNew={() => setCurrentView('new-song')} syncDeals={syncDeals} onUpdateDealStatus={updateSyncDealStatus} onViewSongDetails={setViewingSong} />;
      case 'new-song':
        return <SongRegistration onRegistrationComplete={addSong} managedWriters={managedWriters} currentUser={currentUser} onAddManagedWriter={addManagedWriter} onRegistrationSuccess={() => setCurrentView('dashboard')} agreementTemplate={agreementTemplate} />;
      case 'agreements':
        return currentUser.role === 'admin'
          ? <Agreements songs={songs} onUpdateSongStatus={updateSongStatus} isAdmin={true} />
          : <Agreements songs={userSongs} onUpdateSongStatus={async () => {}} isAdmin={false} onResubmitAgreement={resubmitAgreement} />;
      case 'writers':
          return <Writers writers={managedWriters} onAddWriter={addManagedWriter} />;
      case 'user-management':
          return currentUser.role === 'admin' 
            ? <UserManagement users={users} onToggleStatus={toggleUserStatus} currentUser={currentUser} onUpdateRole={updateUserRole} />
            : <div className="p-8 text-slate-400">Access Denied.</div>;
      case 'earnings':
          if(currentUser.role === 'admin') {
            return <ManageEarnings songs={songs} earnings={earnings} onAddEarning={addEarning} />;
          } else {
            return <UserEarnings songs={userSongs} earnings={earnings} currentUser={currentUser} payoutRequests={payoutRequests.filter(p => p.userId === currentUser.id)} onPayoutRequest={addPayoutRequest} />;
          }
      case 'payouts':
          return currentUser.role === 'admin'
              ? <ManagePayouts requests={payoutRequests} users={users} onUpdateStatus={updatePayoutStatus} />
              : <div className="p-8 text-slate-400">Access Denied.</div>;
      case 'approval':
          return currentUser.role === 'admin'
              ? <AdminApproval songs={songs} users={users} onUpdateStatus={updateSongStatus} />
              : <div className="p-8 text-slate-400">Access Denied.</div>;
       case 'live-support':
          return currentUser.role === 'admin'
              ? <LiveSupport sessions={chatSessions} messages={chatMessages} users={users} onSendMessage={handleAdminSendMessage} onSessionSelect={markSessionAsRead} />
              : <div className="p-8 text-slate-400">Access Denied.</div>;
      case 'sync-licensing':
          return currentUser.role === 'admin'
              ? <SyncLicensing songs={songs} deals={syncDeals} onUpdateSongSyncStatus={updateSongSyncStatus} onCreateDeal={createSyncDeal} />
              : <div className="p-8 text-slate-400">Access Denied.</div>;
      case 'agreement-template':
        return currentUser.role === 'admin' && isAgreementTemplateFeatureEnabled
            ? <AgreementTemplate template={agreementTemplate} onSave={updateAgreementTemplate} />
            : <div className="p-8 text-slate-400">Access Denied. This feature may not be enabled on your instance.</div>;
      case 'profile':
        return <ProfileSettings user={currentUser} onUpdateUser={updateUser} />
      case 'manager-roles':
        return currentUser.role === 'admin'
            ? <ManageRoles />
            : <div className="p-8 text-slate-400">Access Denied.</div>;
      default:
        return <div className="p-8 text-slate-400">View for '{currentView}' is not yet implemented.</div>;
    }
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          userRole={currentUser.role} 
          onLogout={handleLogout} 
          isAgreementEditorEnabled={isAgreementTemplateFeatureEnabled}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onRegisterNew={() => setCurrentView('new-song')} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-800/50">
            {renderView()}
          </main>
        </div>
      </div>
       {currentUser && currentUser.role === 'user' && <Chatbot 
          currentUser={currentUser}
          session={chatSessions.find(s => s.userId === currentUser.id)}
          messages={chatMessages.filter(m => m.sessionId === `session-${currentUser.id}`)}
          onSendMessage={handleUserSendMessage}
          isTyping={isBotTyping}
      />}
       {viewingSong && (
            <SongDetailModal
                song={viewingSong}
                earningsForSong={earnings.filter(e => e.songId === viewingSong.id)}
                dealsForSong={syncDeals.filter(d => d.songId === viewingSong.id)}
                onClose={() => setViewingSong(null)}
            />
        )}
    </div>
  );
};

export default App;