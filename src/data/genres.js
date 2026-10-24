/**
 * MangaLive.uz — Genre Definitions
 * Illustrative placeholder data. Each genre has a slug, Uzbek label, and icon.
 */

export const GENRES = [
  { slug: 'barchasi',        label: 'Barchasi',          icon: '🌟', count: 12 },
  { slug: 'harakatli',       label: 'Harakatli',         icon: '⚡', count: 8  },
  { slug: 'romantik',        label: 'Romantik',          icon: '💜', count: 4  },
  { slug: 'fantaziya',       label: 'Fantaziya',         icon: '🔮', count: 7  },
  { slug: 'komediya',        label: 'Komediya',          icon: '😄', count: 2  },
  { slug: 'jangovar',        label: 'Jangovar',          icon: '⚔️', count: 3  },
  { slug: 'ilmiy-fantastika',label: 'Ilmiy-fantastika',  icon: '🚀', count: 2  },
  { slug: 'sirli',           label: 'Sirli',             icon: '🌙', count: 2  },
  { slug: 'psixologik',      label: 'Psixologik',        icon: '🧠', count: 1  },
  { slug: 'tarixiy',         label: 'Tarixiy',           icon: '🏛️', count: 1  },
  { slug: 'fojiaviy',        label: 'Fojiaviy',          icon: '💔', count: 2  },
  { slug: 'sarguzasht',      label: 'Sarguzasht',        icon: '🗺️', count: 3  },
  { slug: 'maktab',          label: 'Maktab',            icon: '📚', count: 1  },
  { slug: 'isekai',          label: 'Isekai',            icon: '🌀', count: 1  },
  { slug: 'macera',          label: 'Macera',            icon: '🏔️', count: 1  },
  { slug: 'post-apokaliptik',label: 'Post-apokaliptik',  icon: '🌏', count: 1  },
  { slug: 'super-qahramon',  label: 'Super-qahramon',    icon: '🦸', count: 1  },
  { slug: 'ilohiy',          label: 'Ilohiy',            icon: '✨', count: 1  },
];

export function getGenreBySlug(slug) {
  return GENRES.find((g) => g.slug === slug);
}
