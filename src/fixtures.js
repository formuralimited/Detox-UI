/* Mock JSON fixtures. Every screen reads from here through fetchFixture(),
   which mimics an API call so loading and error states are exercised. */

export const fetchFixture = (key, delay = 550) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!(key in FIXTURES)) reject(new Error(`No fixture named "${key}"`));
      else resolve(JSON.parse(JSON.stringify(FIXTURES[key])));
    }, delay)
  );

export const SURVEY = [
  { id: 'faction', q: 'Which faction are you with?', options: ['Heroes', 'Villains', 'Mecha pilots', 'Magic users'] },
  { id: 'style', q: 'Which art style do you like most?', options: ['Manga ink', 'Pixel art', 'Cel shaded', 'Watercolor'] },
  { id: 'collectible', q: 'What do you collect?', options: ['Figures', 'Trading cards', 'Pins and badges', 'Art prints'] },
];

export const PIXEL_PALETTE = {
  r: '#FF4D6D', y: '#FFD23F', w: '#FFFFFF', k: '#0D0B1E', b: '#4D9DFF',
  c: '#3DE0FF', g: '#9AA4C7', p: '#FF8FC7', v: '#9B6BFF', o: '#FF9F45', n: '#3DDC84',
};

export const COLLECTIBLES = [
  { id: 'c-starter', name: 'Welcome Star', rarity: 'Common', art: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yyyyyy.', '.yy..yy.', 'y......y'] },
  { id: 'c-heart', name: 'Ink Heart', rarity: 'Common', art: ['.rr..rr.', 'rrrrrrrr', 'rwrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........'] },
  { id: 'c-gem', name: 'Pixel Gem', rarity: 'Rare', art: ['..cccc..', '.cwcccc.', 'cwcccccc', 'cccccccc', '.cccccc.', '..cccc..', '...cc...', '........'] },
  { id: 'c-robot', name: 'Pilot Bot', rarity: 'Rare', art: ['...oo...', '.gggggg.', 'ggcggcgg', 'gggggggg', 'ggkkkkgg', '.gggggg.', '..g..g..', '.gg..gg.'] },
  { id: 'c-potion', name: 'Mana Potion', rarity: 'Common', art: ['..gggg..', '...gg...', '..gwwg..', '.gbbbbg.', 'gbbwbbbg', 'gbbbbbbg', 'gbbbbbbg', '.gggggg.'] },
  { id: 'c-sword', name: 'Hero Blade', rarity: 'Epic', art: ['......ww', '.....www', '....www.', '...www..', 'y.www...', '.yww....', '.yyy....', 'y..y....'] },
  { id: 'c-crown', name: 'Sponsor Crown', rarity: 'Epic', art: ['........', 'y..yy..y', 'y.yyyy.y', 'yyyyyyyy', 'yryyyyry', 'yyyyyyyy', 'yyyyyyyy', '........'] },
  { id: 'c-ghost', name: 'Arcade Ghost', rarity: 'Legendary', art: ['..vvvv..', '.vvvvvv.', 'vvwkvwkv', 'vvwkvwkv', 'vvvvvvvv', 'vvvvvvvv', 'vvvvvvvv', 'v.vv.vv.'] },
];

/* Map grid is 20 x 13 cells. One cell is about 5 m. */
export const MAP = { cols: 20, rows: 13, entrance: { x: 9.5, y: 12 }, metersPerCell: 5, checkinRadiusM: 10 };

const BOOTHS = [
  { id: 'A1', booth_id: 'booth_a1', name: 'Ink Works Studio', kind: 'Artist alley', x: 1, y: 1, w: 4, h: 2, door: { x: 3, y: 3.6 }, queue: 12, collectible: 'c-heart' },
  { id: 'A2', booth_id: 'booth_a2', name: 'Pixel Forge', kind: 'Indie games', x: 6, y: 1, w: 4, h: 2, door: { x: 8, y: 3.6 }, queue: 25, collectible: 'c-gem' },
  { id: 'A3', booth_id: 'booth_a3', name: 'Mecha Garage', kind: 'Model kits', x: 11, y: 1, w: 3, h: 2, door: { x: 12.5, y: 3.6 }, queue: 8, collectible: 'c-robot' },
  { id: 'B1', booth_id: 'booth_b1', name: 'Card Vault', kind: 'Trading cards', x: 1, y: 6, w: 4, h: 2, door: { x: 3, y: 5.4 }, queue: 18, collectible: 'c-potion' },
  { id: 'B2', booth_id: 'booth_b2', name: 'Figure Lab', kind: 'Figures', x: 6, y: 6, w: 4, h: 2, door: { x: 8, y: 5.4 }, queue: 31, collectible: 'c-sword' },
  { id: 'B3', booth_id: 'booth_b3', name: 'Sponsor Lounge', kind: 'Sponsor', x: 11, y: 6, w: 3, h: 2, door: { x: 12.5, y: 5.4 }, queue: 5, collectible: 'c-crown' },
  { id: 'C1', booth_id: 'booth_c1', name: 'Arcade Corner', kind: 'Free play', x: 15, y: 7, w: 4, h: 3, door: { x: 14.4, y: 9.5 }, queue: 0, collectible: 'c-ghost' },
];

/* Knowledge base for the messaging chatbot. */
export const KB = [
  { k: ['open', 'hours', 'close', 'doors'], a: 'Doors open at 10:00 and close at 19:00. Your pass shows your own entry window.' },
  { k: ['ticket', 'pass', 'qr', 'entry', 'window'], a: 'Your digital pass is in the Event tab under Ticket. Finish the pre-event trivia to move to an earlier entry window.' },
  { k: ['refund', 'cancel'], a: 'Refunds are open until 48 hours before the event. I have logged your request and the ticketing team will reply here.' },
  { k: ['queue', 'wait', 'line', 'busy'], a: 'Live queue times are on the map. Right now Arcade Corner and Sponsor Lounge have the shortest waits.' },
  { k: ['restock', 'stock', 'sold'], a: 'The next restock is at 14:00. We will message you 10 minutes before it lands.' },
  { k: ['power', 'electric', 'socket', 'outlet'], a: 'Each booth has two 13 A sockets under the back table. Extra power needs a request to the operations desk before 09:00.' },
  { k: ['load', 'setup', 'set up', 'delivery', 'dock'], a: 'Load-in runs from 07:00 to 09:30 at Dock 2. Show your exhibitor pass at the gate.' },
  { k: ['wifi', 'internet'], a: 'Exhibitor Wi-Fi details are printed on your booth card. Attendee Wi-Fi is open in the food court.' },
  { k: ['lost', 'found'], a: 'Lost property is at the information desk next to the entrance.' },
  { k: ['collectible', 'badge', 'reward'], a: 'Check in at a booth on the map to unlock its collectible. You can push unlocked pixel art to your LED badge.' },
];

const MENTIONS = [
  { id: 'm1', handle: '@inkfox', source: 'Social', text: 'Gate B queue has not moved in 20 minutes. Anyone know what is going on?', score: -0.8, topic: 'Entry queue' },
  { id: 'm2', handle: '@pixel_mari', source: 'Discord', text: 'The trivia unlock got me in at 11. Walked straight in.', score: 0.8, topic: 'Entry queue' },
  { id: 'm3', handle: '@gundamdad', source: 'Social', text: 'Main Stage mic keeps cutting out, cannot hear the panel from row 10.', score: -0.7, topic: 'Audio' },
  { id: 'm4', handle: '@sakura.k', source: 'WhatsApp', text: 'Figure Lab aisle is packed. Hard to get through with a stroller.', score: -0.6, topic: 'Congestion' },
  { id: 'm5', handle: '@retrojin', source: 'Social', text: 'Arcade Corner has free play and zero wait. Best spot in the hall.', score: 0.9, topic: 'Booths' },
  { id: 'm6', handle: '@cardqueen', source: 'Discord', text: 'Pulled a legendary collectible from the map quest. So good.', score: 0.9, topic: 'Booths' },
  { id: 'm7', handle: '@mochi_bun', source: 'Social', text: 'Still stuck outside Gate B. Staff are not telling us anything.', score: -0.9, topic: 'Entry queue' },
  { id: 'm8', handle: '@leo_cos', source: 'Social', text: 'Cosplay repair desk saved my wig. Thank you!', score: 0.7, topic: 'Services' },
  { id: 'm9', handle: '@nightowl', source: 'WhatsApp', text: 'Is the 15:00 clinic on Main Stage still happening with the audio issue?', score: -0.2, topic: 'Audio' },
  { id: 'm10', handle: '@tiny_mecha', source: 'Discord', text: 'Food court line is fine, about 5 minutes.', score: 0.3, topic: 'Services' },
];

const ALERTS = [
  { id: 'al1', level: 'critical', topic: 'Entry queue', title: 'Long entry queue at Gate B', detail: '38 negative mentions in 15 minutes. Estimated wait 35 minutes.', status: 'open', draft: 'We know Gate B is slow right now. Gate C is open with no wait, 2 minutes to your left. Extra staff are on the way.' },
  { id: 'al2', level: 'serious', topic: 'Audio', title: 'Audio dropouts on Main Stage', detail: '14 mentions since 12:20. Microphone cutting out during panels.', status: 'open', draft: 'Sorry about the sound on Main Stage. Our crew is swapping the microphone now. The 15:00 clinic will start on time.' },
  { id: 'al3', level: 'warning', topic: 'Congestion', title: 'Congestion near Figure Lab (B2)', detail: 'Aisle density above 80 percent. 9 mentions.', status: 'open', draft: 'The aisle by Figure Lab is busy. Arcade Corner and Sponsor Lounge have no wait and bonus Star Dust for the next 30 minutes.' },
];

const SENTIMENT_TREND = [
  { t: '10:00', score: 62 }, { t: '10:30', score: 66 }, { t: '11:00', score: 71 }, { t: '11:30', score: 68 },
  { t: '12:00', score: 55 }, { t: '12:30', score: 44 }, { t: '13:00', score: 41 },
];

const PEOPLE = [
  { id: 'p1', name: 'Hana', age: 24, gender: 'lady', km: 0.4, type: 'INFP', interests: ['Manga', 'Cosplay', 'Board games'], bio: 'Sketches every day. Looking for a drawing group.' },
  { id: 'p2', name: 'Marcus', age: 27, gender: 'man', km: 0.8, type: 'INTJ', interests: ['Retro games', 'Model kits', 'Hiking'], bio: 'Builds model kits and wants a weekend build club.' },
  { id: 'p3', name: 'Sofia', age: 29, gender: 'lady', km: 1.2, type: 'ENFJ', interests: ['Cosplay', 'Photography', 'Running'], bio: 'Cosplay photographer. Morning runner.' },
  { id: 'p4', name: 'Kenji', age: 31, gender: 'man', km: 2.5, type: 'ISTP', interests: ['Trading cards', 'Retro games', 'Cycling'], bio: 'Trades cards on Saturdays.' },
  { id: 'p5', name: 'Amara', age: 26, gender: 'lady', km: 3.1, type: 'ENTP', interests: ['Retro games', 'Manga', 'Hiking'], bio: 'Speedruns old platformers. Hikes on Sundays.' },
  { id: 'p6', name: 'Liam', age: 23, gender: 'man', km: 0.6, type: 'ISFJ', interests: ['Manga', 'Board games', 'Cooking'], bio: 'Hosts a monthly board game night.' },
  { id: 'p7', name: 'Yuki', age: 28, gender: 'lady', km: 4.8, type: 'INTJ', interests: ['Model kits', 'Photography', 'Trading cards'], bio: 'Paints miniatures. Likes quiet cafes.' },
  { id: 'p8', name: 'Ravi', age: 30, gender: 'man', km: 1.9, type: 'ENFP', interests: ['Cosplay', 'Running', 'Manga'], bio: 'First-time cosplayer looking for build tips.' },
  { id: 'p9', name: 'Chloe', age: 25, gender: 'lady', km: 6.3, type: 'ISFP', interests: ['Photography', 'Cooking', 'Board games'], bio: 'Bakes character-themed desserts.' },
  { id: 'p10', name: 'Tomas', age: 33, gender: 'man', km: 5.5, type: 'ENTJ', interests: ['Cycling', 'Trading cards', 'Hiking'], bio: 'Organizes group rides and card swaps.' },
];
export const INTERESTS = ['Manga', 'Cosplay', 'Retro games', 'Model kits', 'Trading cards', 'Board games', 'Photography', 'Hiking', 'Running', 'Cycling', 'Cooking'];

const GROUPS = [
  { id: 'g1', name: 'Saturday Sketch Club', tags: ['Manga', 'Photography'], members: 14, fit: 'Calm, creative types', joined: false, next: 'Sat 10:00, Harbour Park pavilion' },
  { id: 'g2', name: 'Retro Game Night', tags: ['Retro games', 'Board games'], members: 22, fit: 'Playful, competitive types', joined: false, next: 'Fri 19:00, Pixel Cafe, North Point' },
  { id: 'g3', name: 'Trail and Talk', tags: ['Hiking', 'Running'], members: 9, fit: 'Outdoor, reflective types', joined: true, next: 'Sun 08:00, Riverside trail head' },
  { id: 'g4', name: 'Kit Builders Bench', tags: ['Model kits', 'Trading cards'], members: 11, fit: 'Analytical, detail-first types', joined: false, next: 'Wed 18:30, Community hall room 2' },
];

export const PERSONALITY_QUIZ = [
  { id: 'e', q: 'After a long day you recharge by', a: ['Meeting friends', 'Time alone'], letters: ['E', 'I'] },
  { id: 's', q: 'You trust more', a: ['Facts you can check', 'Patterns and hunches'], letters: ['S', 'N'] },
  { id: 't', q: 'You decide with', a: ['Logic first', 'Feelings first'], letters: ['T', 'F'] },
  { id: 'j', q: 'Your week is', a: ['Planned', 'Open'], letters: ['J', 'P'] },
];

export const TONES = {
  analytical: { label: 'Analytical', hint: 'Short, structured, numbers first' },
  warm: { label: 'Warm', hint: 'Encouraging and personal' },
  playful: { label: 'Playful', hint: 'Light and energetic' },
};
export const toneForType = (type) =>
  !type ? 'warm' : type.includes('T') && type.includes('J') ? 'analytical' : type.includes('F') ? 'warm' : 'playful';

export const APPS = [
  { id: 'instagram', name: 'Instagram', blocked: true, limit: 30, used: 22 },
  { id: 'tiktok', name: 'TikTok', blocked: true, limit: 20, used: 20 },
  { id: 'youtube', name: 'YouTube', blocked: false, limit: 60, used: 35 },
  { id: 'x', name: 'X', blocked: true, limit: 15, used: 4 },
  { id: 'facebook', name: 'Facebook', blocked: false, limit: 30, used: 0 },
  { id: 'reddit', name: 'Reddit', blocked: false, limit: 30, used: 12 },
];

export const FOODS = [
  { id: 'f1', name: 'Algae snack', cost: 20, hp: 8 },
  { id: 'f2', name: 'Fly bento', cost: 45, hp: 20 },
  { id: 'f3', name: 'Star fruit', cost: 80, hp: 40 },
];

export const GOALS = [
  { id: 'g-social', label: 'Stay under 2 hours of social media', reward: 30, hp: 6, check: 'Checked at the end of the day' },
  { id: 'g-steps', label: 'Walk 6,000 steps', reward: 25, hp: 5, check: 'Completes when your ring counts 6,000' },
  { id: 'g-chat', label: 'Talk with your Detox assistant', reward: 15, hp: 4, check: 'Completes when the assistant replies' },
  { id: 'g-block', label: 'Keep blocked apps closed until 18:00', reward: 30, hp: 6, check: 'Checked at 18:00' },
  { id: 'g-focus', label: 'Finish one focus session', reward: 25, hp: 5, check: 'Completes when a focus session ends' },
];

/* ---------- Digital detox ---------- */
export const OBJECTIVES = [
  { id: 'focus', title: 'Regain focus', text: 'Fewer interruptions, so you can stay on one task longer.' },
  { id: 'screen', title: 'Cut screen time', text: 'Become aware of your screen time and reduce it step by step.' },
  { id: 'aware', title: 'Know your habits', text: 'See what pulls you to your phone and when.' },
  { id: 'connect', title: 'Connect in real life', text: 'Spend the time you win back with people and offline activities.' },
];

export const HABIT_QUESTIONS = {
  estimate: { q: 'How long do you think you spend on your phone each day?', options: ['Under 2 hours', '2 to 3 hours', '3 to 4 hours', 'Over 4 hours'] },
  problems: {
    q: 'Which of these are true for you?',
    options: [
      'I find it hard to focus on one task',
      'I scroll late at night and sleep less',
      'I check my phone first thing in the morning',
      'I lose track of time on social media',
      'I feel worse after scrolling',
      'I spend less time with people than I want to',
    ],
  },
};

/* Measured baseline from the phone and ring over the last 7 days (mock). */
export const BASELINE = { avgMin: 252, pickups: 96, firstPickup: '07:02', topApps: [['Instagram', 74], ['TikTok', 61], ['YouTube', 48]] };
export const DAILY_TARGETS = [{ value: 180, label: '3 hours' }, { value: 120, label: '2 hours' }, { value: 90, label: '90 minutes' }];
export const PACES = [{ value: 15, label: 'Gentle', hint: '15 minutes less each week' }, { value: 30, label: 'Steady', hint: '30 minutes less each week' }];

export const SCREEN_WEEK = [
  { day: 'Sat', min: 262 }, { day: 'Sun', min: 248 }, { day: 'Mon', min: 240 }, { day: 'Tue', min: 231 },
  { day: 'Wed', min: 220 }, { day: 'Thu', min: 205 },
];

export const ACTIVITIES = [
  { id: 'a-walk', title: 'Take a 15 minute walk outside', kind: 'Move', min: 15, reward: 15 },
  { id: 'a-read', title: 'Read 10 pages of a book', kind: 'Focus', min: 15, reward: 15 },
  { id: 'a-call', title: 'Call a friend instead of texting', kind: 'Connect', min: 10, reward: 20 },
  { id: 'a-sketch', title: 'Sketch something in front of you', kind: 'Create', min: 15, reward: 15 },
  { id: 'a-journal', title: 'Write three lines about your day', kind: 'Reflect', min: 5, reward: 10 },
  { id: 'a-meetup', title: 'Join a group meetup this week', kind: 'Connect', min: 60, reward: 30, link: ['community', { tab: 'groups' }] },
];

export const INSIGHTS = [
  { id: 'i1', title: 'Your peak scrolling time is 21:00 to 23:00', detail: 'That is 41 percent of your screen time. Your block schedule now starts at 21:00.' },
  { id: 'i2', title: 'You pick up your phone within 2 minutes of waking', detail: 'First pickup at 07:02 on 6 of 7 days. Try charging it outside the bedroom.' },
  { id: 'i3', title: 'Heavy scrolling nights come before short sleep', detail: 'On 3 of 4 nights with over 1 hour of late scrolling, you slept under 6.5 hours.' },
  { id: 'i4', title: 'Focus sessions are getting longer', detail: 'You stayed off your phone for 25 minutes 4 times this week, up from once.' },
];

const HEALTH = {
  steps: 4380, stepGoal: 6000, sleepH: 6.4, sleepGoal: 7.5, restingHr: 64,
  week: [
    { day: 'Sat', steps: 7210 }, { day: 'Sun', steps: 3120 }, { day: 'Mon', steps: 6480 }, { day: 'Tue', steps: 5230 },
    { day: 'Wed', steps: 8040 }, { day: 'Thu', steps: 6120 }, { day: 'Fri', steps: 4380 },
  ],
  reminders: [
    { id: 'r1', topic: 'Sleep', text: 'You slept 6 h 24 min. Put your phone outside the bedroom by 22:30 tonight.' },
    { id: 'r2', topic: 'Exercise', text: 'You are 1,620 steps short. A 15 minute walk after lunch closes the gap.' },
    { id: 'r3', topic: 'Screen time', text: 'Social apps peak at 21:00 for you. Start a block at 20:45?' },
  ],
};

const CIRCLE = [
  { id: 'a1', name: 'Daniel Park', relation: 'Spouse', status: 'active', sees: { progress: true, health: true } },
  { id: 'a2', name: 'Pastor Grace Lim', relation: 'Church leader', status: 'active', sees: { progress: true, health: false } },
  { id: 'a3', name: 'Noor Hassan', relation: 'Close friend', status: 'pending', sees: { progress: true, health: false } },
];

const TRUSTED = [
  { id: 't1', name: 'Daniel Park', relation: 'Spouse', via: 'WhatsApp', location: true, status: true, heart: true },
  { id: 't2', name: 'Noor Hassan', relation: 'Close friend', via: 'SMS', location: true, status: true, heart: false },
];

const SUPPORT = {
  areas: ['Harbour District', 'North Point', 'Riverside'],
  services: [
    { id: 'sv1', kind: 'Counselor', name: 'Clearwater Counselling Practice', detail: 'Licensed clinical psychologist. Weekday evenings.', area: 'Harbour District', km: 0.9, phone: '555 0142' },
    { id: 'sv2', kind: 'Counselor', name: 'Open Door Therapy Centre', detail: 'Licensed counselors. Sliding fees.', area: 'North Point', km: 2.4, phone: '555 0177' },
    { id: 'sv3', kind: 'Church', name: 'Harbour Community Church', detail: 'Partner church. Pastoral care team, daily.', area: 'Harbour District', km: 1.3, phone: '555 0119' },
    { id: 'sv4', kind: 'Church', name: 'Riverside Fellowship', detail: 'Partner church. Recovery support group on Wednesdays.', area: 'Riverside', km: 3.8, phone: '555 0163' },
    { id: 'sv5', kind: 'Counselor', name: 'Riverside Wellbeing Clinic', detail: 'Licensed psychologist and family therapist.', area: 'Riverside', km: 4.1, phone: '555 0126' },
  ],
};

const PRODUCTS = [
  { id: 'pr1', name: 'Detox Smart Ring', price: 129, note: 'NFC event access, heart rate, steps, sleep' },
  { id: 'pr2', name: 'LED Display Badge', price: 39, note: 'Shows your unlocked pixel art over Bluetooth' },
  { id: 'pr3', name: 'Ring Charm: Star', price: 12, note: 'Fits any charm slot' },
  { id: 'pr4', name: 'Ring Charm: Frog', price: 12, note: 'Fits any charm slot' },
  { id: 'pr5', name: 'Ring Charging Dock', price: 25, note: 'USB-C, full charge in 60 minutes' },
];

export const TRIVIA = [
  { q: 'In a manga, which way do you read the panels?', options: ['Left to right', 'Right to left', 'Bottom to top'], answer: 1 },
  { q: 'What is "cosplay" short for?', options: ['Costume play', 'Cosmic player', 'Copy style'], answer: 0 },
  { q: 'What does "chibi" style mean?', options: ['Dark and realistic', 'Small with cute proportions', 'Drawn with one line'], answer: 1 },
];

export const POLL = {
  sponsor: 'Sponsor Lounge',
  q: 'Which drop should the sponsor release first?',
  options: [
    { id: 'o1', label: 'Limited art print', votes: 412 },
    { id: 'o2', label: 'Enamel pin set', votes: 388 },
    { id: 'o3', label: 'Mini figure', votes: 530 },
  ],
};

export const GAMES = [
  { id: 'trivia', name: 'Pre-event trivia', type: 'Trivia', secs: 45, reward: 40, blurb: 'Three questions. Get two right to unlock earlier entry.' },
  { id: 'spot', name: 'Spot the difference', type: 'Visual puzzle', secs: 60, reward: 35, blurb: 'Find three changes in the right panel.' },
  { id: 'jigsaw', name: 'Jigsaw tiles', type: 'Visual puzzle', secs: 90, reward: 45, blurb: 'Swap tiles to rebuild the picture.' },
  { id: 'squad', name: 'Squad rally', type: 'Squad challenge', secs: 30, reward: 50, blurb: 'Tap with your squad to reach 150 together.' },
  { id: 'poll', name: 'Sponsor poll', type: 'Poll', secs: 30, reward: 15, blurb: 'One vote. See live results.' },
  { id: 'prompt', name: 'Tagline challenge', type: 'Creative prompt', secs: 120, reward: 30, blurb: 'Write a tagline for the event mascot.' },
];

const FIXTURES = {
  booths: BOOTHS, mentions: MENTIONS, alerts: ALERTS,
  sentiment: SENTIMENT_TREND, people: PEOPLE, groups: GROUPS, health: HEALTH, circle: CIRCLE, trusted: TRUSTED,
  support: SUPPORT, products: PRODUCTS, apps: APPS,
};

/* Tiny keyword matcher that stands in for the LLM agent. */
export function botAnswer(text) {
  const t = text.toLowerCase();
  const hit = KB.find((e) => e.k.some((k) => t.includes(k)));
  return hit ? hit.a : 'I do not have that yet. I have logged your question and a team member will reply here.';
}
