/* ==========================================================================
   EchoLife Data Store & LocalStorage Persistence Manager
   ========================================================================== */

const STORAGE_KEYS = {
  MEMORIES: 'echolife_memories_v1',
  USER: 'echolife_user_v1',
  NOTIFICATIONS: 'echolife_notifications_v1',
  SETTINGS: 'echolife_settings_v1'
};

/* Default Initial Memories */
const DEFAULT_MEMORIES = [
  {
    id: 'mem-101',
    title: 'Sunset Over Kyoto Shrines',
    description: 'Walked through the Fushimi Inari torii gates at dusk. The vibrant vermilion colors against the dense forest canopy created an ethereal atmosphere I will never forget.',
    date: '2026-04-18',
    location: 'Kyoto, Japan',
    emotion: 'Joy',
    category: 'Travel',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Japan', 'Shrine', 'Sunset', 'SoloTrip'],
    people: ['Kenji', 'Self'],
    isFavorite: true,
    likes: 42,
    privacy: 'Public',
    audioNote: 'Kyoto Ambient Forest Whispers (0:45)'
  },
  {
    id: 'mem-102',
    title: 'Graduation Ceremony & Celebration',
    description: 'Walked across the stage to receive my Master’s Degree in Software Engineering! Surrounded by my family, mentors, and lifelong college friends.',
    date: '2025-06-12',
    location: 'Stanford University, CA',
    emotion: 'Milestone',
    category: 'Graduation',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Graduation', 'MastersDegree', 'Stanford', 'Family'],
    people: ['Mom', 'Dad', 'Sarah', 'Alex'],
    isFavorite: true,
    likes: 89,
    privacy: 'Shared',
    audioNote: ''
  },
  {
    id: 'mem-103',
    title: 'Alpine Cabin Weekend & Stargazing',
    description: 'Spent three quiet days in the Swiss Alps off-grid. We brewed hot cocoa on a wood stove and watched shooting stars under zero light pollution.',
    date: '2025-11-04',
    location: 'Zermatt, Switzerland',
    emotion: 'Serenity',
    category: 'Vacations',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Alps', 'Stargazing', 'Cabin', 'Winter'],
    people: ['Elena', 'Marco'],
    isFavorite: false,
    likes: 31,
    privacy: 'Private',
    audioNote: ''
  },
  {
    id: 'mem-104',
    title: 'Summer Music Festival VIP Night',
    description: 'Front row at the mainstage as the headliner played our favorite anthem under a sky illuminated by fireworks and confetti bursts.',
    date: '2024-07-22',
    location: 'Austin, Texas',
    emotion: 'Adventure',
    category: 'Festivals',
    type: 'Video',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Concert', 'MusicFestival', 'Fireworks', 'Friends'],
    people: ['Alex', 'David', 'Chloe'],
    isFavorite: true,
    likes: 64,
    privacy: 'Public',
    audioNote: 'Live Anthem Acoustic Clip (1:12)'
  },
  {
    id: 'mem-105',
    title: '30th Birthday Surprise Garden Party',
    description: 'My closest friends secretly converted our backyard into a fairy-lit outdoor dining paradise with custom cocktails and live acoustic jazz.',
    date: '2024-03-15',
    location: 'Seattle, WA',
    emotion: 'Gratitude',
    category: 'Birthday',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Birthday', 'Surprise', 'Friends', 'BackyardParty'],
    people: ['Mom', 'Elena', 'Sam', 'Jessica'],
    isFavorite: true,
    likes: 112,
    privacy: 'Shared',
    audioNote: ''
  },
  {
    id: 'mem-106',
    title: 'Reflections on Building EchoLife SaaS',
    description: 'Late-night thoughts after shipping our first major release. Realized how important preserving personal moments is for future generations.',
    date: '2026-08-01',
    location: 'San Francisco Studio',
    emotion: 'Nostalgia',
    category: 'Journal',
    type: 'Journal',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Journal', 'Coding', 'Productivity', 'Startup'],
    people: ['Self'],
    isFavorite: false,
    likes: 19,
    privacy: 'Private',
    audioNote: 'Voice Log #42 (2:04)'
  },
  {
    id: 'mem-107',
    title: 'Pacific Coast Highway Sunset Drive',
    description: 'Rented a vintage convertible and drove along Big Sur with the ocean breeze, coastal cliffs, and California golden hour light.',
    date: '2023-09-10',
    location: 'Big Sur, California',
    emotion: 'Adventure',
    category: 'Travel',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Roadtrip', 'BigSur', 'California', 'Convertible'],
    people: ['Elena'],
    isFavorite: true,
    likes: 77,
    privacy: 'Public',
    audioNote: ''
  },
  {
    id: 'mem-108',
    title: 'Promoted to Lead Architect',
    description: 'Official announcement at the tech summit! Honored to lead the flagship cloud architecture team and mentor 12 incredible engineers.',
    date: '2025-01-20',
    location: 'San Jose Headquarters',
    emotion: 'Milestone',
    category: 'Achievements',
    type: 'Photo',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    media: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['Career', 'Promotion', 'TechLead', 'Milestone'],
    people: ['Boss', 'Team'],
    isFavorite: false,
    likes: 54,
    privacy: 'Shared',
    audioNote: ''
  }
];

