/* ==========================================
   js/config.js - Static application data
   French Helper - Do not edit at runtime
   =========================================== */

/* ===== ANALYTICS CONFIGURATION ===== */
// Paste your Google Analytics 4 Measurement ID here (e.g. 'G-XXXXXXXXXX')
const GA_MEASUREMENT_ID = 'G-5DYJQ7T0TP'; 

/* ===== MASTER_DATA Dictionary ===== */
const MASTER_DATA = {
    "Bonjour":{en:"Hello",icon:"👋",pronunciation:"bohn-ZHOOR"},"Salut":{en:"Hi",icon:"👋",pronunciation:"sah-LU"},"Merci":{en:"Thank you",icon:"🙏",pronunciation:"mehr-SEE"},"De rien":{en:"You're welcome",icon:"😇",pronunciation:"duh ree-EN"},"Au revoir":{en:"Goodbye",icon:"👋",pronunciation:"oh ruh-VWAHR"},
    "Un":{en:"One",icon:"1️⃣",pronunciation:"uhn"},"Deux":{en:"Two",icon:"2️⃣",pronunciation:"duh"},"Trois":{en:"Three",icon:"3️⃣",pronunciation:"twah"},"Quatre":{en:"Four",icon:"4️⃣",pronunciation:"KAH-truh"},"Cinq":{en:"Five",icon:"5️⃣",pronunciation:"sank"},"Six":{en:"Six",icon:"6️⃣",pronunciation:"seess"},"Sept":{en:"Seven",icon:"7️⃣",pronunciation:"set"},"Huit":{en:"Eight",icon:"8️⃣",pronunciation:"weet"},"Neuf":{en:"Nine",icon:"9️⃣",pronunciation:"nuhf"},"Dix":{en:"Ten",icon:"🔟",pronunciation:"deess"},
    "Rouge":{en:"Red",icon:"🔴",pronunciation:"roozh"},"Bleu":{en:"Blue",icon:"🔵",pronunciation:"bluh"},"Vert":{en:"Green",icon:"🟢",pronunciation:"vehr"},"Jaune":{en:"Yellow",icon:"🟡",pronunciation:"zhohn"},"Orange":{en:"Orange",icon:"🟠",pronunciation:"oh-RAHNZH"},"Rose":{en:"Pink",icon:"🌸",pronunciation:"rohz"},"Noir":{en:"Black",icon:"⚫",pronunciation:"nwahr"},"Blanc":{en:"White",icon:"⚪",pronunciation:"blahn"},"Vio":{en:"Purple",icon:"🟣",pronunciation:"vee-oh-LEH"},"Marron":{en:"Brown",icon:"🟤",pronunciation:"mah-ROHN"},
    "Maman":{en:"Mother",icon:"👩",g:"f",pronunciation:"mah-MAHN"},"Papa":{en:"Father",icon:"👨",g:"m",pronunciation:"pah-PAH"},"Ma sœur":{en:"Sister",icon:"👧",g:"f",pronunciation:"mah SUHR"},"Mon frère":{en:"Brother",icon:"👦",g:"m",pronunciation:"mohn FREHR"},"Grand-mère":{en:"Grandmother",icon:"👵",g:"f",pronunciation:"grahn-MEHR"},"Grand-père":{en:"Grandfather",icon:"👴",g:"m",pronunciation:"grahn-PEHR"},
    "La tête":{en:"Head",icon:"🙆",g:"f",pronunciation:"lah tet"},"Le nez":{en:"Nose",icon:"👃",g:"m",pronunciation:"luh nay"},"La bouche":{en:"Mouth",icon:"👄",g:"f",pronunciation:"lah boosh"},"Les yeux":{en:"Eyes",icon:"👀",g:"m",pronunciation:"lay zyuh"},"Les mains":{en:"Hands",icon:"✋",g:"f",pronunciation:"lay man"},"Les pieds":{en:"Feet",icon:"🦶",g:"m",pronunciation:"lay pee-AY"},"Les oreilles":{en:"Ears",icon:"👂",g:"f",pronunciation:"lay zoh-RAY"},"Le bras":{en:"Arm",icon:"💪",g:"m",pronunciation:"luh brah"},"Le doigt":{en:"Finger",icon:"☝️",g:"m",pronunciation:"luh dwah"},
    "Un chat":{en:"Cat",icon:"🐱",g:"m",pronunciation:"uhn shah"},"Un chien":{en:"Dog",icon:"🐶",g:"m",pronunciation:"uhn shee-EN"},"Un lapin":{en:"Rabbit",icon:"🐰",g:"m",pronunciation:"uhn lah-PAN"},"Un oiseau":{en:"Bird",icon:"🐦",g:"m",pronunciation:"uhn wah-ZOH"},"Un poisson":{en:"Fish",icon:"🐟",g:"m",pronunciation:"uhn pwah-SOHN"},"Une vache":{en:"Cow",icon:"🐮",g:"f",pronunciation:"ewn vahsh"},"Un cheval":{en:"Horse",icon:"🐎",g:"m",pronunciation:"uhn shuh-VAHL"},"Un mouton":{en:"Sheep",icon:"🐑",g:"m",pronunciation:"uhn moo-TOHN"},"Un cochon":{en:"Pig",icon:"🐷",g:"m",pronunciation:"uhn koh-SHOHN"},
    "Une pomme":{en:"Apple",icon:"🍎",g:"f",pronunciation:"ewn pom"},"Une banane":{en:"Banana",icon:"🍌",g:"f",pronunciation:"ewn bah-NAHN"},"Du pain":{en:"Bread",icon:"🥖",g:"m",pronunciation:"dew pan"},"Du lait":{en:"Milk",icon:"🥛",g:"m",pronunciation:"dew leh"},"Une pizza":{en:"Pizza",icon:"🍕",g:"f",pronunciation:"ewn peet-sah"},"Un gâteau":{en:"Cake",icon:"🍰",g:"m",pronunciation:"uhn gah-TOH"},"Du fromage":{en:"Cheese",icon:"🧀",g:"m",pronunciation:"dew froh-MAHZH"},"Une orange":{en:"Orange",icon:"🍊",g:"f",pronunciation:"ewn oh-RAHNZH"},"De l'eau":{en:"Water",icon:"💧",g:"f",pronunciation:"duh loh"},
    "Un livre":{en:"Book",icon:"📖",g:"m",pronunciation:"uhn LEE-vruh"},"Un crayon":{en:"Pencil",icon:"✏️",g:"m",pronunciation:"uhn kray-OHN"},"Un sac":{en:"Bag",icon:"🎒",g:"m",pronunciation:"uhn sahk"},"L'école":{en:"School",icon:"🏫",g:"f",pronunciation:"lay-KOHL"},"Le bureau":{en:"Desk",icon:"🪑",g:"m",pronunciation:"luh bew-ROH"},"Le professeur":{en:"Teacher",icon:"🧑‍🏫",g:"m",pronunciation:"luh proh-fess-UHR"},"Un cahier":{en:"Notebook",icon:"📓",g:"m",pronunciation:"uhn kah-YAY"},"Une règle":{en:"Ruler",icon:"📏",g:"f",pronunciation:"ewn REH-gluh"},
    "Je cours":{en:"I run",icon:"🏃",pronunciation:"zhuh koor"},"Je saute":{en:"I jump",icon:"🦘",pronunciation:"zhuh soht"},"Je chante":{en:"I sing",icon:"🎤",pronunciation:"zhuh shahnt"},"Je danse":{en:"I dance",icon:"💃",pronunciation:"zhuh dahnse"},"Je dors":{en:"I sleep",icon:"😴",pronunciation:"zhuh dohr"},"Je mange":{en:"I eat",icon:"😋",pronunciation:"zhuh mahnzh"},
    "Une chaise":{en:"Chair",icon:"🪑",g:"f",pronunciation:"ewn shez"},"Une table":{en:"Table",icon:"🪵",g:"f",pronunciation:"ewn TAH-bluh"},"Un lit":{en:"Bed",icon:"🛏️",g:"m",pronunciation:"uhn lee"},"Une fenêtre":{en:"Window",icon:"🪟",g:"f",pronunciation:"ewn fuh-NEH-truh"},"Une porte":{en:"Door",icon:"🚪",g:"f",pronunciation:"ewn port"},
    "Une flèche":{en:"Arrow",icon:"🏹",g:"f",pronunciation:"ewn flesh"},"Une fleche":{en:"Arrow",icon:"🏹",g:"f",pronunciation:"ewn flesh"},"Cupidon":{en:"Cupid",icon:"💘",g:"m",pronunciation:"kew-pee-DOHN"},"Un coeur":{en:"Heart",icon:"❤️",g:"m",pronunciation:"uhn kur"},"Un cœur":{en:"Heart",icon:"❤️",g:"m",pronunciation:"uhn kur"},
    "Un cadeau":{en:"Gift",icon:"🎁",g:"m",pronunciation:"uhn kah-DOH"},"Un bouquet de fleurs":{en:"Bouquet",icon:"💐",g:"m",pronunciation:"uhn boo-KEH duh flur"},
    "Un cercle":{en:"Circle",icon:"⭕",g:"m",pronunciation:"uhn SAIR-kluh"},"Un carré":{en:"Square",icon:"🟦",g:"m",pronunciation:"uhn kah-RAY"},"Un triangle":{en:"Triangle",icon:"🔺",g:"m",pronunciation:"uhn tree-AHN-gluh"},"Une étoile":{en:"Star",icon:"⭐",g:"f",pronunciation:"ewn ay-TWAHL"},
    "ami":{en:"friend (male)",icon:"👦",g:"m",pronunciation:"ah-MEE"},"amie":{en:"friend (female)",icon:"👧",g:"f",pronunciation:"ah-MEE"},"aussi":{en:"also",icon:"➕",pronunciation:"oh-SEE"},"alors":{en:"so / then",icon:"⏭️",pronunciation:"ah-LOR"},"aller":{en:"to go",icon:"🚶",pronunciation:"ah-LAY"},"autre":{en:"other",icon:"🔄",pronunciation:"OH-truh"},"avoir":{en:"to have",icon:"✋",pronunciation:"ah-VWAR"},"avant":{en:"before",icon:"⏪",pronunciation:"ah-VAHN"},"avec":{en:"with",icon:"🤝",pronunciation:"ah-VEK"},"bien":{en:"well / good",icon:"👍",pronunciation:"bee-EN"},"bonne":{en:"good (fem.)",icon:"👍",g:"f",pronunciation:"bun"},"bonjour":{en:"hello",icon:"👋",pronunciation:"bohn-ZHOOR"},"beau":{en:"handsome",icon:"😎",g:"m",pronunciation:"boh"},"belle":{en:"beautiful",icon:"💃",g:"f",pronunciation:"bel"},"comme":{en:"like / as",icon:"🤔",pronunciation:"kum"},"comment":{en:"how",icon:"❓",pronunciation:"koh-MAHN"},"devoirs":{en:"homework",icon:"📚",g:"m",pronunciation:"duh-VWAR"},"demain":{en:"tomorrow",icon:"☀️",pronunciation:"duh-MAN"},"des":{en:"some (plural)",icon:"✨",pronunciation:"day"},"écoute":{en:"listen",icon:"👂",pronunciation:"ay-KOOT"},"encore":{en:"again / still",icon:"🔄",pronunciation:"ahn-KOR"},"enfin":{en:"finally",icon:"🏁",pronunciation:"ahn-FAN"},"fait":{en:"fact / done",icon:"✅",pronunciation:"feh"},"fais":{en:"do / make",icon:"🔨",pronunciation:"feh"},"fin":{en:"end",icon:"🏁",g:"f",pronunciation:"fan"},"finir":{en:"to finish",icon:"🏁",pronunciation:"fee-NEER"},"fête":{en:"party",icon:"🎉",g:"f",pronunciation:"fet"},"garçon":{en:"boy",icon:"👦",g:"m",pronunciation:"gar-SOHN"},"grand":{en:"tall (masc.)",icon:"📏",g:"m",pronunciation:"grahn"},"grande":{en:"tall (fem.)",icon:"📏",g:"f",pronunciation:"grahnd"},"habite":{en:"lives",icon:"🏠",pronunciation:"ah-BEET"},"heureux":{en:"happy (masc.)",icon:"😊",g:"m",pronunciation:"uh-RUH"},"jouer":{en:"to play",icon:"🎮",pronunciation:"zhoo-AY"},"les":{en:"the (plural)",icon:"✨",pronunciation:"lay"},"lire":{en:"to read",icon:"📖",pronunciation:"leer"},"lit":{en:"bed",icon:"🛏️",g:"m",pronunciation:"lee"},"marche":{en:"walk / market",icon:"🚶",g:"f",pronunciation:"marsh"},"merci":{en:"thank you",icon:"🙏",pronunciation:"mehr-SEE"},"monsieur":{en:"mister",icon:"👨",g:"m",pronunciation:"muh-SYUH"},"madame":{en:"madam",icon:"👩",g:"f",pronunciation:"mah-DAM"},"mange":{en:"eat",icon:"🍽️",pronunciation:"mahnzh"},"notre":{en:"our",icon:"👪",pronunciation:"NO-truh"},"nouvelle":{en:"new (fem.)",icon:"🆕",g:"f",pronunciation:"noo-VEL"},"oiseau":{en:"bird",icon:"🐦",g:"m",pronunciation:"wah-ZOH"},"pas":{en:"step / not",icon:"🚫",pronunciation:"pah"},"pour":{en:"for",icon:"🎁",pronunciation:"poor"},"pense":{en:"think",icon:"💭",pronunciation:"pahnss"},"pendant":{en:"during",icon:"⏳",pronunciation:"pahn-DAHN"},"quand":{en:"when",icon:"❓",pronunciation:"kahn"},"regarder":{en:"to watch",icon:"👀",pronunciation:"ruh-gar-DAY"},"semaine":{en:"week",icon:"📅",g:"f",pronunciation:"suh-MEN"},"sous":{en:"under",icon:"⬇️",pronunciation:"soo"},"très":{en:"very",icon:"🔥",pronunciation:"treh"},"trop":{en:"too much",icon:"⚠️",pronunciation:"troh"},"travail":{en:"work",icon:"💼",g:"m",pronunciation:"trah-VAHY"},"trouve":{en:"find",icon:"🔍",pronunciation:"troov"},"voici":{en:"here is",icon:"👇",pronunciation:"vwah-SEE"}
};

