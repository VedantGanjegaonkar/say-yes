// The single source of truth for a form's editable content.
//
// This shape drives BOTH the recipient flow (view2) and the builder (view1):
//   - The recipient reads config.content.<page> instead of hardcoded arrays.
//   - The builder starts from a deep clone of DEFAULT_CONFIG and edits it.
//
// `pages` lists ONLY the middle question pages, in order, each with an
// `enabled` flag. Landing (the ask) and Done (the summary) are always present
// and bracket the flow.

export const PAGE_IDS = ['datepick', 'wheel', 'budget', 'drinks', 'playlist']

export const PAGE_TITLES = {
  datepick: 'Date & time',
  wheel: 'Spin the wheel',
  budget: 'Budget / vibe',
  drinks: 'Drinks',
  playlist: 'Playlist',
}

// Locale constants stay in code — not worth exposing to the builder.
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// The ask / invitation. Left blank by default so the builder shows a
// customised-feeling placeholder and the creator writes their own line.
export const INVITATION_PLACEHOLDER = 'hey Priya… will you go on a date with me? 🌸'
export const INVITATION_QUICK_PICKS = [
  '🌸 Will you go on a date with me? 🌸',
  '💌 Dinner, me & you — this Friday?',
]
// Shown to the recipient when the creator leaves the invitation blank.
export const DEFAULT_INVITATION = INVITATION_QUICK_PICKS[0]

export const DEFAULT_CONFIG = {
  version: 1,
  theme: null, // { primary, accent } — optional; falls back to existing CSS
  sticker: { url: null }, // null → use the bundled frog sticker

  pages: [
    { id: 'datepick', enabled: true },
    { id: 'wheel', enabled: true },
    { id: 'budget', enabled: true },
    { id: 'drinks', enabled: false }, // skipped by default — creator opts in via "Include it"
    { id: 'playlist', enabled: true },
  ],

  content: {
    landing: {
      invitation: '',
      yesLabel: 'Yes 💕',
      noLabel: 'No',
      teases: [
        'No',
        'Are you sure?',
        'Really sure??',
        'Think again 🥺',
        'Last chance!',
        'Please? 💔',
        "You can't catch me!",
      ],
      loaderMessages: ['Processing your yes 💝', 'No take-backs 😌', 'Done ✅'],
    },

    datepick: {
      title: 'Yaaay! When are you free? 💕',
      subtitle: 'Pick a day & time for our date',
      defaultTime: '19:00',
      unlockLines: [
        "I was busy that day... but for you? I'll move everything 💕",
        'Had work then — cancelled. You matter more 🥰',
        'For you, I have ample time. Work can wait 💖',
        "Shifting my whole schedule... done. It's yours 🌸",
      ],
      loaderMessages: [
        'Checking my schedule 📅',
        'Cancelling my meetings 🚮',
        'Telling my mom 🙈',
        'Done ✅',
      ],
    },

    wheel: {
      title: 'Spin for our date spot! 🎡',
      subtitle: 'Let the universe decide where we go...',
      riggedIndex: 2, // the wheel always lands here
      venues: [
        { emoji: '☕', label: 'Cozy cafe' },
        { emoji: '🚗', label: 'Long drive' },
        { emoji: '🌃', label: 'Rooftop dinner' },
        { emoji: '🎬', label: 'Movie night' },
        { emoji: '🍜', label: 'Street food walk' },
        { emoji: '🌅', label: 'Beach sunset' },
      ],
      loaderMessages: ['Calling the venue ☎️', 'Bribing for the best table 😌', 'Done ✅'],
    },

    budget: {
      title: 'How fancy are we going? 💅',
      subtitle: 'Slide to set the vibe',
      noWrong: "(there's no wrong answer — anywhere with you is five-star anyway 💖)",
      bands: [
        { max: 25, emoji: '🍜', label: 'Street food', line: 'Elite taste. Pani-puri dates are the best dates 🍜💕' },
        { max: 50, emoji: '☕', label: 'Cozy cafe', line: 'A quiet corner, two coffees, and you. Perfect ☕💖' },
        { max: 75, emoji: '🍽️', label: 'Fancy dinner', line: "Ooh fancy! I'm ironing my shirt already 😄" },
        { max: 100, emoji: '🥂', label: 'Five star', line: 'Anything for you. Booking the rooftop 🥂' },
      ],
      loaderMessages: ['Breaking my piggy bank 🐷', 'Counting my savings 💸', 'Worth every rupee. Done ✅'],
    },

    drinks: {
      title: 'Pick our poison 😏',
      subtitle: 'What are we drinking on our date?',
      teaseLines: ['🍸 Vodka', 'Not vodka 😜', 'Nope!', 'Try another 🙈', 'Anything but this!'],
      options: [
        { id: 'vodka', label: '🍸 Vodka', tease: true },
        { id: 'whisky', label: '🥃 Whisky' },
        { id: 'skosh', label: '🍹 Skotch' },
        { id: 'ram', label: '🍶 Rum' },
      ],
      loaderMessages: ['Stocking the bar 🍾', 'Hiding the vodka 🙈', 'Done ✅'],
    },

    playlist: {
      title: 'Build our playlist 🍻',
      subtitle: 'Pick all the bangers (multiple allowed)',
      allowCustom: true,
      customLabel: '➕ Any other',
      suggestions: [
        '🎵 Aaoge Tum Kabhi',
        '🎶 Aadat',
        '🎤 Slow Motion Angreza (sing together!)',
      ],
      loaderMessages: [
        'Downloading the songs 🎶',
        'Practicing my singing 🎤',
        'Sealing the deal 💌',
        'Done ✅',
      ],
    },

    done: {
      title: "It's all set! 💕",
      subtitle: "Here's our date plan:",
      closing: "Can't wait to see you! 🌸",
      confetti: '🎉💕🌸✨💖🎊',
      fallbacks: {
        date: 'Whenever you like 💕',
        venue: 'The universe decides 🪄',
        fancy: 'Five star, obviously',
        drink: 'Surprise me!',
        songs: 'Your choice 🎶',
      },
    },
  },
}

// Deep clone helper for the builder's initial working state.
export function cloneDefaultConfig() {
  return structuredClone(DEFAULT_CONFIG)
}
