// Curated YouTube Blocklists, Keyword Filters, and Focus Packs for Intentional YT
// Generates valid base64url setup codes compatible with Intentional YT /setup#s= decoder.

function encodeSetup(name, settings) {
  const payload = {
    v: 1,
    name: name.slice(0, 50),
    created: 1731670000000,
    settings
  }
  const jsonStr = JSON.stringify(payload)
  if (typeof btoa === 'function') {
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(jsonStr, 'utf8').toString('base64url')
  }
  return ''
}

const RAW_PACKS = [
  {
    id: 'brainrot-drama-purge',
    name: 'Brainrot & Drama Channel Purge (75+ Channels)',
    category: 'channels',
    categoryLabel: 'CHANNEL BLOCKLIST',
    badgeColor: '#ef4444',
    icon: '🚫',
    guideUrl: '/tools/youtube-drama-blocklist',
    description: 'A comprehensive blocklist of 75+ commentary channels, ragebait creators, low-effort reaction streamers, and content mills across search and feeds.',
    channels: [
      '@DramaAlert', '@Keemstar', '@TMZ', '@TheShadeRoom', '@SpillSesh',
      '@NickiSwift', '@PerezHilton', '@TeaSpill', '@PopCulture', '@GossipBae',
      '@ReactionTime', '@HollywoodLife', '@DefNoodles', '@SloanBella', '@KiannaNaomi',
      '@SunnyV2', '@Moon-Real', '@InternetAnarchist', '@ApertureThinking', '@PatrickCc',
      '@MagnatesMedia', '@MoreSidemen', '@BillionaireLifestyles', '@IShowSpeed', '@AdinLive',
      '@KaiCenat', '@xQcOW', '@Sssniperwolf', '@SSSniperWolfClips', '@Sneako',
      '@FreshandFit', '@Neon', '@HasanAbiClips', '@MizkifClips', '@AsmongoldClips',
      '@ValkyraeClips', '@SpeedLive', '@AdinRossHighlights', '@DharMann', '@BrentRivera',
      '@BenAzelart', '@StokesTwins', '@StevenHe', '@TsurikiShow', '@SmilesFamily',
      '@LankyBox', '@LankyBoxWorld', '@CollinsKey', '@CraftySlimeCreator', '@MrBeast2',
      '@BeastReacts', '@AlanChikinChow', '@TopperGuild', '@Airrack', '@ZackDFilms',
      '@MasterGoo', '@WatchMojo', '@MsMojo', '@DailyMail', '@TheSun',
      '@BuzzFeedVideo', '@TroomTroom', '@5MinuteCrafts', '@123GO', '@BrightSide',
      '@ActuallyHappen', '@Truly', '@BoredPanda', '@LADbibleTV', '@UNILAD',
      '@VT', '@JungleBeat', '@Wengie', '@Cocomelon', '@RyanWorld',
      '@VladandNiki', '@DianaandRoma', '@KidsDianaShow', '@LikeNastya', '@BabyBus'
    ],
    keywords: [],
    rules: [
      '78 Channel blocklist active',
      'Hide Shorts shelves',
      'Redirect Shorts to regular player',
      'Neutral thumbnails (anti-clickbait)',
      'Hide mix & radio playlists'
    ],
    settings: {
      blockShorts: true,
      redirectShorts: true,
      neutralThumbnails: true,
      blockMixPlaylists: true,
      channelBlocklist: [
        '@DramaAlert', '@Keemstar', '@TMZ', '@TheShadeRoom', '@SpillSesh',
        '@NickiSwift', '@PerezHilton', '@TeaSpill', '@PopCulture', '@GossipBae',
        '@ReactionTime', '@HollywoodLife', '@DefNoodles', '@SloanBella', '@KiannaNaomi',
        '@SunnyV2', '@Moon-Real', '@InternetAnarchist', '@ApertureThinking', '@PatrickCc',
        '@MagnatesMedia', '@MoreSidemen', '@BillionaireLifestyles', '@IShowSpeed', '@AdinLive',
        '@KaiCenat', '@xQcOW', '@Sssniperwolf', '@SSSniperWolfClips', '@Sneako',
        '@FreshandFit', '@Neon', '@HasanAbiClips', '@MizkifClips', '@AsmongoldClips',
        '@ValkyraeClips', '@SpeedLive', '@AdinRossHighlights', '@DharMann', '@BrentRivera',
        '@BenAzelart', '@StokesTwins', '@StevenHe', '@TsurikiShow', '@SmilesFamily',
        '@LankyBox', '@LankyBoxWorld', '@CollinsKey', '@CraftySlimeCreator', '@MrBeast2',
        '@BeastReacts', '@AlanChikinChow', '@TopperGuild', '@Airrack', '@ZackDFilms',
        '@MasterGoo', '@WatchMojo', '@MsMojo', '@DailyMail', '@TheSun',
        '@BuzzFeedVideo', '@TroomTroom', '@5MinuteCrafts', '@123GO', '@BrightSide',
        '@ActuallyHappen', '@Truly', '@BoredPanda', '@LADbibleTV', '@UNILAD',
        '@VT', '@JungleBeat', '@Wengie', '@Cocomelon', '@RyanWorld',
        '@VladandNiki', '@DianaandRoma', '@KidsDianaShow', '@LikeNastya', '@BabyBus'
      ]
    }
  },
  {
    id: 'clickbait-ragebait-cleanser',
    name: 'Clickbait & Ragebait Keyword Filter (60+ Keywords)',
    category: 'keywords',
    categoryLabel: 'KEYWORD FILTER',
    badgeColor: '#f97316',
    icon: '✂️',
    guideUrl: '/tools/youtube-clickbait-keywords',
    description: 'A robust list of 60+ psychological curiosity hooks, screaming ALL-CAPS triggers, and manufactured emergency phrases.',
    channels: [],
    keywords: [
      'OMG', 'YOU WONT BELIEVE', 'YOU WON\'T BELIEVE', 'EXPOSED', 'GONE WRONG',
      'CANT MAKE THIS UP', 'CAN\'T MAKE THIS UP', '3AM', 'SHOCKING', 'MUST WATCH',
      'PRANK', 'SHE DID WHAT', 'HE DID WHAT', 'CAUGHT ON CAMERA', 'NEVER DO THIS',
      'I REGRET THIS', 'WATCH BEFORE ITS DELETED', 'WATCH BEFORE IT\'S DELETED',
      'RUINED MY LIFE', 'COPS CALLED', 'IN REAL LIFE', 'TRY NOT TO LAUGH',
      'EMOTIONAL', 'SECRET REVEALED', 'END OF AN ERA', 'WE BROKE UP', 'CHEATING ON',
      'LEAVING FOREVER', 'INSANE', 'UNBELIEVABLE', 'DONT WATCH THIS', 'DON\'T WATCH THIS',
      'WORST MISTAKE', 'I ALMOST DIED', 'HE CONFRONTED ME', 'THE TRUTH ABOUT',
      'APOLOGY VIDEO', 'WE NEED TO TALK', 'FINALLY REVEALED', 'GONE TOO FAR',
      'POLICE INVOLVED', 'BANNED FROM', 'KICKED OUT', 'I SPENT 24 HOURS',
      'SURVIVING 100 DAYS', 'I GAVE AWAY', 'LAST TO LEAVE', 'DESTROYED',
      'CAUGHT IN 4K', 'LOST EVERYTHING', 'NO ONE IS TALKING ABOUT', 'BIGGEST MISTAKE',
      'WHY I QUIT', 'MY FINAL MESSAGE', 'IM SORRY', 'I\'M SORRY', 'CANCELLED',
      'DRAMA EXPLAINED', 'WHAT REALLY HAPPENED', 'HE ADMITTED IT', 'SHE ADMITTED IT'
    ],
    rules: [
      '61 Title keyword filters active',
      'Neutral mid-video thumbnails',
      'Convert ALL-CAPS titles to sentence case',
      'Hide Shorts shelves',
      'Filter irrelevant search shelves'
    ],
    settings: {
      neutralThumbnails: true,
      blockShorts: true,
      blockIrrelevantSearchResults: true,
      keywordBlocklist: [
        'OMG', 'YOU WONT BELIEVE', 'YOU WON\'T BELIEVE', 'EXPOSED', 'GONE WRONG',
        'CANT MAKE THIS UP', 'CAN\'T MAKE THIS UP', '3AM', 'SHOCKING', 'MUST WATCH',
        'PRANK', 'SHE DID WHAT', 'HE DID WHAT', 'CAUGHT ON CAMERA', 'NEVER DO THIS',
        'I REGRET THIS', 'WATCH BEFORE ITS DELETED', 'WATCH BEFORE IT\'S DELETED',
        'RUINED MY LIFE', 'COPS CALLED', 'IN REAL LIFE', 'TRY NOT TO LAUGH',
        'EMOTIONAL', 'SECRET REVEALED', 'END OF AN ERA', 'WE BROKE UP', 'CHEATING ON',
        'LEAVING FOREVER', 'INSANE', 'UNBELIEVABLE', 'DONT WATCH THIS', 'DON\'T WATCH THIS',
        'WORST MISTAKE', 'I ALMOST DIED', 'HE CONFRONTED ME', 'THE TRUTH ABOUT',
        'APOLOGY VIDEO', 'WE NEED TO TALK', 'FINALLY REVEALED', 'GONE TOO FAR',
        'POLICE INVOLVED', 'BANNED FROM', 'KICKED OUT', 'I SPENT 24 HOURS',
        'SURVIVING 100 DAYS', 'I GAVE AWAY', 'LAST TO LEAVE', 'DESTROYED',
        'CAUGHT IN 4K', 'LOST EVERYTHING', 'NO ONE IS TALKING ABOUT', 'BIGGEST MISTAKE',
        'WHY I QUIT', 'MY FINAL MESSAGE', 'IM SORRY', 'I\'M SORRY', 'CANCELLED',
        'DRAMA EXPLAINED', 'WHAT REALLY HAPPENED', 'HE ADMITTED IT', 'SHE ADMITTED IT'
      ]
    }
  },
  {
    id: 'cs-coding-study-pack',
    name: 'Computer Science & Engineering Allowlist (45+ Channels)',
    category: 'study',
    categoryLabel: 'STUDY ALLOWLIST',
    badgeColor: '#3b82f6',
    icon: '💻',
    guideUrl: '/tools/study-allowlist',
    description: 'A study sanctuary covering 45+ accredited university lectures, software architecture channels, and coding educators. Algorithmic noise is dimmed.',
    channels: [
      '@3blue1brown', '@mitocw', '@cs50', '@Computerphile', '@Numberphile',
      '@standupmaths', '@BenEater', '@SebastianLague', '@statquest', '@LexFridman',
      '@StanfordOnline', '@Harvard', '@ThePrimeTimeagen', '@ThePrimeagen', '@Fireship',
      '@NeetCode', '@NeetCodeIO', '@ByteByteGo', '@ContinuousDelivery', '@EngineerMan',
      '@LowLevelJavaScript', '@CodeAesthetic', '@geohotarchive', '@TsodingDaily', '@JonGjengset',
      '@NoBoilerplate', '@anthonygg_', '@DreamsOfCode', '@freecodecamp', '@TraversyMedia',
      '@KevinPowell', '@NetNinja', '@Coreyms', '@WebDevSimplified', '@HusseinNasser-software',
      '@ArjanCodes', '@TechWithTim', '@programmingwithmosh', '@TheCodingTrain', '@deggendorf',
      '@sentdex', '@DerekBanas', '@DaveGrayTeachesCode', '@AmigosCode', '@JackHerrington'
    ],
    keywords: [],
    rules: [
      'Allowlist mode (Dim non-approved)',
      '45 Premier coding & CS channels',
      'Limit home feed (15-video cap)',
      'Hide Shorts',
      'Expand player (theater mode)',
      'Hide comments'
    ],
    settings: {
      filterMode: 'allowlist',
      allowlistAction: 'dim',
      limitHomeFeed: true,
      blockShorts: true,
      fullWindowPlayer: true,
      blockComments: true,
      channelAllowlist: [
        '@3blue1brown', '@mitocw', '@cs50', '@Computerphile', '@Numberphile',
        '@standupmaths', '@BenEater', '@SebastianLague', '@statquest', '@LexFridman',
        '@StanfordOnline', '@Harvard', '@ThePrimeTimeagen', '@ThePrimeagen', '@Fireship',
        '@NeetCode', '@NeetCodeIO', '@ByteByteGo', '@ContinuousDelivery', '@EngineerMan',
        '@LowLevelJavaScript', '@CodeAesthetic', '@geohotarchive', '@TsodingDaily', '@JonGjengset',
        '@NoBoilerplate', '@anthonygg_', '@DreamsOfCode', '@freecodecamp', '@TraversyMedia',
        '@KevinPowell', '@NetNinja', '@Coreyms', '@WebDevSimplified', '@HusseinNasser-software',
        '@ArjanCodes', '@TechWithTim', '@programmingwithmosh', '@TheCodingTrain', '@deggendorf',
        '@sentdex', '@DerekBanas', '@DaveGrayTeachesCode', '@AmigosCode', '@JackHerrington'
      ]
    }
  },
  {
    id: 'stem-academic-allowlist',
    name: 'STEM & University Academic Allowlist (45+ Channels)',
    category: 'study',
    categoryLabel: 'STUDY ALLOWLIST',
    badgeColor: '#10b981',
    icon: '🔬',
    guideUrl: '/tools/study-allowlist',
    description: 'An academic sanctuary for mathematics, physics, chemistry, biology, and medicine. Hides comments and suggested video sidebars.',
    channels: [
      '@khanacademy', '@3blue1brown', '@standupmaths', '@numberphile', '@ProfessorLeonard',
      '@blackpenredpen', '@brianmclogan', '@MichaelPennMath', '@PBSInfiniteSeries', '@BriTheMathGuy',
      '@FlammableMaths', '@ZachStar', '@veritasium', '@minutephysics', '@MichelvanBiezen',
      '@PhysicsGirl', '@SmarterEveryDay', '@RealEngineering', '@PracticalEngineering', '@SteveMould',
      '@ElectroBOOM', '@AppliedScience', '@MarkRober', '@TheActionLab', '@Lesics',
      '@EngineeringMindset', '@TheOrganicChemistryTutor', '@crashcourse', '@Kurzgesagt', '@TEDEd',
      '@NatureVideoChannel', '@NinjaNerdOfficial', '@Chubbyemu', '@JourneytoMicro', '@AmoebaSisters',
      '@ArmandoHasudungan', '@Medcram', '@Osmosis', '@SciShow', '@PBSSpaceTime',
      '@DomainofScience', '@UpAndAtom', '@AsapSCIENCE', '@BranchEducation', '@TED',
      '@BigThink', '@seeker', '@NileRed'
    ],
    keywords: [],
    rules: [
      'Allowlist mode (Dim non-approved)',
      '48 Mathematics & STEM channels',
      'Limit home feed to 15 calm videos',
      'Hide Shorts shelves',
      'Hide suggested videos beside player',
      'Hide comments'
    ],
    settings: {
      filterMode: 'allowlist',
      allowlistAction: 'dim',
      limitHomeFeed: true,
      blockShorts: true,
      blockRecommended: true,
      blockComments: true,
      channelAllowlist: [
        '@khanacademy', '@3blue1brown', '@standupmaths', '@numberphile', '@ProfessorLeonard',
        '@blackpenredpen', '@brianmclogan', '@MichaelPennMath', '@PBSInfiniteSeries', '@BriTheMathGuy',
        '@FlammableMaths', '@ZachStar', '@veritasium', '@minutephysics', '@MichelvanBiezen',
        '@PhysicsGirl', '@SmarterEveryDay', '@RealEngineering', '@PracticalEngineering', '@SteveMould',
        '@ElectroBOOM', '@AppliedScience', '@MarkRober', '@TheActionLab', '@Lesics',
        '@EngineeringMindset', '@TheOrganicChemistryTutor', '@crashcourse', '@Kurzgesagt', '@TEDEd',
        '@NatureVideoChannel', '@NinjaNerdOfficial', '@Chubbyemu', '@JourneytoMicro', '@AmoebaSisters',
        '@ArmandoHasudungan', '@Medcram', '@Osmosis', '@SciShow', '@PBSSpaceTime',
        '@DomainofScience', '@UpAndAtom', '@AsapSCIENCE', '@BranchEducation', '@TED',
        '@BigThink', '@seeker', '@NileRed'
      ]
    }
  },
  {
    id: 'calm-kids-safe-shield',
    name: 'Calm Kids & Safe Viewing Shield (35+ Channels & 25+ Keywords)',
    category: 'kids',
    categoryLabel: 'KIDS SAFETY',
    badgeColor: '#8b5cf6',
    icon: '🛡️',
    description: 'Shields children from hyper-stimulating unboxing factories, algorithmic nursery loops, and ElsaGate clones while disabling autoplay.',
    channels: [
      '@Cocomelon', '@RyanWorld', '@VladandNiki', '@DianaandRoma', '@KidsDianaShow',
      '@LooLooKids', '@LikeNastya', '@BabyBus', '@Blippi', '@ChuChuTV',
      '@ToysAndColors', '@LittleBabyBum', '@SuperSimpleSongs', '@GenevievesPlayhouse', '@BillionSurpriseToys',
      '@DaniaKidsTV', '@PeppaPigOfficial', '@Morphle', '@DaveandAva', '@BouncePatrol',
      '@LucasAndFriends', '@WolfooFamily', '@BabyShark', '@Pinkfong', '@ChuchuTVSurprise',
      '@GabyandAlex', '@KondZillaKids', '@BoramTube', '@CookieSwirlC', '@FGTEEV',
      '@DanTDMKids', '@Aphmau', '@LankyBoxWorld', '@CollinsKey', '@CraftySlimeCreator',
      '@GuavaJuice'
    ],
    keywords: [
      'toy unboxing', 'surprise eggs', 'slime', 'skibidi', 'skibidi toilet',
      'huggy wuggy', 'poppy playtime', 'crying baby', 'elsagate', 'bad baby',
      'giant injection', 'paw patrol real life', 'spiderman elsa', 'pregnant elsa',
      'finger family song', 'color songs for kids', 'learn colors with', 'slime challenge',
      'prank on mom', 'rich vs poor', 'adopted by', 'scary teacher 3d',
      'roblox story', 'toilet monster', 'cameraman vs', 'granny game'
    ],
    rules: [
      '36 Algorithmic kid channel blocklist',
      '26 Sensational toy keywords filtered',
      'Hide Shorts shelves',
      'Disable video autoplay',
      'Disable hover previews',
      'Hide comments'
    ],
    settings: {
      blockShorts: true,
      disableAutoplay: true,
      disableHoverPreviews: true,
      blockComments: true,
      channelBlocklist: [
        '@Cocomelon', '@RyanWorld', '@VladandNiki', '@DianaandRoma', '@KidsDianaShow',
        '@LooLooKids', '@LikeNastya', '@BabyBus', '@Blippi', '@ChuChuTV',
        '@ToysAndColors', '@LittleBabyBum', '@SuperSimpleSongs', '@GenevievesPlayhouse', '@BillionSurpriseToys',
        '@DaniaKidsTV', '@PeppaPigOfficial', '@Morphle', '@DaveandAva', '@BouncePatrol',
        '@LucasAndFriends', '@WolfooFamily', '@BabyShark', '@Pinkfong', '@ChuchuTVSurprise',
        '@GabyandAlex', '@KondZillaKids', '@BoramTube', '@CookieSwirlC', '@FGTEEV',
        '@DanTDMKids', '@Aphmau', '@LankyBoxWorld', '@CollinsKey', '@CraftySlimeCreator',
        '@GuavaJuice'
      ],
      keywordBlocklist: [
        'toy unboxing', 'surprise eggs', 'slime', 'skibidi', 'skibidi toilet',
        'huggy wuggy', 'poppy playtime', 'crying baby', 'elsagate', 'bad baby',
        'giant injection', 'paw patrol real life', 'spiderman elsa', 'pregnant elsa',
        'finger family song', 'color songs for kids', 'learn colors with', 'slime challenge',
        'prank on mom', 'rich vs poor', 'adopted by', 'scary teacher 3d',
        'roblox story', 'toilet monster', 'cameraman vs', 'granny game'
      ]
    }
  },
  {
    id: 'cable-news-political-ragebait',
    name: 'Cable News & Political Ragebait Shield (30+ Channels)',
    category: 'channels',
    categoryLabel: 'CHANNEL BLOCKLIST',
    badgeColor: '#dc2626',
    icon: '🛑',
    description: 'Mutes 30+ 24/7 cable news networks and partisan political commentary channels that fuel anxiety loops and doomscrolling.',
    channels: [
      '@CNN', '@FoxNews', '@MSNBC', '@Newsmax', '@SkyNewsAustralia',
      '@TheSun', '@DailyCaller', '@TheYoungTurks', '@BreitbartNews', '@OANN',
      '@DailyWire', '@BenShapiro', '@StevenCrowder', '@DavidPakmanShow', '@SecularTalk',
      '@Timcast', '@JordanBPeterson', '@MegynKelly', '@PiersMorganUncensored', '@CandaceOwens',
      '@GlennGreenwald', '@TuckerCarlson', '@BrianTylerCohen', '@MeidasTouch', '@TYT',
      '@FoxBusiness', '@CNBC', '@ForbesBreakingNews', '@TheHill', '@RebelNewsOnline'
    ],
    keywords: [],
    rules: [
      '30 Cable news and pundit channels blocked',
      'Hide Shorts shelves',
      'Hide trending news shelves',
      'Neutral thumbnails enabled',
      'Hide comments'
    ],
    settings: {
      blockShorts: true,
      blockExploreAndTrending: true,
      neutralThumbnails: true,
      blockComments: true,
      channelBlocklist: [
        '@CNN', '@FoxNews', '@MSNBC', '@Newsmax', '@SkyNewsAustralia',
        '@TheSun', '@DailyCaller', '@TheYoungTurks', '@BreitbartNews', '@OANN',
        '@DailyWire', '@BenShapiro', '@StevenCrowder', '@DavidPakmanShow', '@SecularTalk',
        '@Timcast', '@JordanBPeterson', '@MegynKelly', '@PiersMorganUncensored', '@CandaceOwens',
        '@GlennGreenwald', '@TuckerCarlson', '@BrianTylerCohen', '@MeidasTouch', '@TYT',
        '@FoxBusiness', '@CNBC', '@ForbesBreakingNews', '@TheHill', '@RebelNewsOnline'
      ]
    }
  },
  {
    id: 'newspaper-anti-doomscroll',
    name: 'Newspaper Mode (15-Video Cap)',
    category: 'minimal',
    categoryLabel: 'ANTI-DOOMSCROLL',
    badgeColor: '#0ea5e9',
    icon: '📰',
    guideUrl: '/tools/screen-time-calculator',
    description: 'Turns YouTube into a finite morning paper. Shows 15 videos, stops infinite scrolling with a finish line, and widens the player.',
    channels: [],
    keywords: [],
    rules: [
      'Limit home feed to 15 videos',
      'Disables infinite scroll with finish marker',
      'Hide Shorts shelves',
      'Redirect Shorts to standard player',
      'Hide suggested videos beside player',
      'Expand player into theater width',
      'Neutral thumbnails enabled'
    ],
    settings: {
      limitHomeFeed: true,
      blockShorts: true,
      redirectShorts: true,
      blockRecommended: true,
      fullWindowPlayer: true,
      neutralThumbnails: true,
      blockMixPlaylists: true
    }
  }
]

export const CURATED_PACKS = RAW_PACKS.map(pack => {
  const code = encodeSetup(pack.name, pack.settings)
  return {
    ...pack,
    code,
    setupUrl: `/setup#s=${code}`
  }
})
