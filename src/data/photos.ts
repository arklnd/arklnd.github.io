export interface GalleryPhoto {
  /** Unique slug — used in the URL */
  slug: string;
  /** Image filename in public/images/gallery/ */
  filename: string;
  /** Caption for the photo */
  caption: string;
  /** Date the photo was taken (YYYY-MM-DD) */
  date: string;
  /** Place where the photo was taken (optional) */
  place?: string;
  /** SEO tags / keywords for the photo */
  tags?: string[];
  /** Dedicated alt text for accessibility & image search (falls back to caption) */
  alt?: string;
  /** Camera or device used (e.g. "Moto G64", "Canon EOS R6") */
  camera?: string;
}

export interface Album {
  /** Unique slug — used in the URL */
  slug: string;
  /** Display title of the album */
  title: string;
  /** Optional description */
  description?: string;
  /** Slug of the photo to use as cover; defaults to first photo */
  coverSlug?: string;
  /** Ordered list of photo slugs that belong to this album */
  photoSlugs: string[];
  /** SEO tags / keywords for the album */
  tags?: string[];
  /** Primary location for the album */
  location?: string;
  /** Album date (YYYY-MM-DD) for datePublished in JSON-LD */
  date?: string;
}

const photos: GalleryPhoto[] = [
  // ── Paharpur, 2026-06-19 ──
  {
    slug: "paharpur-20260619-scene-01",
    filename: "paharpur-20260619-scene-01.jpg",
    caption: "Paharpur",
    alt: "Scenic landscape view of Paharpur village with green fields",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["landscape", "village", "rural", "West Bengal"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-scene-02",
    filename: "paharpur-20260619-scene-02.jpg",
    caption: "Paharpur",
    alt: "Wide angle view of Paharpur terrain with dry vegetation",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["landscape", "terrain", "rural", "West Bengal"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-scene-03",
    filename: "paharpur-20260619-scene-03.jpg",
    caption: "Paharpur",
    alt: "Panoramic view of the Paharpur countryside under open sky",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["panorama", "countryside", "sky", "West Bengal"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-scene-04",
    filename: "paharpur-20260619-scene-04.jpg",
    caption: "Paharpur",
    alt: "Rocky hillside at Paharpur with sparse vegetation",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["hills", "rocks", "landscape", "West Bengal"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-bird-on-palm",
    filename: "paharpur-20260619-bird-on-palm.jpg",
    caption: "Bird on a dead palm",
    alt: "A bird perched on a dead palm tree silhouetted against a cloudy sky",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["bird", "palm tree", "wildlife", "silhouette", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-river-valley",
    filename: "paharpur-20260619-river-valley.jpg",
    caption: "River valley",
    alt: "A winding river cutting through a dry valley at Paharpur",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["river", "valley", "landscape", "nature", "water"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-rocky-cliff-river-01",
    filename: "paharpur-20260619-rocky-cliff-river-01.jpg",
    caption: "Rocky cliff and river",
    alt: "Steep rocky cliff face alongside a flowing river",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["cliff", "river", "rocks", "geology", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-river-hills",
    filename: "paharpur-20260619-river-hills.jpg",
    caption: "River and hills",
    alt: "River flowing between dry hills under an overcast sky",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["river", "hills", "landscape", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-dark-rock-face",
    filename: "paharpur-20260619-dark-rock-face.jpg",
    caption: "Dark rock face",
    alt: "Close-up of a dark weathered rock face with textured surface",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["rocks", "geology", "texture", "close-up", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-river-cliff-bare-tree",
    filename: "paharpur-20260619-river-cliff-bare-tree.jpg",
    caption: "River with rocky cliff and bare tree",
    alt: "A bare tree standing on a rocky cliff above a river bend",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["river", "cliff", "bare tree", "landscape", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "paharpur-20260619-rocky-cliffside",
    filename: "paharpur-20260619-rocky-cliffside.jpg",
    caption: "Rocky cliffside",
    alt: "Layered rocky cliffside showing geological formations",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["cliff", "rocks", "geology", "formations", "nature"],
    camera: "Moto G64",
  },
  {
    slug: "img-20260619-172210171",
    filename: "IMG_20260619_172210171.jpg",
    caption: "Paharpur",
    alt: "Landscape view at Paharpur on a June afternoon",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["landscape", "nature", "rural", "West Bengal"],
  },
  {
    slug: "img-20260619-175833084",
    filename: "IMG_20260619_175833084.jpg",
    caption: "Paharpur",
    alt: "Scenic terrain at Paharpur with natural formations",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["landscape", "nature", "rural", "West Bengal"],
  },
  {
    slug: "img-20260619-180905099",
    filename: "IMG_20260619_180905099.jpg",
    caption: "Paharpur",
    alt: "Evening view of the Paharpur countryside",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
    tags: ["landscape", "nature", "rural", "West Bengal"],
  },
  {
    slug: "img-20260617-190601093",
    filename: "IMG_20260617_190601093.jpeg",
    caption: "The Dwarakeswar River",
    alt: "The Dwarakeswar River flowing through the countryside at dusk",
    date: "2026-06-17",
    tags: ["river", "Dwarakeswar", "dusk", "water", "nature"],
  },
  {
    slug: "img-20260517-174154563",
    filename: "IMG_20260517_174154563.jpg",
    caption: "Futiyari Dam",
    alt: "Futiyari Dam reservoir with calm water reflecting the sky",
    date: "2026-05-17",
    tags: ["dam", "reservoir", "water", "Futiyari", "infrastructure"],
  },
  {
    slug: "img-20260517-174031654",
    filename: "IMG_20260517_174031654.jpg",
    caption: "Futiyari Dam",
    alt: "View of Futiyari Dam and its surroundings",
    date: "2026-05-17",
    tags: ["dam", "reservoir", "water", "Futiyari", "infrastructure"],
  },
  {
    slug: "img-20260517-174206858",
    filename: "IMG_20260517_174206858.jpg",
    caption: "Futiyari Dam",
    alt: "Futiyari Dam reservoir from a different angle",
    date: "2026-05-17",
    tags: ["dam", "reservoir", "water", "Futiyari", "infrastructure"],
  },
  {
    slug: "pxl-20260419-171757455",
    filename: "PXL_20260419_171757455.jpg",
    caption: "The Dwarakeswar River",
    alt: "Wide view of the Dwarakeswar River with sandy banks",
    date: "2026-04-19",
    tags: ["river", "Dwarakeswar", "landscape", "water"],
    camera: "Moto G64",
  },
  {
    slug: "pxl-20260419-171757455-png",
    filename: "PXL_20260419_171757455.png",
    caption: "The Dwarakeswar River",
    alt: "The Dwarakeswar River with reflections on the water surface",
    date: "2026-04-19",
    tags: ["river", "Dwarakeswar", "reflections", "water"],
    camera: "Moto G64",
  },
  {
    slug: "img-20260302-141825905",
    filename: "IMG_20260302_141825905.jpg",
    caption: "Outdoor",
    alt: "Photo taken on March 2, 2026",
    date: "2026-03-02",
    tags: ["photography"],
  },
  {
    slug: "img-20260206-154635652",
    filename: "IMG_20260206_154635652.jpg",
    caption: "",
    alt: "Photo taken on February 6, 2026",
    date: "2026-02-06",
    tags: ["photography"],
  },
  {
    slug: "pxl-20260107-174810196",
    filename: "PXL_20260107_174810196.jpg",
    caption: "",
    alt: "Photo taken on January 7, 2026",
    date: "2026-01-07",
    tags: ["photography"],
    camera: "Moto G64",
  },
  {
    slug: "pxl-20260106-151337751",
    filename: "PXL_20260106_151337751.jpg",
    caption: "Indoor",
    alt: "Indoor architectural shot at RDB Primarc Techno Park, Kolkata",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
    tags: ["indoor", "architecture", "office", "Kolkata", "urban"],
    camera: "Moto G64",
  },
  {
    slug: "pxl-20260106-151551465",
    filename: "PXL_20260106_151551465.jpg",
    caption: "Indoor",
    alt: "Interior view of RDB Primarc Techno Park building",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
    tags: ["indoor", "architecture", "office", "Kolkata", "urban"],
    camera: "Moto G64",
  },
  {
    slug: "img-20260106-150926100",
    filename: "IMG_20260106_150926100.jpg",
    caption: "RDB Primarc Techno Park",
    alt: "View inside RDB Primarc Techno Park, Kolkata",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
    tags: ["indoor", "architecture", "office", "Kolkata", "urban"],
  },
  {
    slug: "img-20260106-150942128",
    filename: "IMG_20260106_150942128.jpg",
    caption: "RDB Primarc Techno Park",
    alt: "Interior detail at RDB Primarc Techno Park, Kolkata",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
    tags: ["indoor", "architecture", "office", "Kolkata", "urban"],
  },
  // ── Kolakham, 2025-12-20 ──
  {
    slug: "img-20251220-062804772",
    filename: "IMG_20251220_062804772.jpg",
    caption: "Kolakham",
    alt: "Early morning view at Kolakham village in West Sikkim",
    date: "2025-12-20",
    place: "Kolakham, West Sikkim",
    tags: ["Kolakham", "Sikkim", "forest", "dawn", "mountains", "nature", "travel"],
  },
  {
    slug: "img-20251220-062814776-hdr",
    filename: "IMG_20251220_062814776_HDR.jpg",
    caption: "Kolakham",
    alt: "HDR shot of Kolakham at dawn with misty forested hills",
    date: "2025-12-20",
    place: "Kolakham, West Sikkim",
    tags: ["Kolakham", "Sikkim", "forest", "dawn", "HDR", "mountains", "nature", "travel"],
  },
  // ── Rishop, 2025-12-19/20 ──
  {
    slug: "img-20251220-200019338-hdr",
    filename: "IMG_20251220_200019338_HDR.jpg",
    caption: "Rishop",
    alt: "HDR shot at Rishop on a December evening",
    date: "2025-12-20",
    place: "Rishop, West Bengal",
    tags: ["Rishop", "Kalimpong", "mountains", "HDR", "evening", "nature", "travel"],
  },
  {
    slug: "img-20251219-143756653",
    filename: "IMG_20251219_143756653.jpg",
    caption: "Rishop",
    alt: "Afternoon view at Rishop with forested hills",
    date: "2025-12-19",
    place: "Rishop, West Bengal",
    tags: ["Rishop", "Kalimpong", "mountains", "afternoon", "forest", "nature", "travel"],
  },
  {
    slug: "img-20251028-150905238",
    filename: "IMG_20251028_150905238.jpg",
    caption: "RDB Primarc Techno Park",
    alt: "Photo at RDB Primarc Techno Park, Kolkata on an October afternoon",
    date: "2025-10-28",
    place: "RDB Primarc Techno Park, Kolkata",
    tags: ["architecture", "office", "Kolkata", "urban"],
  },
  {
    slug: "img-20250330-152723182-hdr",
    filename: "IMG_20250330_152723182_HDR.jpg",
    caption: "Way to Sikkim",
    alt: "Mountain road winding through lush green hills on the way to Sikkim",
    date: "2025-03-30",
    place: "Lachen, Sikkim",
    tags: ["mountains", "road", "Sikkim", "Lachen", "hills", "travel", "HDR"],
    camera: "Moto G64",
  },
  {
    slug: "pxl-20221011-173351638",
    filename: "PXL_20221011_173351638.jpg",
    caption: "",
    alt: "Photo taken on October 11, 2022",
    date: "2022-10-11",
    tags: ["photography"],
    camera: "Moto G64",
  },
];

export const albums: Album[] = [
  {
    slug: "paharpur",
    title: "Paharpur",
    description: "Rocky cliffs, a winding river, and dry hills — a June afternoon at Paharpur.",
    coverSlug: "paharpur-20260619-bird-on-palm",
    tags: ["landscape", "nature", "river", "rocks", "cliff", "wildlife", "rural India"],
    location: "Paharpur, West Bengal, India",
    date: "2026-06-19",
    photoSlugs: [
      "paharpur-20260619-scene-01",
      "paharpur-20260619-scene-02",
      "paharpur-20260619-scene-03",
      "paharpur-20260619-scene-04",
      "paharpur-20260619-bird-on-palm",
      "paharpur-20260619-river-valley",
      "paharpur-20260619-rocky-cliff-river-01",
      "paharpur-20260619-river-hills",
      "paharpur-20260619-dark-rock-face",
      "paharpur-20260619-river-cliff-bare-tree",
      "paharpur-20260619-rocky-cliffside",
      "img-20260619-172210171",
      "img-20260619-175833084",
      "img-20260619-180905099",
    ],
  },
  {
    slug: "dwarakeswar-river",
    title: "Dwarakeswar River",
    description: "Photos along the Dwarakeswar River.",
    coverSlug: "img-20260617-190601093",
    tags: ["river", "Dwarakeswar", "water", "nature", "West Bengal"],
    location: "West Bengal, India",
    date: "2026-06-17",
    photoSlugs: [
      "img-20260617-190601093",
      "pxl-20260419-171757455",
      "pxl-20260419-171757455-png",
    ],
  },
  {
    slug: "futiyari-dam",
    title: "Futiyari Dam",
    description: "The Futiyari Dam reservoir and its surroundings.",
    coverSlug: "img-20260517-174154563",
    tags: ["dam", "reservoir", "water", "infrastructure", "Futiyari"],
    location: "West Bengal, India",
    date: "2026-05-17",
    photoSlugs: ["img-20260517-174154563", "img-20260517-174031654", "img-20260517-174206858"],
  },
  {
    slug: "rdb-primarc-techno-park",
    title: "RDB Primarc Techno Park",
    description: "Indoor and outdoor shots at RDB Primarc Techno Park, Kolkata.",
    coverSlug: "pxl-20260106-151337751",
    tags: ["indoor", "outdoor", "architecture", "office", "urban", "Kolkata"],
    location: "Kolkata, West Bengal, India",
    date: "2026-01-06",
    photoSlugs: ["img-20251028-150905238", "pxl-20260106-151337751", "pxl-20260106-151551465", "img-20260106-150926100", "img-20260106-150942128", "img-20260302-141825905"],
  },
  {
    slug: "kolakham",
    title: "Kolakham",
    description: "Dawn in the forests of Kolakham, a quiet village perched in the hills of West Sikkim.",
    coverSlug: "img-20251220-062814776-hdr",
    tags: ["Kolakham", "Sikkim", "forest", "dawn", "mountains", "nature", "travel", "northeast India"],
    location: "Kolakham, West Sikkim, India",
    date: "2025-12-20",
    photoSlugs: ["img-20251220-062804772", "img-20251220-062814776-hdr"],
  },
  {
    slug: "rishop",
    title: "Rishop",
    description: "A December getaway to Rishop — misty forests, mountain views, and quiet hill trails.",
    coverSlug: "img-20251220-200019338-hdr",
    tags: ["Rishop", "Kalimpong", "mountains", "forest", "travel", "northeast India", "West Bengal"],
    location: "Rishop, Kalimpong, West Bengal, India",
    date: "2025-12-19",
    photoSlugs: ["img-20251219-143756653", "img-20251220-200019338-hdr"],
  },
  {
    slug: "way-to-sikkim",
    title: "Way to Sikkim",
    description: "Scenes from the road to Sikkim.",
    coverSlug: "img-20250330-152723182-hdr",
    tags: ["mountains", "road trip", "Sikkim", "Lachen", "hills", "travel", "northeast India"],
    location: "Lachen, Sikkim, India",
    date: "2025-03-30",
    photoSlugs: ["img-20250330-152723182-hdr"],
  },
];

export default photos;
