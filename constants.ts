


import { RegisteredSong, ManagedWriter, User, Earning, Platforms, RevenueSources, PayoutRequest, RoleDefinition, ChatSession, ChatMessage, SyncDeal, DealStatus } from './types';

export const PUBLISHING_AGREEMENT_TEXT = `
EXCLUSIVE PUBLISHING AGREEMENT

This Agreement is made on this day, [DATE], between Sap Media Publishing Ltd ("Publisher") located at 5830 E 2nd St, Ste 7000, 29084 Casper, WY 82609, and the undersigned writer ("Writer").

1. GRANT OF RIGHTS: By agreeing to this contract, Writer irrevocably grants to Publisher the exclusive right to collect all revenue on their behalf for the musical composition(s) (the "Composition") listed herein. This includes 100% of the worldwide copyright and all administration rights.

2. TERM: The term of this agreement shall be for the life of the copyright of the Composition(s) unless terminated earlier by mutual written consent.

3. ROYALTIES: Publisher agrees to pay Writer royalties based on the split percentages defined in the attached song registration. Payments shall be made quarterly within 45 days after the end of each calendar quarter, based on revenue collected.

4. ADMINISTRATION: Publisher shall have the exclusive right to administer and exploit the Composition(s), to print, publish, sell, use and license the performance of the Composition(s) throughout the world, and to collect all income generated.

By signing below, the Writer acknowledges they have read, understood, and agreed to the terms and conditions of this Exclusive Publishing Agreement.
`;

export const WRITER_ROLES = [
  'Composer',
  'Lyricist',
  'Producer',
  'Arranger',
  'Co-writer',
  'Writer',
  'Performer',
];

export const PLATFORMS = [...Platforms];
export const REVENUE_SOURCES = [...RevenueSources];
export const PAYOUT_THRESHOLD = 50; // Minimum withdrawal amount in USD

export const PRO_SOCIETIES = [
    'ACDAM (Cuba – composers)',
    'ACEMLA (Puerto Rico)',
    'ACUM (Israel)',
    'AEPI (Greece)',
    'AGADU (Uruguay)',
    'AIE (Spain – performers)',
    'AIMCO (Indonesia)',
    'AKM (Austria)',
    'AllTrack (USA)',
    'APDAYC (Peru)',
    'APRA (Australia)',
    'APRA (New Zealand)',
    'APRA AMCOS (Australia/NZ)',
    'ARTISJUS (Hungary)',
    'ASCAP (USA)',
    'BMDA (Burundi)',
    'BMI (USA)',
    'BUMA (Netherlands)',
    'BURIDA (Ivory Coast)',
    'CASH (Hong Kong)',
    'COMPASS (Singapore)',
    'COSBOTS (Copyright Society of Botswana)',
    'COSON (Nigeria)',
    'COTT (Trinidad & Tobago)',
    'EAU (Estonia)',
    'ECAD (Brazil)',
    'FILSCAP (Philippines)',
    'GEA-GRAMMO / ERATO-APOLLON (Greece)',
    'GEMA (Germany)',
    'Global Music Rights (USA)',
    'GMR',
    'GRAMEX (Denmark – neighboring rights)',
    'HDS (Croatia)',
    'IMRO (Ireland)',
    'IPRS (India)',
    'JASRAC (Japan)',
    'KAMP (Kenya Association of Music Producers)',
    'KODA (Denmark)',
    'KOMCA / KOSCAP (South Korea)',
    'LATGA-A (Lithuania)',
    'MACP (Malaysia)',
    'MASA (Malaysia)',
    'MASA (Morocco / Maghreb Authors Society for Composers)',
    'MCSC (China)',
    'MCSK (Music Copyright Society of Kenya)',
    'MCT (Thailand)',
    'MRCSN (Nepal)',
    'MUSICAUTOR (Bulgaria)',
    'MUST (Taiwan)',
    'NORMA (Norway – performers/labels)',
    'ONDA (Cuba)',
    'OSA (Czech Republic)',
    'PPL (UK)',
    'PPCA (Australia)',
    'PRISK (Performers Rights Society of Kenya)',
    'Pro Music Rights (USA)',
    'PRS (UK)',
    'RAO (Russia)',
    'Re:Sound (Canada)',
    'SABAM (Belgium)',
    'SACEM (France)',
    'SACM (Mexico)',
    'SACVEN (Venezuela)',
    'SADAIC (Argentina)',
    'SAYCO / ACINPRO (Colombia)',
    'SCD (Chile)',
    'SENAPI (Bolivia)',
    'SESAC (USA)',
    'SGAE (Spain)',
    'SIAE (Italy)',
    'SOCAN (Canada)',
    'SOKOJ (Serbia)',
    'SOUND EXCHANGE (USA – digital performance royalties)',
    'SOZA (Slovakia)',
    'SPAC (Panama)',
    'STIM (Sweden)',
    'SUISA (Switzerland)',
    'Teosto (Finland)',
    'TONO (Norway)',
    'UACRR (Ukraine)',
    'UCMR (Romania)',
    'WAMI (Indonesia)',
    'YPAC (Mongolia)',
    'ZAIKS (Poland)',
    'ZIMURA (Zimbabwe Music Rights Association)',
    'Other'
];