/* ===== PHONETIC_DICT: Deterministic word-level pronunciation lookup ===== */
const PHONETIC_DICT = {je:"zhuh",tu:"tew",il:"eel",elle:"el",nous:"noo",vous:"voo",ils:"eel",elles:"el",on:"ohn",moi:"mwah",toi:"twah",lui:"lwee",le:"luh",la:"lah",les:"lay",un:"uhn",une:"ewn",des:"day",du:"dew",de:"duh",à:"ah",en:"ahn",pour:"poor",dans:"dahn",sur:"sewr",avec:"ah-vek",sans:"sahn",par:"pahr",chez:"shay",sous:"soo",entre:"ahn-truh",et:"ay",ou:"oo",mais:"meh",que:"kuh",qui:"kee",quoi:"kwah",où:"oo",quand:"kahn",comment:"koh-mahn",pourquoi:"poor-kwah",donc:"dohnk",car:"kahr",ce:"suh",cette:"set",ces:"say",mon:"mohn",ma:"mah",mes:"may",ton:"tohn",ta:"tah",tes:"tay",son:"sohn",sa:"sah",ses:"say",notre:"no-truh",votre:"vo-truh",leur:"luhr",est:"ay",sont:"sohn",a:"ah",ont:"ohn",suis:"swee",es:"ay",sommes:"sum",êtes:"et",ai:"ay",as:"ah",avons:"ah-vohn",avez:"ah-vay",était:"ay-teh",étaient:"ay-teh",sera:"suh-rah",aller:"ah-lay",venir:"vuh-neer",faire:"fehr",dire:"deer",voir:"vwahr",savoir:"sah-vwahr",pouvoir:"poo-vwahr",vouloir:"voo-lwahr",prendre:"prahn-druh",mettre:"meh-truh",donner:"do-nay",parler:"par-lay",aimer:"eh-may",jouer:"zhoo-ay",manger:"mahn-zhay",boire:"bwahr",dormir:"dor-meer",lire:"leer",écrire:"ay-kreer",regarder:"ruh-gar-day",écouter:"ay-koo-tay",chercher:"shair-shay",trouver:"troo-vay",penser:"pahn-say",comprendre:"kom-prahn-druh",attendre:"ah-tahn-druh",cours:"koor",saute:"soht",chante:"shahnt",danse:"dahnss",dors:"dohr",mange:"mahnzh",bois:"bwah",lis:"lee",écris:"ay-kree",parle:"parl",joue:"zhoo",trouve:"troov",pense:"pahnss",regarde:"ruh-gard",écoute:"ay-koot",habite:"ah-beet",rue:"rew",maison:"may-zohn",école:"ay-kohl",fleur:"fluhr",arbre:"arb-ruh",soleil:"so-lay",lune:"lewn",étoile:"ay-twahl",ami:"ah-mee",amie:"ah-mee",garçon:"gar-sohn",fille:"fee-yuh",jour:"zhoor",nuit:"nwee",matin:"mah-tan",soir:"swahr",an:"ahn",année:"ah-nay",mois:"mwah",semaine:"suh-men",temps:"tahn",monde:"mohnd",chose:"shohz",vie:"vee",eau:"oh",feu:"fuh",ciel:"syehl",terre:"tehr",bleu:"bluh",rouge:"roozh",jaune:"zhohn",vert:"vair",blanc:"blahn",noir:"nwahr",rose:"rohz",gris:"gree",marron:"mah-rohn",violet:"vee-oh-lay",orange:"oh-rahnzh",deux:"duh",trois:"twah",quatre:"kah-truh",cinq:"sank",six:"seess",sept:"set",huit:"weet",neuf:"nuhf",dix:"deess",bonjour:"bohn-zhoor",salut:"sah-lew",merci:"mair-see",revoir:"ruh-vwahr",oui:"wee",non:"nohn",au:"oh",aux:"oh",vois:"vwah",voici:"vwah-see",voilà:"vwah-lah",chat:"shah",chien:"shyehn",lapin:"lah-pan",oiseau:"wah-zoh",poisson:"pwah-sohn",vache:"vahsh",cheval:"shuh-vahl",mouton:"moo-tohn",cochon:"koh-shohn",pomme:"pom",banane:"bah-nahn",pain:"pan",lait:"leh",pizza:"peet-sah",gâteau:"gah-toh",fromage:"froh-mahzh",livre:"lee-vruh",crayon:"kray-ohn",sac:"sahk",bureau:"bew-roh",cahier:"kah-yay",règle:"reh-gluh",chaise:"shez",table:"tah-bluh",lit:"lee",fenêtre:"fuh-neh-truh",porte:"port",maman:"mah-mahn",papa:"pah-pah",frère:"frehr",sœur:"suhr",grand:"grahn",mère:"mehr",père:"pehr",tête:"tet",nez:"nay",bouche:"boosh",yeux:"zyuh",mains:"man",pieds:"pee-ay",oreilles:"oh-ray-yuh",bras:"brah",doigt:"dwah",très:"treh",trop:"troh",bien:"bee-en",mal:"mal",peu:"puh",beaucoup:"boh-koo",toujours:"too-zhoor",jamais:"zhah-meh",ici:"ee-see",là:"lah",maintenant:"man-tuh-nahn",après:"ah-preh",avant:"ah-vahn",derrière:"deh-ryehr",devant:"duh-vahn",petit:"puh-tee",bon:"bohn",mauvais:"moh-veh",nouveau:"noo-voh",vieux:"vyuh",jeune:"zhuhn",beau:"boh",ne:"nuh",plus:"plew",rien:"ree-en",tout:"too",toute:"toot",aussi:"oh-see",encore:"ahn-kor",déjà:"day-zhah",demain:"duh-man",vais:"veh",vas:"vah",va:"vah",allons:"ah-lohn",allez:"ah-lay",vont:"vohn",fais:"feh",fait:"feh",faites:"fet",font:"fohn",peux:"puh",peut:"puh",veux:"vuh",veut:"vuh",viens:"vyen",vient:"vyen",prends:"prahn",prend:"prahn",mets:"meh",met:"meh",sais:"say",sait:"say",dis:"dee",dit:"dee",dois:"dwah",doit:"dwah",sort:"sor",sors:"sor",dors:"dohr",pars:"par",part:"par",entends:"ahn-tahn",entend:"ahn-tahn",finit:"fee-nee",ouvre:"oo-vruh",ferme:"fehrm",aime:"em",aimes:"em",aimez:"eh-may",aimons:"eh-mohn",aiment:"em",arrive:"ah-reev",monte:"mohnt",descends:"day-sahn",descend:"day-sahn",onze:"ohnz",douze:"dooz",treize:"trez",quatorze:"kah-torz",quinze:"kanz",seize:"sez",vingt:"van",trente:"trahnt",quarante:"kah-rahnt",cinquante:"san-kahnt",soixante:"swah-sahnt",cent:"sahn",mille:"meel",lundi:"luhn-dee",mardi:"mar-dee",mercredi:"mehr-kruh-dee",jeudi:"zhuh-dee",vendredi:"vahn-druh-dee",samedi:"sam-dee",dimanche:"dee-mahnsh",janvier:"zhahn-vyay",février:"fay-vree-ay",mars:"mars",avril:"ah-vreel",mai:"meh",juin:"zhwan",juillet:"zhwee-yay",août:"oot",septembre:"sep-tahm-bruh",octobre:"ok-toh-bruh",novembre:"noh-vahm-bruh",décembre:"day-sahm-bruh",printemps:"pran-tahn",été:"ay-tay",automne:"oh-ton",hiver:"ee-vehr",pluie:"plwee",neige:"nezh",vent:"vahn",nuage:"nwahzh",chaud:"shoh",froid:"frwah",chapeau:"shah-poh",manteau:"mahn-toh",pantalon:"pahn-tah-lohn",robe:"rob",chemise:"shuh-meez",chaussures:"shoh-sewr",bottes:"bot",chaussettes:"shoh-set",œuf:"uhf",beurre:"buhr",sucre:"sewk-ruh",sel:"sel",viande:"vyahnd",légume:"lay-gewm",carotte:"kah-rot",tomate:"toh-mat",salade:"sah-lahd",soupe:"soop",fraise:"frez",cerise:"suh-reez",raisin:"reh-zan",voiture:"vwah-tewr",bus:"bews",train:"tran",avion:"ah-vyohn",bateau:"bah-toh",vélo:"vay-loh",camion:"kah-myohn",parc:"park",magasin:"mah-gah-zan",bibliothèque:"bee-blee-oh-tek",cuisine:"kwee-zeen",chambre:"shahm-bruh",salle:"sal",hôpital:"oh-pee-tahl",jardin:"zhar-dan",plage:"plazh",forêt:"foh-reh",montagne:"mohn-tah-nyuh",rivière:"ree-vyehr",content:"kohn-tahn",triste:"treest",fatigué:"fah-tee-gay",faim:"fam",soif:"swaf",peur:"puhr",heureux:"uh-ruh",heureuse:"uh-ruhz",drôle:"drohl",gentil:"zhahn-tee",méchant:"may-shahn",couleur:"koo-luhr",nombre:"nohm-bruh",lettre:"leh-truh",mot:"moh",phrase:"fraz",histoire:"ees-twahr",chanson:"shahn-sohn",jeu:"zhuh",bébé:"bay-bay",roi:"rwah",reine:"ren",prince:"prans",princesse:"pran-sess",sorcière:"sor-syehr",fée:"fay",magique:"mah-zheek",ballon:"bah-lohn",poupée:"poo-pay",jouet:"zhoo-eh",cadeau:"kah-doh",anniversaire:"ah-nee-vehr-sehr",fête:"fet",bougie:"boo-zhee",carte:"kart",dessin:"deh-san",peinture:"pan-tewr",musique:"mew-zeek",sport:"spor",football:"foot-bol",natation:"nah-tah-syohn",nage:"nazh",court:"koor",marche:"marsh",promène:"proh-men",promener:"proh-muh-nay",téléphone:"tay-lay-fon",ordinateur:"or-dee-nah-tuhr",tablette:"tah-blet",écran:"ay-krahn",photo:"foh-toh",image:"ee-mazh",vidéo:"vee-day-oh",film:"feelm",monsieur:"muh-syuh",madame:"mah-dahm",devoirs:"duh-vwahr",coeur:"kuhr",cœur:"kuhr",cupidon:"kew-pee-dohn",chocolat:"shoh-koh-lah"};

