/** The 1937 Schools' Collection headings children were given, plus the ones ninety years adds. */
export type Topic = { slug: string; name: string; ga: string; era: 1937 | 2027; prompt: string };

export const TOPICS: Topic[] = [
  { slug: "ghosts-and-fairies", name: "Ghosts and Fairies", ga: "Taibhsí agus Sióga", era: 1937, prompt: "Was there a fort, a lone bush or a house nobody would pass at night? What was said about it?" },
  { slug: "local-cures", name: "Local Cures", ga: "Leigheasanna", era: 1937, prompt: "Who had the cure for warts, the sprain, the whooping cough? What did they do?" },
  { slug: "hidden-treasure", name: "Hidden Treasure", ga: "Ór i bhFolach", era: 1937, prompt: "Was gold ever said to be buried near here? Did anyone dig for it?" },
  { slug: "weather-lore", name: "Weather-Lore", ga: "Seanchas na hAimsire", era: 1937, prompt: "How did people know rain was coming? What signs did they read in the sky, the animals, the hills?" },
  { slug: "severe-weather", name: "Severe Weather", ga: "Drochaimsir", era: 1937, prompt: "The Big Snow, the Night of the Big Wind, the flood. What happened and who got stuck where?" },
  { slug: "festival-customs", name: "Festival Customs", ga: "Nósanna Féile", era: 1937, prompt: "What was done on St Brigid's Day, Halloween, Christmas Eve, May Eve, St John's Night?" },
  { slug: "games-i-play", name: "Games We Played", ga: "Cluichí", era: 1937, prompt: "What games were played in the yard, the road, the field? What were the rules and the rhymes?" },
  { slug: "the-local-forge", name: "The Forge, the Mill, the Shop", ga: "An Cheárta", era: 1937, prompt: "Where was the forge, the mill, the creamery, the shop? Who ran it and what went on there?" },
  { slug: "old-schools", name: "Old Schools", ga: "Seanscoileanna", era: 1937, prompt: "What was school like? The teacher, the walk, the slate, the stick, the sod of turf for the fire?" },
  { slug: "the-famine", name: "The Famine Times", ga: "Aimsir an Ghorta", era: 1937, prompt: "What was said in the family about the Famine, the workhouse, the soup, the ones who left?" },
  { slug: "emigration", name: "Emigration and Coming Home", ga: "Imirce", era: 1937, prompt: "Who went to America, England, Australia? Did they come back? Was there an American wake?" },
  { slug: "local-heroes", name: "Local Heroes and Characters", ga: "Laochra Áitiúla", era: 1937, prompt: "Who was the strongest, the fastest, the wittiest, the one everyone still talks about?" },
  { slug: "place-names", name: "Local Place-Names", ga: "Logainmneacha", era: 1937, prompt: "What are the fields, the wells, the hills and the crossroads called, and why?" },
  { slug: "proverbs-riddles", name: "Proverbs, Riddles and Sayings", ga: "Seanfhocail agus Tomhaiseanna", era: 1937, prompt: "What sayings did your grandparents use? What riddles were asked by the fire?" },
  { slug: "food", name: "Food in Olden Times", ga: "Bia Fadó", era: 1937, prompt: "What was eaten, baked, churned, salted? What was the Sunday dinner? Who killed the pig?" },
  { slug: "crafts", name: "Old Crafts and Work", ga: "Ceirdeanna", era: 1937, prompt: "Thatching, basket-making, cutting turf, saving hay, footing turf, spinning. Who did it and how?" },
  { slug: "marriage-customs", name: "Matches, Weddings and Wakes", ga: "Cleamhnas agus Tórramh", era: 1937, prompt: "How did people meet? What was a wake like? Were there matchmakers, straw boys, keeners?" },
  { slug: "animals", name: "Animals and Birds", ga: "Ainmhithe", era: 1937, prompt: "What was believed about the hare, the magpie, the robin, the cuckoo, the first lamb?" },
  { slug: "funny-story", name: "A Funny Story", ga: "Scéal Grinn", era: 1937, prompt: "The one that still gets told at Christmas. Tell it the way they tell it." },
  { slug: "the-day-the-power-came", name: "The Day the Power Came", ga: "Lá an Leictreachais", era: 2027, prompt: "Rural electrification, the first bulb, the first television, the first fridge. Who remembers it?" },
  { slug: "the-phone-and-the-car", name: "The Phone, the Car and the Road", ga: "An Guthán agus an Carr", era: 2027, prompt: "The first phone in the townland, the first car, the day the road was tarred, the bus to town." },
  { slug: "working-away", name: "Working Away", ga: "Ag Obair i gCéin", era: 2027, prompt: "London buildings, Boston bars, the boats, the factory. What was it like and what was sent home?" },
  { slug: "dancing-and-courting", name: "Dancing and Courting", ga: "Rince agus Suirí", era: 2027, prompt: "The dance hall, the marquee, the showband, the walk home. How did they meet your grandmother?" },
  { slug: "big-snow", name: "The Big Snow, the Big Freeze, the Big Wind", ga: "An Sneachta Mór", era: 2027, prompt: "1947, 1963, 1982, 2010, Ophelia, Éowyn. Where were they and what did they do for water and bread?" },
  { slug: "the-match", name: "The Match", ga: "An Cluiche", era: 2027, prompt: "The county final, the parish rivalry, the day they got to Croke Park, the row after." },
  { slug: "the-spring-of-2020", name: "The Spring of 2020", ga: "Earrach 2020", era: 2027, prompt: "Where were they when the country stopped? Who left the shopping at the door?" },
  { slug: "coming-to-ireland", name: "Coming to Ireland", ga: "Teacht go hÉirinn", era: 2027, prompt: "Where did the family come from, and why? What was the first day here like, what did they bring, and what do they miss?" },
  { slug: "what-to-remember", name: "What They Want Remembered", ga: "An Rud ba Mhaith Leo a Mheabhrú", era: 2027, prompt: "Ask them straight: what should the people of 2117 know about this place and this family?" },
];
export const topicBySlug = (slug: string) => TOPICS.find(t => t.slug === slug) ?? null;
export const AGE_BANDS = ["under 8", "8 to 9", "10 to 12", "13 to 15", "16 to 18", "adult"];
export const DECADES = ["1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "later"];
export const RELATIONS = ["grandmother", "grandfather", "great-grandparent", "mother", "father", "aunt or uncle", "neighbour", "family friend", "other"];
