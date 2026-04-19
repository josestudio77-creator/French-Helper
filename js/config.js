/* ==========================================
   js/config.js - Static application data
   French Helper - Do not edit at runtime
   =========================================== */

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
    'É': 'é', 'À': 'a accent grave', 'È': 'e accent grave', 'Ç': 'c cédille',
    'Ù': 'u accent grave', 'Û': 'u accent circonflexe', 'Î': 'i accent circonflexe',
    "'": 'apostrophe', '-': 'trait d’union', 'Œ': 'e dans l\'o'
};

const FRENCH_QWERTY_LAYOUT = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["Z","X","C","V","B","N","M"],
    ["É","È","Ê","À","Â","Î","Ï"],
    ["Ô","Û","Ù","Ç","Œ","'"]
];

