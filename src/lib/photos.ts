/**
 * Archive photographs used around the site. All from the National Library of Ireland on The Commons (Flickr), marked
 * "no known copyright restrictions", via Wikimedia Commons. Cropped of their glass-plate corners and resized into
 * public/photos/<key>-1400.jpg and -700.jpg. Photographs on dúchas.ie belong to the National Folklore Collection and are
 * not used here without its permission.
 */
export type ArchivePhoto = { key: string; w: number; h: number; caption: string; caption_ga: string; year: string; source: string };

export const PHOTOS: Record<string, ArchivePhoto> = {
  school: { key: "school", w: 1400, h: 1034, year: "c. 1902", caption: "Miss Annie Crowe and Mr James Gildea with their pupils, Kilglass National School, Ahascragh, Co. Galway", caption_ga: "Iníon Annie Crowe agus an tUasal James Gildea lena ndaltaí, Scoil Náisiúnta Chill Ghlais, Áth Eascrach, Co. na Gaillimhe", source: "https://commons.wikimedia.org/wiki/File:Mostly_barefoot_schoolchildren_Kilglass_National_School,_Ahascragh,_County_Galway,_1900s_(17254839892).jpg" },
  doorway: { key: "doorway", w: 1097, h: 1900, year: "c. 1900", caption: "An old woman and two boys at the door of a thatched cottage", caption_ga: "Seanbhean agus beirt bhuachaillí ag doras tí cheann tuí", source: "https://commons.wikimedia.org/wiki/File:Old_woman_and_two_young_boys_in_doorway_of_thatched_cottage_(37038903021).jpg" },
  truant: { key: "truant", w: 1400, h: 1264, year: "1910", caption: "Four mitchers caught by the school attendance officer, bicycle and all", caption_ga: "Ceathrar a bhí ag mitseáil, gafa ag an oifigeach freastail scoile, rothar agus uile", source: "https://commons.wikimedia.org/wiki/File:Scholars_captured_by_the_dreaded_attendance_officer_-_Flickr_-_National_Library_of_Ireland_on_The_Commons.jpg" },
  footing: { key: "footing", w: 1400, h: 1058, year: "1885", caption: "Footing the turf near Ballymena, Co. Antrim", caption_ga: "Ag cnuchairt móna in aice le Baile Meánach, Co. Aontroma", source: "https://commons.wikimedia.org/wiki/File:Footing_the_Turf_(8538126493).jpg" },
  turf: { key: "turf", w: 1400, h: 1026, year: "1880s–1890s", caption: "Bringing home the turf in the Square, Tuam, Co. Galway. Robert French, Lawrence Collection", caption_ga: "Ag tabhairt na móna abhaile sa Chearnóg, Tuaim, Co. na Gaillimhe. Robert French, Bailiúchán Lawrence", source: "https://commons.wikimedia.org/wiki/File:Bringing_home_the_turf!_(26972149122).jpg" },
  fair: { key: "fair", w: 1400, h: 1415, year: "1954", caption: "A family in their painted caravan on the road to the Cahirmee horse fair, Buttevant, Co. Cork", caption_ga: "Teaghlach ina gcarbhán péinteáilte ar an mbóthar go hAonach Chathair Mhaoil, Cill na Mullach, Co. Chorcaí", source: "https://commons.wikimedia.org/wiki/File:On_the_road_to_Cahirmee_-_Flickr_-_National_Library_of_Ireland_on_The_Commons.jpg" },
};

export const srcSet = (p: ArchivePhoto) => `/photos/${p.key}-700.jpg 700w, /photos/${p.key}-1400.jpg ${p.w}w`;