// FIX: Added missing 'email' property to each mock user to align with the User type.
export const mockUsers: User[] = [
    { id: 'user-admin', name: 'Admin', email: 'admin@sapmusicgroup.com', role: 'admin', status: 'active' },
    { id: 'user-alex', name: 'Alex Ray', email: 'alex.ray.music@example.com', role: 'user', status: 'active', payoutMethod: { method: 'paypal', email: 'alex.ray.music@example.com' } },
    { id: 'user-jenna', name: 'Jenna Miles', email: 'jenna.miles@example.com', role: 'user', status: 'active', payoutMethod: { method: 'bank', accountHolderName: 'Jenna R. Miles', bankName: 'Chase Bank', swiftBic: 'CHASUS33', accountNumberIban: '******1234', country: 'United States' } },
    { id: 'user-deactivated', name: 'Old User', email: 'old.user@example.com', role: 'user', status: 'deactivated' },
]


export const mockWriters: ManagedWriter[] = [
    { id: 'mw-1', userId: 'user-alex', name: 'Alex Ray', dob: '1990-05-15', society: 'ASCAP (USA)', ipi: '123456789' },
    { id: 'mw-2', userId: 'user-jenna', name: 'Jenna Miles', dob: '1992-11-20', society: 'BMI (USA)', ipi: '987654321' },
    { id: 'mw-3', userId: 'user-alex', name: 'Chris Voltage', dob: '1985-02-28', society: 'SESAC (USA)', ipi: '112233445' },
    { id: 'mw-4', userId: 'user-admin', name: 'Eithne Pádraigín Ní Bhraonáin', dob: '1961-05-17', society: 'PRS (UK)', ipi: '556677889' },
];


