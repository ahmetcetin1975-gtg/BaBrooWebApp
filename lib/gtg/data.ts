export type SwiperItem = {
  Id: number;
  Title: string;
  Description: string;
  ButtonTitle: string;
  ImagePath: string;
};

export type ServicesItem = {
  Id: number;
  Icon: string;
  Title: string;
  Desc: string;
};

export function getIndexSlider(): SwiperItem[] {
  return [
    {
      Id: 1,
      Title: "LCOD_TEXT_SLIDER_INDEX_TEXT1",
      Description: "LCOD_TEXT_SLIDER_INDEX_DESC1",
      ButtonTitle: "LCOD_TEXT_SLIDER_INDEX_BUTTON1",
      ImagePath: "/assets/images/gotradego/connect-world.jpg",
    },
    {
      Id: 2,
      Title: "LCOD_TEXT_SLIDER_INDEX_TEXT2",
      Description: "LCOD_TEXT_SLIDER_INDEX_DESC2",
      ButtonTitle: "LCOD_TEXT_SLIDER_INDEX_BUTTON2",
      ImagePath: "/assets/images/gotradego/product-spotlight.jpg",
    },
    {
      Id: 3,
      Title: "LCOD_TEXT_SLIDER_INDEX_TEXT3",
      Description: "LCOD_TEXT_SLIDER_INDEX_DESC3",
      ButtonTitle: "LCOD_TEXT_SLIDER_INDEX_BUTTON3",
      ImagePath: "/assets/images/gotradego/success.png",
    },
  ];
}

export function getServicesData(): ServicesItem[] {
  return [
    {
      Id: 4,
      Icon: "uil uil-folder-plus",
      Title: "LCOD_TEXT_SERVICES_INDEX_TITLE1",
      Desc: "LCOD_TEXT_SERVICES_INDEX_DESC1",
    },
    {
      Id: 1,
      Icon: "uil uil-user-arrows",
      Title: "LCOD_TEXT_SERVICES_INDEX_TITLE2",
      Desc: "LCOD_TEXT_SERVICES_INDEX_DESC2",
    },
    {
      Id: 2,
      Icon: "uil uil-percentage",
      Title: "LCOD_TEXT_SERVICES_INDEX_TITLE3",
      Desc: "LCOD_TEXT_SERVICES_INDEX_DESC3",
    },
    {
      Id: 3,
      Icon: "uil uil-exchange",
      Title: "LCOD_TEXT_SERVICES_INDEX_TITLE4",
      Desc: "LCOD_TEXT_SERVICES_INDEX_DESC4",
    },
  ];
}

export function getAdvantagesData(): ServicesItem[] {
  return [
    {
      Id: 4,
      Icon: "uil uil-hourglass",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE1",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC1",
    },
    {
      Id: 1,
      Icon: "uil uil-presentation-plus",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE2",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC2",
    },
    {
      Id: 2,
      Icon: "uil uil-exchange-alt",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE3",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC3",
    },
    {
      Id: 3,
      Icon: "uil uil-book-open",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE4",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC4",
    },
    {
      Id: 5,
      Icon: "uil uil-sitemap",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE5",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC5",
    },
    {
      Id: 6,
      Icon: "uil uil-building",
      Title: "LCOD_TEXT_ADVANTAGES_INDEX_TITLE6",
      Desc: "LCOD_TEXT_ADVANTAGES_INDEX_DESC6",
    },
  ];
}

export function getProductImages(): string[] {
  return [
    "/assets/images/gotradego/index/fur4.jpg",
    "/assets/images/gotradego/index/patates.png",
    "/assets/images/gotradego/index/auto2.jpg",
    "/assets/images/gotradego/index/bulgur.jpg",
    "/assets/images/gotradego/index/machine2.jpg",
    "/assets/images/gotradego/index/yesil-mercimek.jpg",
    "/assets/images/gotradego/index/textile3.jpg",
    "/assets/images/gotradego/index/elec4.jpg",
    "/assets/images/gotradego/index/fur6.jpg",
    "/assets/images/gotradego/index/fur1.jpg",
    "/assets/images/gotradego/index/badem.png",
    "/assets/images/gotradego/index/zeytinyagi.png",
    "/assets/images/gotradego/index/auto4.jpg",
    "/assets/images/gotradego/index/kaju.jpg",
    "/assets/images/gotradego/index/elec3.jpg",
    "/assets/images/gotradego/index/textile1.jpg",
    "/assets/images/gotradego/index/auto3.jpg",
    "/assets/images/gotradego/index/elec1.jpg",
    "/assets/images/gotradego/index/fur2.jpg",
    "/assets/images/gotradego/index/fur8.jpg",
    "/assets/images/gotradego/index/textile2.jpg",
    "/assets/images/gotradego/index/kirmizi-mercimek.jpg",
    "/assets/images/gotradego/index/tuzlu-fistik.png",
    "/assets/images/gotradego/index/machine1.jpg",
    "/assets/images/gotradego/index/elec2.jpg",
    "/assets/images/gotradego/index/textile5.jpg",
    "/assets/images/gotradego/index/fur5.jpg",
    "/assets/images/gotradego/index/service1.jpg",
    "/assets/images/gotradego/index/pirinc.png",
    "/assets/images/gotradego/index/fur3.jpg",
    "/assets/images/gotradego/index/auto1.jpg",
    "/assets/images/gotradego/index/misir.jpg",
    "/assets/images/gotradego/index/fur7.jpg",
    "/assets/images/gotradego/index/textile4.jpg",
  ];
}

