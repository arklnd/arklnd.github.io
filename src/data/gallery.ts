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

const photos: GalleryPhoto[] = [
  {
    slug: "img-20260617-190601093",
    filename: "IMG_20260617_190601093.jpeg",
    caption: "The Dwarakeswar River",
    date: "2026-06-17",
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
];

export default photos;
