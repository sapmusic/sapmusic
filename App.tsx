

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import SongRegistration from './components/SongRegistration';
import Agreements from './components/Agreements';
import Writers from './components/Writers';
import { RegisteredSong, ManagedWriter, User, Earning, PayoutRequest, PayoutStatus, AgreementStatus, ChatSession, ChatMessage, SyncDeal, DealStatus, SyncStatus, PayPalDetails, BankDetails, Role } from './types';
import { mockWriters, mockUsers, mockEarnings, mockPayouts, mockSyncDeals, PUBLISHING_AGREEMENT_TEXT } from './constants';
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [syncDeals, setSyncDeals] = useState<SyncDeal[]>(mockSyncDeals);
  const [viewingSong, setViewingSong] = useState<RegisteredSong | null>(null);
  const [agreementTemplate, setAgreementTemplate] = useState<string>(PUBLISHING_AGREEMENT_TEXT);
  const [isAgreementTemplateFeatureEnabled, setIsAgreementTemplateFeatureEnabled] = useState(true);
  const [isChatFeatureEnabled, setIsChatFeatureEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            const [writersResult, songsResult, chatSessionsResult] = await Promise.all([
                supabase.from('managed_writers').select('id, user_id, name, dob, society, ipi:ipi_cae'),
                supabase.from('songs').select(SONG_SELECT_QUERY),
                supabase.from('chat_sessions').select('*') // RLS filters this for the current user or admin
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

            if (chatSessionsResult.error) {
                if (chatSessionsResult.error.message?.includes("Could not find the table 'public.chat_sessions'")) {
                    console.warn("Chat feature disabled: 'chat_sessions' table not found. This is expected if the chat schema has not been run.");
                    setIsChatFeatureEnabled(false);
                    setChatSessions([]);
                    setChatMessages([]);
                } else {
                    console.error("Error fetching chat sessions:", JSON.stringify(chatSessionsResult.error, null, 2));
                }
            } else if (chatSessionsResult.data && isChatFeatureEnabled) {
                const fetchedSessions = keysToCamel(chatSessionsResult.data).sort((a: ChatSession, b: ChatSession) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setChatSessions(fetchedSessions);

                const sessionIds = fetchedSessions.map((s: ChatSession) => s.id);
                if (sessionIds.length > 0) {
                    const { data: messagesData, error: messagesError } = await supabase
                        .from('chat_messages')
                        .select('*')
                        .in('session_id', sessionIds)
                        .order('timestamp', { ascending: true });
                    if(messagesError) console.error("Error fetching chat messages:", messagesError);
                    else if (messagesData) setChatMessages(keysToCamel(messagesData));
                }
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

                    // Admin: Fetch the complete, merged user list from the edge function.
                    try {
                        const { data: allUsersData, error: allUsersError } = await supabase.functions.invoke('get-all-users');

                        if (allUsersError) {
                            console.error("CRITICAL: Admin could not fetch the user list:", allUsersError.message);
                            setUsers([]); // Show an empty list on critical error.
                        } else if (allUsersData && allUsersData.users) {
                            // The edge function returns a merged list of auth users and profiles.
                            // We process it here to match the client-side User type.
                            const finalUsers = allUsersData.users.map((rawUser: any) => {
                                if (rawUser.hasProfile) {
                                    // This user has a full profile from the `users` table.
                                    return reconstructUser(keysToCamel(rawUser));
                                } else {
                                    // This user only exists in `auth.users`, so the object is already shaped correctly.
                                    return rawUser;
                                }
                            });
                            setUsers(finalUsers);
                        } else {
                            // No error, but no data.
                            setUsers([]);
                        }
                    } catch (e: any) {
                        console.error("FATAL: Error invoking 'get-all-users' function:", e.message);
                        setUsers([]);
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
            setChatMessages([]);
            setChatSessions([]);
        }
    };
    fetchUserData();
  }, [session]);

  useEffect(() => {
    if (!currentUser || !isChatFeatureEnabled) return;

    const handleNewMessage = (payload: any) => {
        const newMessage = keysToCamel(payload.new) as ChatMessage;
        setChatMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
        });
    };

    const handleSessionChange = (payload: any) => {
        const newSession = keysToCamel(payload.new) as ChatSession;
        setChatSessions(prev => {
            const existing = prev.find(s => s.id === newSession.id);
            const otherSessions = prev.filter(s => s.id !== newSession.id);
            
            return [newSession, ...otherSessions].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
    };

    const messagesSubscription = supabase.channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, handleNewMessage)
      .subscribe();

    const sessionsSubscription = supabase.channel('chat_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, handleSessionChange)
      .subscribe();

    return () => {
        supabase.removeChannel(messagesSubscription);
        supabase.removeChannel(sessionsSubscription);
    };
}, [currentUser, isChatFeatureEnabled]);


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


  const handleAdminSendMessage = async (text: string, sessionId: string, senderId: string) => {
    const now = new Date().toISOString();
    const adminUser = users.find(u => u.id === senderId && u.role === 'admin') || currentUser;
    if (!adminUser) return;
      
    // 1. Insert the new message
    const { error: messageError } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender_id: adminUser.id,
        sender_name: adminUser.name,
        text,
        timestamp: now,
    });
    if (messageError) console.error("Error sending admin message:", messageError);

    // 2. Update the session's last message and timestamp, and mark as read
    const { error: sessionError } = await supabase.from('chat_sessions').update({
        last_message: text,
        timestamp: now,
        is_read_by_admin: true,
    }).eq('id', sessionId);
    if(sessionError) console.error("Error updating session from admin:", sessionError);
  };
  
  const handleUserSendMessage = async (text: string, user: User) => {
      const sessionId = `session-${user.id}`;
      const now = new Date().toISOString();

      // Upsert session (creates if not exists, updates if it does)
      const { error: sessionError } = await supabase.from('chat_sessions').upsert({
          id: sessionId,
          user_id: user.id,
          user_name: user.name,
          last_message: text,
          timestamp: now,
          is_read_by_admin: false,
      });
      if (sessionError) console.error("Error upserting session:", sessionError);

      // Insert message
      const { error: messageError } = await supabase.from('chat_messages').insert({
          session_id: sessionId,
          sender_id: user.id,
          sender_name: user.name,
          text: text,
          timestamp: now,
      });
      if (messageError) console.error("Error sending message:", messageError);
  };
  
  const markSessionAsRead = async (sessionId: string) => {
      const { error } = await supabase
          .from('chat_sessions')
          .update({ is_read_by_admin: true })
          .eq('id', sessionId);
      if (error) console.error("Error marking session as read:", error);
      else {
          setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isReadByAdmin: true } : s));
      }
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
          return currentUser.role === 'admin' && isChatFeatureEnabled
              ? <LiveSupport sessions={chatSessions} messages={chatMessages} users={users} onSendMessage={handleAdminSendMessage} onSessionSelect={markSessionAsRead} />
              : <div className="p-8 text-slate-400">Access Denied. This feature may not be enabled on your instance.</div>;
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
    <div className="relative h-screen bg-slate-900 text-slate-100 flex overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          userRole={currentUser.role} 
          onLogout={handleLogout} 
          isAgreementEditorEnabled={isAgreementTemplateFeatureEnabled}
          isChatEnabled={isChatFeatureEnabled}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onRegisterNew={() => setCurrentView('new-song')} onToggleSidebar={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-800/50">
            {renderView()}
          </main>
        </div>

       {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" />}

       {currentUser && currentUser.role === 'user' && isChatFeatureEnabled && <Chatbot 
          currentUser={currentUser}
          session={chatSessions.find(s => s.userId === currentUser.id)}
          messages={chatMessages.filter(m => m.sessionId === `session-${currentUser.id}`)}
          onSendMessage={handleUserSendMessage}
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