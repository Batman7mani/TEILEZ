// src/data/categoryImages.js
//
// One real, category-correct photo per part type, centralized here so
// every component (Nav mega-menu, product grid, product page) pulls
// from the same source and never shows a mismatched image.
//
// Swap any of these for your own real product photography later —
// just replace the URL string, nothing else needs to change.

export const CATEGORY_IMAGES = {
  bumper1: 'https://c4.wallpaperflare.com/wallpaper/456/792/25/the-sun-light-the-city-bmw-wallpaper-preview.jpg',
  bumper2: 'https://w0.peakpx.com/wallpaper/791/941/HD-wallpaper-2020-toyota-camry-trd-rear-bumper-car.jpg',
  bumper3: 'https://c4.wallpaperflare.com/wallpaper/872/794/389/2016-rolls-royce-wraith-wallpaper-thumb.jpg',
  brake1:  'https://www.forgemotorsport.asia/userfiles/images/sys/products/356mm_6pot_Big_Brake_Kit_for_Golf_Mk7_Audi_S3_8V_Chassis_65723jpeg.jpg',
  brake2:  'https://www.performancemachine.com/assets/images/products/4-piston-rear-caliper-bracket_27.jpg',
  brake3:  'https://www.motocorsestore.com/48650-large_default/pair-of-sicom-t-drive-330x6mm-carbon-ceramic-front-brake-discs-for-ducati-10981198-panigalestreetfighter-v4-desmosedici-rr.jpg',
  tire1:   'https://ytc-bm.s3.us-east-2.amazonaws.com/ADVAN-APEX-V601-3QL-WEB.png',
  tire2:   'https://m.media-amazon.com/images/I/71ROiai1FKL.jpg',
  wrap1:   'https://i.ytimg.com/vi/IGbkFt_Ypuo/hq720.jpg?sqp=-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYAC0AWKAgwIABABGGUgZShlMA8=&rs=AOn4CLBmr4d9AnLKhi6ZHUkTqh-hqPOxEw',
  wrap2:   'https://i.etsystatic.com/9789225/r/il/7ed2a9/6932341605/il_570xN.6932341605_i2et.jpg',
  decal1:  'https://store.ijdmtoy.com/cdn/shop/products/double-bar-rally-stripe-10_918x700.jpg?v=1613427321',
  decal2:  'https://cdn.ecommercedns.uk/files/7/239087/7/37784077/p-example3.png',
}

export function getCategoryImage(cat) {
  return CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.bumpers
}