export function getPersonImages(): string[] {
  return [
    "/assets/images/gotradego/services/fts1.jpeg",
    "/assets/images/gotradego/services/services3.jpg",
    "/assets/images/gotradego/services/fts2.jpg",
    "/assets/images/gotradego/services/services4.jpg",
    "/assets/images/gotradego/services/op1.jpg",
    "/assets/images/gotradego/services/services1.jpg",
    "/assets/images/gotradego/services/fts3.jpg",
    "/assets/images/gotradego/services/services2.jpg",
  ];
}

export function getVideoData(): string[] {
  return [
    "https://www.youtube.com/embed/t5_dOuUbEm4?rel=0&autoplay=0&loop=0&playlist=t5_dOuUbEm4",
    "https://www.youtube.com/embed/HUtSejsk1WA?rel=0&autoplay=0&loop=0&playlist=HUtSejsk1WA",
    "https://www.youtube.com/embed/HGCHg_mKE0E?rel=0&autoplay=0&loop=0&playlist=HGCHg_mKE0E",
    "https://www.youtube.com/embed/SC2EtCOVfcM?rel=0&autoplay=0&loop=0&playlist=SC2EtCOVfcM",
    "https://www.youtube.com/embed/29fz78dQpNE?rel=0&autoplay=0&loop=0&playlist=29fz78dQpNE",
    "https://www.youtube.com/embed/Nzsftvqc4oQ?rel=0&autoplay=0&loop=0&playlist=Nzsftvqc4oQ",
  ];
}

export function getVideoData2(): string[] {
  return [
    "",
    "https://www.youtube.com/embed/t5_dOuUbEm4?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/HUtSejsk1WA?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/gK-kNybWHB0?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/HGCHg_mKE0E?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/SC2EtCOVfcM?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/29fz78dQpNE?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/Nzsftvqc4oQ?rel=0&autoplay=0&loop=0",
  ];
}

export function getHowDoesItWorkVideoData(): string[] {
  return [
    "https://www.youtube.com/embed/t5_dOuUbEm4?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/HUtSejsk1WA?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/gK-kNybWHB0?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/HGCHg_mKE0E?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/SC2EtCOVfcM?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/29fz78dQpNE?rel=0&autoplay=0&loop=0",
    "https://www.youtube.com/embed/Nzsftvqc4oQ?rel=0&autoplay=0&loop=0",
  ];
}

export function getProductData(): { title: string; value: number }[] {
  return [
    { title: "LCOD_LBL_UPLOAD_PRODUCT_FREE_BAR_TEXT_1", value: 50 },
    { title: "LCOD_LBL_UPLOAD_PRODUCT_FREE_BAR_TEXT_2", value: 24 },
    { title: "LCOD_LBL_UPLOAD_PRODUCT_FREE_BAR_TEXT_3", value: 15 },
    { title: "LCOD_LBL_UPLOAD_PRODUCT_FREE_BAR_TEXT_4", value: 11 },
  ];
}

export function getPersonData(): { title: string; value: number }[] {
  return [
    { title: "LCOD_LBL_SERVICE_ARE_HERE_BAR_TEXT_1", value: 55 },
    { title: "LCOD_LBL_SERVICE_ARE_HERE_BAR_TEXT_2", value: 15 },
    { title: "LCOD_LBL_SERVICE_ARE_HERE_BAR_TEXT_3", value: 15 },
    { title: "LCOD_LBL_SERVICE_ARE_HERE_BAR_TEXT_4", value: 15 },
    { title: "LCOD_LBL_SERVICE_ARE_HERE_BAR_TEXT_5", value: 10 },
  ];
}

export function getRegisterData(): { icon: string; title: string; href: string }[] {
  return [
    {
      icon: "uil uil-export",
      title: "LCOD_LBL_DO_EXPORT",
      href: "https://app.gotradego.com/app.gotradego/seller/auth-register-seller.asp",
    },
    {
      icon: "uil uil-import",
      title: "LCOD_LBL_DO_IMPORT",
      href: "https://app.gotradego.com/app.gotradego/buyer/auth-register-seller.asp",
    },
    {
      icon: "uil uil-users-alt",
      title: "LCOD_LBL_BE_AN_EXPERT",
      href: "https://app.gotradego.com/app.gotradego/expert/auth-register-seller.asp",
    },
  ];
}

export function getCounterData(): { target: number; title: string }[] {
  return [
    { target: 3452, title: "Investment Projects" },
    { target: 15, title: "Years of Experience" },
    { target: 54, title: "Offices in the World" },
    { target: 247, title: "Successful Cases" },
  ];
}