const SYLLABLE_OVERRIDES = {
    "éléphant": ["é", "lé", "phant"],
    "pomme": ["pom", "me"],
    "garçon": ["gar", "çon"],
    "oiseau": ["oi", "seau"],
    "chocolat": ["cho", "co", "lat"]
};

const presets = { 
    beginner:["Bonjour","Merci","Un","Deux","Trois","Rouge","Bleu","Un chat","Un chien","Une pomme"],
    greetings:["Bonjour","Salut","Merci","Au revoir","De rien"], 
    numbers:["Un","Deux","Trois","Quatre","Cinq","Six","Sept","Huit","Neuf","Dix"], 
    colors:["Rouge","Bleu","Vert","Jaune","Orange","Rose","Noir","Blanc","Vio","Marron"], 
    family:["Maman","Papa","Ma sœur","Mon frère","Grand-mère","Grand-père"], 
    body:["La tête","Le nez","La bouche","Les yeux","Les mains","Les pieds","Les oreilles","Le bras","Le doigt"], 
    animals:["Un chat","Un chien","Un lapin","Un oiseau","Un poisson","Une vache","Un cheval","Un mouton","Un cochon"], 
    food:["Une pomme","Une banane","Du pain","Du lait","Une pizza","Un gâteau","Du fromage","Une orange","De l'eau"], 
    school:["Un livre","Un crayon","Un sac","L'école","Le bureau","Le professeur","Un cahier","Une règle"],
    house:["Une chaise","Une table","Un lit","Une fenêtre","Une porte"],
    actions:["Je cours","Je saute","Je chante","Je danse","Je dors","Je mange"],

    alphabet: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","É","À","È","Ù","Ç"],
    
    spellingBee: [
        "ami", "amie", "aussi", "alors", "aller", "autre", "avoir", "avant", "avec",
        "bien", "bonne", "bonjour", "beau", "belle", "comme", "comment", "devoirs",
        "demain", "des", "écoute", "encore", "enfin", "fait", "fais", "fin", "finir",
        "fête", "garçon", "grand", "grande", "habite", "heureux", "jouer", "les",
        "lire", "lit", "marche", "merci", "monsieur", "madame", "mange", "notre",
        "nouvelle", "oiseau", "pas", "pour", "pense", "pendant", "quand", "regarder",
        "semaine", "sous", "très", "trop", "travail", "trouve", "voici"
    ]
};