export const mockSongs: RegisteredSong[] = [
    {
        id: 'song-1',
        userId: 'user-alex',
        title: 'Midnight Drive',
        artist: 'The Vindicators',
        artworkUrl: 'https://picsum.photos/seed/midnight/200/200',
        registrationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        writers: [
            { id: 'w1', writerId: 'mw-1', name: 'Alex Ray', role: ['Composer'], split: 50, agreed: true, collectOnBehalf: true, dob: '1990-05-15', society: 'ASCAP (USA)', ipi: '123456789' },
            { id: 'w2', writerId: 'mw-2', name: 'Jenna Miles', role: ['Lyricist'], split: 50, agreed: true, collectOnBehalf: false, dob: '1992-11-20', society: 'BMI (USA)', ipi: '987654321' },
        ],
        signatureData: 'Alex Ray',
        signatureType: 'type',
        status: 'active',
        syncStatus: 'active',
        // FIX: Add missing agreementText property
        agreementText: PUBLISHING_AGREEMENT_TEXT.replace('[DATE]', new Date(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).toLocaleDateString()),
        duration: '3:45',
        isrc: 'USRC17607833',
        upc: '190295879769',
    },
    {
        id: 'song-2',
        userId: 'user-alex',
        title: 'Echoes in the Rain',
        artist: 'Solar Flare',
        artworkUrl: 'https://picsum.photos/seed/echoes/200/200',
        registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        writers: [
             { id: 'w1a', writerId: 'mw-1', name: 'Alex Ray', role: ['Composer', 'Lyricist'], split: 100, agreed: true, collectOnBehalf: true, dob: '1990-05-15', society: 'ASCAP (USA)', ipi: '123456789' },
        ],
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        signatureType: 'draw',
        status: 'active',
        syncStatus: 'pending',
        // FIX: Add missing agreementText property
        agreementText: PUBLISHING_AGREEMENT_TEXT.replace('[DATE]', new Date(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).toLocaleDateString()),
        duration: '4:12',
        isrc: 'USNLR1504568',
    },
    {
        id: 'song-3',
        userId: 'user-jenna',
        title: 'Lost in the Static',
        artist: 'Jenna Miles',
        artworkUrl: 'https://picsum.photos/seed/static/200/200',
        registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        writers: [
            { id: 'w4', name: 'Ed Ma', role: ['Composer'], split: 50, agreed: true, collectOnBehalf: false, dob: '1998-07-10', society: 'BMI (USA)', ipi: '223344556' },
            { id: 'w5', writerId: 'mw-2', name: 'Jenna Miles', role: ['Producer'], split: 50, agreed: true, collectOnBehalf: false, dob: '1992-11-20', society: 'BMI (USA)', ipi: '987654321' },
        ],
        signatureData: 'Jenna Miles',
        signatureType: 'type',
        status: 'pending',
        syncStatus: 'none',
        // FIX: Add missing agreementText property
        agreementText: PUBLISHING_AGREEMENT_TEXT.replace('[DATE]', new Date(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).toLocaleDateString()),
        duration: '2:58',
    },
    {
        id: 'song-4',
        userId: 'user-alex',
        title: 'Ancient Tides',
        artist: 'The Vindicators',
        artworkUrl: 'https://picsum.photos/seed/tides/200/200',
        registrationDate: new Date('2020-01-15').toISOString().split('T')[0],
        writers: [
            // FIX: Added missing ipi property to align with the Writer type.
            { id: 'w6', writerId: 'mw-4', name: 'Eithne Pádraigín Ní Bhraonáin', role: ['Composer', 'Lyricist'], split: 100, agreed: true, collectOnBehalf: false, dob: '1961-05-17', society: 'PRS (UK)', ipi: '556677889' },
        ],
        signatureData: 'Alex Ray',
        signatureType: 'type',
        status: 'expired',
        syncStatus: 'none',
        // FIX: Add missing agreementText property
        agreementText: PUBLISHING_AGREEMENT_TEXT.replace('[DATE]', new Date(new Date('2020-01-15').toISOString().split('T')[0]).toLocaleDateString()),
        duration: '5:01',
    },
];

// FIX: Added missing mock data exports required by App.tsx.
export const mockEarnings: Earning[] = [
    { id: 'earn-1', songId: 'song-1', amount: 120.50, platform: 'spotify', source: 'mechanical', createdAt: '2023-10-15' },
    { id: 'earn-2', songId: 'song-1', amount: 80.25, platform: 'apple_music', source: 'performance', createdAt: '2023-10-20' },
    { id: 'earn-3', songId: 'song-2', amount: 250.00, platform: 'youtube', source: 'sync', createdAt: '2023-11-01' },
    { id: 'earn-4', songId: 'song-3', amount: 45.75, platform: 'spotify', source: 'mechanical', createdAt: '2023-11-05' },
    { id: 'earn-5', songId: 'song-4', amount: 1000.00, platform: 'other', source: 'sync', createdAt: '2023-11-10' },
];

