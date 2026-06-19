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
}

const photos: GalleryPhoto[] = [
  // ── Paharpur, 2026-06-19 ──
  {
    slug: "paharpur-20260619-scene-01",
    filename: "paharpur-20260619-scene-01.jpg",
    caption: "Paharpur",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-scene-02",
    filename: "paharpur-20260619-scene-02.jpg",
    caption: "Paharpur",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-scene-03",
    filename: "paharpur-20260619-scene-03.jpg",
    caption: "Paharpur",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-scene-04",
    filename: "paharpur-20260619-scene-04.jpg",
    caption: "Paharpur",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-bird-on-palm",
    filename: "paharpur-20260619-bird-on-palm.jpg",
    caption: "Bird on a dead palm",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-river-valley",
    filename: "paharpur-20260619-river-valley.jpg",
    caption: "River valley",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-rocky-cliff-river-01",
    filename: "paharpur-20260619-rocky-cliff-river-01.jpg",
    caption: "Rocky cliff and river",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-river-hills",
    filename: "paharpur-20260619-river-hills.jpg",
    caption: "River and hills",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-dark-rock-face",
    filename: "paharpur-20260619-dark-rock-face.jpg",
    caption: "Dark rock face",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-river-cliff-bare-tree",
    filename: "paharpur-20260619-river-cliff-bare-tree.jpg",
    caption: "River with rocky cliff and bare tree",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "paharpur-20260619-rocky-cliffside",
    filename: "paharpur-20260619-rocky-cliffside.jpg",
    caption: "Rocky cliffside",
    date: "2026-06-19",
    place: "Paharpur, West Bengal",
  },
  {
    slug: "img-20260617-190601093",
    filename: "IMG_20260617_190601093.jpeg",
    caption: "The Dwarakeswar River",
    date: "2026-06-17",
  },
  {
    slug: "img-20260517-174154563",
    filename: "IMG_20260517_174154563.jpg",
    caption: "Futiyari Dam",
    date: "2026-05-17",
  },
  {
    slug: "pxl-20260419-171757455",
    filename: "PXL_20260419_171757455.jpg",
    caption: "The Dwarakeswar River",
    date: "2026-04-19",
  },
  {
    slug: "pxl-20260419-171757455-png",
    filename: "PXL_20260419_171757455.png",
    caption: "The Dwarakeswar River",
    date: "2026-04-19",
  },
  {
    slug: "img-20260302-141825905",
    filename: "IMG_20260302_141825905.jpg",
    caption: "",
    date: "2026-03-02",
  },
  {
    slug: "img-20260206-154635652",
    filename: "IMG_20260206_154635652.jpg",
    caption: "",
    date: "2026-02-06",
  },
  {
    slug: "pxl-20260107-174810196",
    filename: "PXL_20260107_174810196.jpg",
    caption: "",
    date: "2026-01-07",
  },
  {
    slug: "pxl-20260106-151337751",
    filename: "PXL_20260106_151337751.jpg",
    caption: "Indoor",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
  },
  {
    slug: "pxl-20260106-151551465",
    filename: "PXL_20260106_151551465.jpg",
    caption: "Indoor",
    date: "2026-01-06",
    place: "RDB Primarc Techno Park, Kolkata",
  },
  {
    slug: "img-20250330-152723182-hdr",
    filename: "IMG_20250330_152723182_HDR.jpg",
    caption: "Way to Sikkim",
    date: "2025-03-30",
    place: "Lachen, Sikkim",
  },
  {
    slug: "pxl-20221011-173351638",
    filename: "PXL_20221011_173351638.jpg",
    caption: "",
    date: "2022-10-11",
  },
];

export const albums: Album[] = [
  {
    slug: "dwarakeswar-river",
    title: "Dwarakeswar River",
    description: "Photos along the Dwarakeswar River.",
    coverSlug: "img-20260617-190601093",
    photoSlugs: [
      "img-20260617-190601093",
      "pxl-20260419-171757455",
      "pxl-20260419-171757455-png",
    ],
  },
  {
    slug: "futiyari-dam",
    title: "Futiyari Dam",
    coverSlug: "img-20260517-174154563",
    photoSlugs: ["img-20260517-174154563"],
  },
  {
    slug: "rdb-primarc-techno-park",
    title: "RDB Primarc Techno Park",
    description: "Indoor shots at RDB Primarc Techno Park, Kolkata.",
    coverSlug: "pxl-20260106-151337751",
    photoSlugs: ["pxl-20260106-151337751", "pxl-20260106-151551465"],
  },
  {
    slug: "way-to-sikkim",
    title: "Way to Sikkim",
    description: "Scenes from the road to Sikkim.",
    coverSlug: "img-20250330-152723182-hdr",
    photoSlugs: ["img-20250330-152723182-hdr"],
  },
  {
    slug: "paharpur",
    title: "Paharpur",
    description: "Rocky cliffs, a winding river, and dry hills — a June afternoon at Paharpur.",
    coverSlug: "paharpur-20260619-bird-on-palm",
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
    ],
  },
];

export default photos;