/* Default User Profile */
const DEFAULT_USER = {
  name: 'Alexandre Mercer',
  handle: '@alexmercer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  banner: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  bio: 'Digital Nomad, Lead Architect & Memory Collector. Capturing human stories across 28 countries.',
  location: 'San Francisco, CA',
  joinedDate: 'March 2023',
  streakDays: 48,
  yearsArchived: 7,
  storageUsedMB: 3420,
  storageTotalMB: 10240, // 10 GB
  achievements: [
    { title: 'Time Traveler', desc: 'Archived memories across 5+ years', icon: 'bi-hourglass-split' },
    { title: 'Master Curator', desc: 'Created 100+ rich memory cards', icon: 'bi-award' },
    { title: 'Globe Trotter', desc: 'Memories saved in 10+ countries', icon: 'bi-globe-americas' },
    { title: 'Streak Champion', desc: '30-day continuous archiving streak', icon: 'bi-fire' }
  ]
};

/* Default Notifications */
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'On This Day Throwback!',
    message: '2 years ago today: You were at the Summer Music Festival in Austin.',
    time: '2 hours ago',
    type: 'anniversary',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Backup Successful',
    message: 'Your monthly encrypted JSON archive backup completed automatically.',
    time: 'Yesterday',
    type: 'system',
    read: true
  },
  {
    id: 'notif-3',
    title: 'New Achievement Unlocked',
    message: 'Congratulations! You unlocked the "Streak Champion" badge.',
    time: '3 days ago',
    type: 'badge',
    read: true
  }
];

/* Data Store Object */
const EchoLifeStore = {
  /* Memories */
  getMemories: function() {
    const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    return data ? JSON.parse(data) : DEFAULT_MEMORIES;
  },

  saveMemories: function(memories) {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  },

  addMemory: function(memory) {
    const memories = this.getMemories();
    memories.unshift(memory);
    this.saveMemories(memories);
    return memory;
  },

  updateMemory: function(id, updatedFields) {
    let memories = this.getMemories();
    memories = memories.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    this.saveMemories(memories);
  },

  deleteMemory: function(id) {
    let memories = this.getMemories();
    memories = memories.filter(m => m.id !== id);
    this.saveMemories(memories);
  },

  toggleFavorite: function(id) {
    let memories = this.getMemories();
    const mem = memories.find(m => m.id === id);
    if (mem) {
      mem.isFavorite = !mem.isFavorite;
      this.saveMemories(memories);
    }
    return mem ? mem.isFavorite : false;
  },

  toggleLike: function(id) {
    let memories = this.getMemories();
    const mem = memories.find(m => m.id === id);
    if (mem) {
      mem.likes = (mem.likes || 0) + 1;
      this.saveMemories(memories);
    }
    return mem ? mem.likes : 0;
  },

  /* User */
  getUser: function() {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : DEFAULT_USER;
  },

  saveUser: function(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /* Notifications */
  getNotifications: function() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : DEFAULT_NOTIFICATIONS;
  },

  /* Reset Demo Data */
  resetData: function() {
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(DEFAULT_MEMORIES));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
};

// Initialize if empty
if (!localStorage.getItem(STORAGE_KEYS.MEMORIES)) {
  EchoLifeStore.resetData();
}
