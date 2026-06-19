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

export default photos;