const FRENCH_LETTER_NAMES = {
    'A': 'a', 'B': 'bé', 'C': 'cé', 'D': 'dé', 'E': 'e',
    'F': 'effe', 'G': 'gé', 'H': 'hache', 'I': 'i', 'J': 'ji',
    'K': 'ka', 'L': 'elle', 'M': 'emme', 'N': 'enne', 'O': 'o',
    'P': 'pé', 'Q': 'qu', 'R': 'erre', 'S': 'esse', 'T': 'té',
    'U': 'u', 'V': 'vé', 'W': 'double vé', 'X': 'ixe', 'Y': 'i grec', 'Z': 'zed',
    'É': 'e accent aigu', 
    'È': 'e accent grave', 
    'Ê': 'e accent circonflexe', 
    'Ë': 'e tréma',
    'À': 'a accent grave', 
    'Â': 'a accent circonflexe',
    'Î': 'i accent circonflexe', 
    'Ï': 'i tréma',
    'Ô': 'o accent circonflexe',
    'Û': 'u accent circonflexe', 
    'Ù': 'u accent grave',
    'Ç': 'cé cédille',
    'Œ': 'e dans l\'o',
    "'": 'apostrophe', 
    "-": 'trait d’union'
};

const FRENCH_QWERTY_LAYOUT = [
    ["Q","W","E","R","T","Y","U","I","O","P"], // 10
    ["A","S","D","F","G","H","J","K","L", ""], // 9 letters + 1 spacer for Gear
    ["Z","X","C","V","B","N","M","Ç","Œ","Ù"], // 10
    ["É","È","Ê","Ë","À","Â","Î","Ï","Ô","Û"]  // 10
];

const FRENCH_ABCDEF_LAYOUT = [
    ["A","B","C","D","E","F","G","H","I","J"], // 10
    ["K","L","M","N","O","P","Q","R","S", ""], // 9 letters + 1 spacer for Gear
    ["T","U","V","W","X","Y","Z","Ç","Œ","Ù"], // 10
    ["É","È","Ê","Ë","À","Â","Î","Ï","Ô","Û"]  // 10
];