export const mockPayouts: PayoutRequest[] = [
    { id: 'payout-1', userId: 'user-alex', amount: 150, requestDate: '2023-11-01', status: 'paid' },
    { id: 'payout-2', userId: 'user-jenna', amount: 50, requestDate: '2023-11-15', status: 'pending' },
];

export const mockChatSessions: ChatSession[] = [
    { id: 'session-user-alex', userId: 'user-alex', userName: 'Alex Ray', lastMessage: "Okay, thank you for the help!", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isReadByAdmin: false },
    { id: 'session-user-jenna', userId: 'user-jenna', userName: 'Jenna Miles', lastMessage: "Where can I find my latest earnings report?", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isReadByAdmin: true },
];

export const mockChatMessages: ChatMessage[] = [
    { id: 'msg-1', sessionId: 'session-user-alex', senderId: 'user-alex', senderName: 'Alex Ray', text: "Hi, I have a question about my agreement for 'Midnight Drive'.", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 'msg-2', sessionId: 'session-user-alex', senderId: 'gemini-assistant', senderName: 'Support Assistant', text: "Hello Alex! I can help with that. What is your question about 'Midnight Drive'?", timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString() },
    { id: 'msg-3', sessionId: 'session-user-alex', senderId: 'user-alex', senderName: 'Alex Ray', text: "I just wanted to confirm the split percentages are correct.", timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
    { id: 'msg-4', sessionId: 'session-user-alex', senderId: 'gemini-assistant', senderName: 'Support Assistant', text: "I can see the agreement shows a 50/50 split between you and Jenna Miles. Does that look right?", timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
    { id: 'msg-5', sessionId: 'session-user-alex', senderId: 'user-alex', senderName: 'Alex Ray', text: "Yes, that's correct. Thank you!", timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString() },
    { id: 'msg-6', sessionId: 'session-user-alex', senderId: 'gemini-assistant', senderName: 'Support Assistant', text: "You're welcome! Is there anything else I can assist you with?", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { id: 'msg-7', sessionId: 'session-user-jenna', senderId: 'user-jenna', senderName: 'Jenna Miles', text: "Where can I find my latest earnings report?", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

export const mockSyncDeals: SyncDeal[] = [
    { id: 'deal-1', songId: 'song-1', dealType: 'TV Show', licensee: 'Netflix', fee: 5000, terms: "Background music for 'The Crown' Season 8, Episode 3.", status: 'accepted', offerDate: '2023-10-01', expiryDate: '2023-10-15' },
    { id: 'deal-2', songId: 'song-4', dealType: 'Advertisement', licensee: 'Toyota', fee: 20000, terms: "National TV campaign for the new 'Highlander' model.", status: 'offered', offerDate: '2023-11-20', expiryDate: '2023-12-05' },
];

// FIX: Added ROLES export for use in the ManageRoles component.
export const ROLES: RoleDefinition[] = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Has full access to all features, including user management, approvals, and financial data.',
        permissions: {
            canViewAgreements: true,
            canRegisterSongs: true,
            canManageUsers: true,
            canApproveSongs: true,
            canManageEarnings: true,
            canManagePayouts: true,
        },
    },
    {
        id: 'user',
        name: 'User / Writer',
        description: 'Can register songs, view their own agreements, and track their earnings.',
        permissions: {
            canViewAgreements: true,
            canRegisterSongs: true,
            canManageUsers: false,
            canApproveSongs: false,
            canManageEarnings: true,
            canManagePayouts: false, 
        },
    },
];

// FIX: Added COUNTRIES export for use in the ProfileSettings component.
export const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo, Democratic Republic of the', 'Congo, Republic of the', 'Costa Rica', "Cote d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
];
