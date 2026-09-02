// on codeforces and atcoder the colour of a handle *is* its rating — people
// read the colour before they read the number, and a leaderboard without it is
// just a list of names. this is the one table both pages use, because keeping a
// copy per page is how the two drifted apart in the first place.
//
// the colours themselves live in --rank-* in index.css and are paired per
// theme. never hardcode a hex at the call site: the official palettes are drawn
// for a white page and every one of them fails contrast on one of our themes.

// upper bound, exclusive -> colour name
const CODEFORCES_BANDS = [
  [1200, 'gray'], // newbie
  [1400, 'green'], // pupil
  [1600, 'cyan'], // specialist
  [1900, 'blue'], // expert
  [2100, 'violet'], // candidate master
  [2400, 'orange'], // master and international master
  [Infinity, 'red'], // grandmaster upwards
];

const ATCODER_BANDS = [
  [400, 'gray'],
  [800, 'brown'],
  [1200, 'green'],
  [1600, 'cyan'],
  [2000, 'blue'],
  [2400, 'yellow'],
  [2800, 'orange'],
  [Infinity, 'red'],
];

// used when a member has a handle but no rating yet — the api still sends the
// title, and on atcoder the title is already the colour name
const CODEFORCES_TITLES = {
  newbie: 'gray',
  pupil: 'green',
  specialist: 'cyan',
  expert: 'blue',
  'candidate master': 'violet',
  master: 'orange',
  'international master': 'orange',
  grandmaster: 'red',
  'international grandmaster': 'red',
  'legendary grandmaster': 'legendary',
};

const band = (bands, rating) => {
  if (rating === null || rating === undefined || Number.isNaN(rating)) return null;
  const hit = bands.find(([upper]) => rating < upper);
  return hit ? hit[1] : null;
};

export const codeforcesColour = (rating) => band(CODEFORCES_BANDS, rating);
export const atcoderColour = (rating) => band(ATCODER_BANDS, rating);

// rating first, title only as a fallback — "international master" contains
// "master", so matching titles by substring picks the wrong colour
export function rankColour(platform, rating, title) {
  const byRating = platform === 'atcoder' ? atcoderColour(rating) : codeforcesColour(rating);
  if (byRating) return byRating;

  const key = (title || '').trim().toLowerCase();
  if (!key) return null;
  if (platform === 'atcoder') {
    return ATCODER_BANDS.some(([, name]) => name === key) ? key : null;
  }
  return CODEFORCES_TITLES[key] ?? null;
}

// returns '' rather than a bare class so an unrated member simply inherits
export const rankClass = (colour) => (colour ? `rank-${colour}` : '');

// convenience for the common case: one call from a table cell or a heading
export const rankClassFor = (platform, rating, title) =>
  rankClass(rankColour(platform, rating, title));
