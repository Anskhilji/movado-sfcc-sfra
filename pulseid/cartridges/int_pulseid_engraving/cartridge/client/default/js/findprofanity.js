module.exports = {
   findprofanity: function(input) {
      var bad_words=[
         "a55",
         "a55hole",
         "aeolus",
         "ahole",
         "anal",
         "analprobe",
         "anilingus",
         "anus",
         "areola",
         "areole",
         "arian",
         "aryan",
         "ass",
         "assbang",
         "assbanged",
         "assbangs",
         "asses",
         "assfuck",
         "assfucker",
         "assh0le",
         "asshat",
         "assho1e",
         "ass hole",
         "assholes",
         "assmaster",
         "assmunch",
         "asswipe",
         "asswipes",
         "azazel",
         "azz",
         "b1tch",
         "babe",
         "babes",
         "ballsack",
         "bang",
         "banger",
         "barf",
         "bastard",
         "bastards",
         "bawdy",
         "beaner",
         "beardedclam",
         "beastiality",
         "beatch",
         "beater",
         "beaver",
         "beer",
         "beeyotch",
         "beotch",
         "biatch",
         "bigtits",
         "big tits",
         "bimbo",
         "bitch",
         "bitched",
         "bitches",
         "bitchy",
         "blow job",
         "blow",
         "blowjob",
         "blowjobs",
         "bod",
         "bodily",
         "boink",
         "bollock",
         "bollocks",
         "bollok",
         "bone",
         "boned",
         "boner",
         "boners",
         "bong",
         "boob",
         "boobies",
         "boobs",
         "booby",
         "booger",
         "bookie",
         "bootee",
         "bootie",
         "booty",
         "booze",
         "boozer",
         "boozy",
         "bosom",
         "bosomy",
         "bowel",
         "bowels",
         "bra",
         "brassiere",
         "breast",
         "breasts",
         "bugger",
         "bukkake",
         "bullshit",
         "bull shit",
         "bullshits",
         "bullshitted",
         "bullturds",
         "bung",
         "busty",
         "butt",
         "butt fuck",
         "buttfuck",
         "buttfucker",
         "buttplug",
         "c.0.c.k",
         "c.o.c.k.",
         "c.u.n.t",
         "c0ck",
         "c-0-c-k",
         "caca",
         "cahone",
         "cameltoe",
         "carpetmuncher",
         "cawk",
         "cervix",
         "chinc",
         "chincs",
         "chink",
         "chode",
         "chodes",
         "cl1t",
         "climax",
         "clit",
         "clitoris",
         "clitorus",
         "clits",
         "clitty",
         "cocain",
         "cocaine",
         "cock",
         "c-o-c-k",
         "cockblock",
         "cockholster",
         "cockknocker",
         "cocks",
         "cocksmoker",
         "cocksucker",
         "cock sucker",
         "coital",
         "commie",
         "condom",
         "coon",
         "coons",
         "corksucker",
         "crabs",
         "crack",
         "cracker",
         "crackwhore",
         "crap",
         "crappy",
         "cum",
         "cummin",
         "cumming",
         "cumshot",
         "cumshots",
         "cumslut",
         "cumstain",
         "cunilingus",
         "cunnilingus",
         "cunny",
         "cunt",
         "c-u-n-t",
         "cuntface",
         "cunthunter",
         "cuntlick",
         "cuntlicker",
         "cunts",
         "d0ng",
         "d0uch3",
         "d0uche",
         "d1ck",
         "d1ld0",
         "d1ldo",
         "dago",
         "dagos",
         "dammit",
         "damn",
         "damned",
         "damnit",
         "dawgie-style",
         "dick",
         "dickbag",
         "dickdipper",
         "dickface",
         "dickflipper",
         "dickhead",
         "dickheads",
         "dickish",
         "dick-ish",
         "dickripper",
         "dicksipper",
         "dickweed",
         "dickwhipper",
         "dickzipper",
         "diddle",
         "dike",
         "dildo",
         "dildos",
         "diligaf",
         "dillweed",
         "dimwit",
         "dingle",
         "dipship",
         "doggie-style",
         "doggy-style",
         "dong",
         "doofus",
         "doosh",
         "dopey",
         "douch3",
         "douche",
         "douchebag",
         "douchebags",
         "douchey",
         "drunk",
         "dumass",
         "dumbass",
         "dumbasses",
         "dummy",
         "dyke",
         "dykes",
         "ejaculate",
         "enlargement",
         "erect",
         "erection",
         "erotic",
         "essohbee",
         "extacy",
         "extasy",
         "f.u.c.k",
         "fack",
         "fag",
         "fagg",
         "fagged",
         "faggit",
         "faggot",
         "fagot",
         "fags",
         "faig",
         "faigt",
         "fannybandit",
         "fart",
         "fartknocker",
         "fat",
         "felch",
         "felcher",
         "felching",
         "fellate",
         "fellatio",
         "feltch",
         "feltcher",
         "fisted",
         "fisting",
         "fisty",
         "floozy",
         "foad",
         "fondle",
         "foobar",
         "foreskin",
         "freex",
         "frigg",
         "frigga",
         "fubar",
         "fuck",
         "f-u-c-k",
         "fuckass",
         "fucked",
         "fucker",
         "fuckface",
         "fuckin",
         "fucking",
         "fucknugget",
         "fucknut",
         "fuckoff",
         "fucks",
         "fucktard",
         "fuck-tard",
         "fuckup",
         "fuckwad",
         "fuckwit",
         "fudgepacker",
         "fuk",
         "fvck",
         "fxck",
         "gae",
         "gai",
         "ganja",
         "gay",
         "gays",
         "gey",
         "gfy",
         "ghay",
         "ghey",
         "gigolo",
         "glans",
         "goatse",
         "godamn",
         "godamnit",
         "goddam",
         "goddammit",
         "goddamn",
         "goldenshower",
         "gonad",
         "gonads",
         "gook",
         "gooks",
         "gringo",
         "gspot",
         "g-spot",
         "gtfo",
         "guido",
         "h0m0",
         "h0mo",
         "handjob",
         "hard on",
         "he11",
         "hebe",
         "heeb",
         "hell",
         "hemp",
         "heroin",
         "herp",
         "herpes",
         "herpy",
         "hitler",
         "hiv",
         "hobag",
         "hom0",
         "homey",
         "homo",
         "homoey",
         "honky",
         "hooch",
         "hookah",
         "hooker",
         "hoor",
         "hootch",
         "hooter",
         "hooters",
         "horny",
         "hump",
         "humped",
         "humping",
         "hussy",
         "hymen",
         "inbred",
         "incest",
         "injun",
         "j3rk0ff",
         "jackass",
         "jackhole",
         "jackoff",
         "jap",
         "japs",
         "jerk",
         "jerk0ff",
         "jerked",
         "jerkoff",
         "jism",
         "jiz",
         "jizm",
         "jizz",
         "jizzed",
         "junkie",
         "junky",
         "kike",
         "kikes",
         "kill",
         "kinky",
         "kkk",
         "klan",
         "knobend",
         "kooch",
         "kooches",
         "kootch",
         "kraut",
         "kyke",
         "labia",
         "lech",
         "leper",
         "lesbians",
         "lesbo",
         "lesbos",
         "lez",
         "lezbian",
         "lezbians",
         "lezbo",
         "lezbos",
         "lezzie",
         "lezzies",
         "lezzy",
         "lmao",
         "lmfao",
         "loin",
         "loins",
         "lube",
         "lusty",
         "mams",
         "massa",
         "masterbate",
         "masterbating",
         "masterbation",
         "masturbate",
         "masturbating",
         "masturbation",
         "maxi",
         "menses",
         "menstruate",
         "menstruation",
         "meth",
         "m-fucking",
         "mofo",
         "molest",
         "moolie",
         "moron",
         "motherfucka",
         "motherfucker",
         "motherfucking",
         "mtherfucker",
         "mthrfucker",
         "mthrfucking",
         "muff",
         "muffdiver",
         "murder",
         "muthafuckaz",
         "muthafucker",
         "mutherfucker",
         "mutherfucking",
         "muthrfucking",
         "nad",
         "nads",
         "naked",
         "napalm",
         "nappy",
         "nazi",
         "nazism",
         "negro",
         "nigga",
         "niggah",
         "niggas",
         "niggaz",
         "nigger",
         "niggers",
         "niggle",
         "niglet",
         "nimrod",
         "ninny",
         "nipple",
         "nooky",
         "nympho",
         "opiate",
         "opium",
         "oral",
         "orally",
         "organ",
         "orgasm",
         "orgasmic",
         "orgies",
         "orgy",
         "ovary",
         "ovum",
         "ovums",
         "p.u.s.s.y.",
         "paddy",
         "paki",
         "pantie",
         "panties",
         "panty",
         "pastie",
         "pasty",
         "pcp",
         "pecker",
         "pedo",
         "pedophile",
         "pedophilia",
         "pedophiliac",
         "pee",
         "peepee",
         "penetrate",
         "penetration",
         "penial",
         "penile",
         "penis",
         "perversion",
         "peyote",
         "phalli",
         "phallic",
         "phuck",
         "pillowbiter",
         "pimp",
         "pinko",
         "piss",
         "pissed",
         "pissoff",
         "piss-off",
         "pms",
         "polack",
         "pollock",
         "poon",
         "poontang",
         "porn",
         "porno",
         "pornography",
         "pot",
         "potty",
         "prick",
         "prig",
         "prostitute",
         "prude",
         "pube",
         "pubic",
         "pubis",
         "punkass",
         "punky",
         "puss",
         "pussies",
         "pussy",
         "pussypounder",
         "puto",
         "queaf",
         "queef",
         "queer",
         "queero",
         "queers",
         "quicky",
         "quim",
         "racy",
         "rape",
         "raped",
         "raper",
         "rapist",
         "raunch",
         "rectal",
         "rectum",
         "rectus",
         "reefer",
         "reetard",
         "reich",
         "retard",
         "retarded",
         "revue",
         "rimjob",
         "ritard",
         "rtard",
         "r-tard",
         "rum",
         "rump",
         "rumprammer",
         "ruski",
         "s.h.i.t.",
         "s.o.b.",
         "s0b",
         "sadism",
         "sadist",
         "scag",
         "scantily",
         "schizo",
         "schlong",
         "screw",
         "screwed",
         "scrog",
         "scrot",
         "scrote",
         "scrotum",
         "scrud",
         "scum",
         "seaman",
         "seamen",
         "seduce",
         "semen",
         "sex",
         "sexual",
         "sh1t",
         "s-h-1-t",
         "shamedame",
         "shit",
         "s-h-i-t",
         "shite",
         "shiteater",
         "shitface",
         "shithead",
         "shithole",
         "shithouse",
         "shits",
         "shitt",
         "shitted",
         "shitter",
         "shitty",
         "shiz",
         "sissy",
         "skag",
         "skank",
         "slave",
         "sleaze",
         "sleazy",
         "slut",
         "slutdumper",
         "slutkiss",
         "sluts",
         "smegma",
         "smut",
         "smutty",
         "snatch",
         "sniper",
         "snuff",
         "s-o-b",
         "sodom",
         "souse",
         "soused",
         "sperm",
         "spic",
         "spick",
         "spik",
         "spiks",
         "spooge",
         "spunk",
         "steamy",
         "stfu",
         "stiffy",
         "stoned",
         "strip",
         "stroke",
         "stupid",
         "suck",
         "sucked",
         "sucking",
         "sumofabiatch",
         "t1t",
         "tampon",
         "tard",
         "tawdry",
         "teabagging",
         "teat",
         "terd",
         "teste",
         "testee",
         "testes",
         "testicle",
         "testis",
         "thrust",
         "thug",
         "tinkle",
         "tit",
         "titfuck",
         "titi",
         "tits",
         "tittiefucker",
         "titties",
         "titty",
         "tittyfuck",
         "tittyfucker",
         "toke",
         "toots",
         "tramp",
         "transsexual",
         "trashy",
         "tubgirl",
         "turd",
         "tush",
         "twat",
         "twats",
         "ugly",
         "undies",
         "unwed",
         "urinal",
         "urine",
         "uterus",
         "uzi",
         "vag",
         "vagina",
         "valium",
         "viagra",
         "virgin",
         "vixen",
         "vodka",
         "vomit",
         "voyeur",
         "vulgar",
         "vulva",
         "wad",
         "wang",
         "wank",
         "wanker",
         "wazoo",
         "wedgie",
         "weed",
         "weenie",
         "weewee",
         "weiner",
         "weirdo",
         "wench",
         "wetback",
         "wh0re",
         "wh0reface",
         "whitey",
         "whiz",
         "whoralicious",
         "whore",
         "whorealicious",
         "whored",
         "whoreface",
         "whorehopper",
         "whorehouse",
         "whores",
         "whoring",
         "wigger",
         "womb",
         "woody",
         "wop",
         "wtf",
         "x-rated",
         "xxx",
         "yeasty",
         "yobbo",
         "zoophile",
         "picka",
         "@$$",
         "AssMonkey",
         "Assface",
         "Biatch",
         "BlowJob",
         "CarpetMuncher",
         "Clit",
         "Cock",
         "CockSucker",
         "Ekrem",
         "Ekto",
         "Felcher",
         "Flikker",
         "Fotze",
         "Fu",
         "FudgePacker",
         "Fukah",
         "Fuken",
         "Fukin",
         "Fukk",
         "Fukkah",
         "Fukken",
         "Fukker",
         "Fukkin",
         "Goddamned",
         "Huevon",
         "Kurac",
         "Lesbian",
         "Lezzian",
         "Lipshits",
         "Lipshitz",
         "MothaFucker",
         "MothaFuker",
         "MothaFukkah",
         "MothaFukker",
         "MotherFucker",
         "MotherFukah",
         "MotherFuker",
         "MotherFukkah",
         "MotherFukker",
         "MuthaFucker",
         "MuthaFukah",
         "MuthaFuker",
         "MuthaFukkah",
         "MuthaFukker",
         "Phuc",
         "Phuck",
         "Phuk",
         "Phuker",
         "Phukker",
         "Poonani",
         "Shitty",
         "Shity",
         "Sht",
         "Shyt",
         "Shyte",
         "Shytty",
         "Skanky",
         "Slutty",
         "amcik",
         "andskota",
         "arschloch",
         "arse",
         "ash0le",
         "ash0les",
         "asholes",
         "assh0lez",
         "asshole",
         "assholz",
         "assrammer",
         "ayir",
         "azzhole",
         "b00bs",
         "b17ch",
         "bassterds",
         "bastardz",
         "basterds",
         "basterdz",
         "bch",
         "bi7ch",
         "bich",
         "boffing",
         "boiolas",
         "btch",
         "buceta",
         "butthole",
         "buttpirate",
         "buttwipe",
         "c0cks",
         "c0k",
         "cabron",
         "cawks",
         "cazzo",
         "chraa",
         "chuj",
         "cipa",
         "cnts",
         "cntz",
         "cockhead",
         "cuntz",
         "d4mn",
         "daygo",
         "dego",
         "dild0",
         "dild0s",
         "dilld0",
         "dilld0s",
         "dirsa",
         "dominatricks",
         "dominatrics",
         "dominatrix",
         "dupa",
         "dziwka",
         "ejackulate",
         "ejakulate",
         "enculer",
         "enema",
         "faen",
         "fag1t",
         "faget",
         "fagg1t",
         "fagit",
         "fagz",
         "faigs",
         "fanculo",
         "fanny",
         "fatass",
         "fcuk",
         "feces",
         "feg",
         "ficken",
         "fitt",
         "flipping",
         "fuchah",
         "fucka",
         "fukah",
         "fuker",
         "fukka",
         "fukkah",
         "fukker",
         "futkretzn",
         "fux0r",
         "g00k",
         "gaybor",
         "gayboy",
         "gaygirl",
         "gayz",
         "guiena",
         "h00r",
         "h0ar",
         "h0r",
         "h0re",
         "h4x0r",
         "hells",
         "helvete",
         "hoar",
         "hoer",
         "honkey",
         "hoore",
         "hore",
         "hui",
         "jisim",
         "jiss",
         "kanker",
         "kawk",
         "klootzak",
         "knob",
         "knobs",
         "knobz",
         "knulle",
         "kuk",
         "kuksuger",
         "kunt",
         "kunts",
         "kuntz",
         "kurwa",
         "kusi",
         "kyrpa",
         "l3i"+"ch",
         "l3itch",
         "lesbian",
         "mamhoon",
         "masochist",
         "masokist",
         "massterbait",
         "masstrbait",
         "masstrbate",
         "masterbaiter",
         "masterbat",
         "masterbat3",
         "masterbates",
         "masturbat",
         "merd",
         "mibun",
         "monkleigh",
         "motha",
         "mouliewop",
         "muie",
         "mulkku",
         "muschi",
         "mutha",
         "n1gr",
         "nastt",
         "nasty",
         "nazis",
         "nepesaurio",
         "nigur",
         "niiger",
         "niigr",
         "nutsack",
         "orafis",
         "orgasim",
         "orgasum",
         "oriface",
         "orifice",
         "orifiss",
         "orospu",
         "p0rn",
         "packi",
         "packie",
         "packy",
         "pakie",
         "paky",
         "paska",
         "peeenus",
         "peeenusss",
         "peenus",
         "peinus",
         "pen1s",
         "penas",
         "penisbreath",
         "penus",
         "penuus",
         "perse",
         "pierdol",
         "pillu",
         "pimmel",
         "pimpis",
         "pizda",
         "polac",
         "polak",
         "poontsee",
         "poop",
         "pr0n",
         "pr1c",
         "pr1ck",
         "pr1k",
         "preteen",
         "pula",
         "pule",
         "pusse",
         "pussee",
         "puta",
         "puuke",
         "puuker",
         "qahbeh",
         "queerz",
         "qweers",
         "qweerz",
         "qweir",
         "rautenberg",
         "recktum",
         "s.o.b.",
         "scank",
         "schaffer",
         "scheiss",
         "schlampe",
         "schmuck",
         "screwing",
         "sexx",
         "sexxx",
         "sexy",
         "sh1ter",
         "sh1ts",
         "sh1tter",
         "sh1tz",
         "sharmuta",
         "sharmute",
         "shemale",
         "shi+",
         "shipal",
         "shitz",
         "skanck",
         "skankee",
         "skankey",
         "skanks",
         "skrib",
         "slutz",
         "sonofabitch",
         "sx",
         "teets",
         "teez",
         "testical",
         "titt",
         "va1jina",
         "vag1na",
         "vagiina",
         "vaj1na",
         "vajina",
         "vullva",
         "w00se",
         "w0p",
         "wh00r",
         "whoar",
         "xrated",
         "2 girls 1 cup",
         "arrse",
         "arsehole",
         "asanchez",
         "assfukka",
         "asswhole",
         "autoerotic",
         "bdsm",
         "beastial",
         "bellend",
         "bestial",
         "bestiality",
         "bimbos",
         "bitchin",
         "bitching",
         "blue waffle",
         "bondage",
         "booobs",
         "boooobs",
         "booooobs",
         "booooooobs",
         "booty call",
         "brown shower", 
         "showers",
         "bukake",
         "carpet muncher",
         "cnut",
         "cockface",
         "cockmunch",
         "cockmuncher",
         "cocksuck",
         "cocksucked",
         "cocksucking",
         "cocksucks",
         "cokmuncher",
         "cowgirl",
         "cowgirls",
         "crotch",
         "cuming",
         "cummer",
         "cums",
         "cunillingus",
         "cuntlicking",
         "deepthroat",
         "dink",
         "dinks",
         "dlck",
         "dog style",
         "dog-fucker",
         "doggiestyle",
         "doggin",
         "dogging",
         "doggystyle",
         "donkeyribber",
         "duche",
         "eatadick",
         "eathairpie",
         "ejaculated",
         "ejaculates",
         "ejaculating",
         "ejaculatings",
         "ejaculation",
         "erotism",
         "facial",
         "fagging",
         "faggitt",
         "faggs",
         "fagots",
         "fannyflaps",
         "fannyfucker",
         "fanyy",
         "fcuker",
         "fcuking",
         "feck",
         "fecker",
         "femdom",
         "fingerfuck",
         "fingerfucked",
         "fingerfucker",
         "fingerfuckers",
         "fingerfucking",
         "fingerfucks",
         "fingering",
         "fistfuck",
         "fistfucked",
         "fistfucker",
         "fistfuckers",
         "fistfucking",
         "fistfuckings",
         "fistfucks",
         "flange",
         "flogthelog",
         "fook",
         "fooker",
         "footjob",
         "fuckbitch",
         "fuckers",
         "fuckhead",
         "fuckheads",
         "fuckhole",
         "fuckings",
         "fuckingshitmotherfucker",
         "fuckme",
         "fuckmeat",
         "fuckpuppet",
         "fucktoy",
         "fucktrophy",
         "fuckwhit",
         "fuckyomama",
         "fukkin",
         "fukking",
         "fuks",
         "fukwhit",
         "fukwit",
         "futanari",
         "futanary",
         "fux",
         "fuxor",
         "gangbang",
         "gangbanged",
         "gangbangs",
         "gassyass",
         "gaylord",
         "gaysex",
         "god",
         "goddamned",
         "gokkun",
         "hamflap",
         "hardcoresex",
         "hardon",
         "hentai",
         "heshe",
         "hoare",
         "homoerotic",
         "horniest",
         "hotsex",
         "howtokill",
         "howtomurdep",
         "kinbaku",
         "kinkyJesus",
         "knobead",
         "knobed",
         "knobhead",
         "knobjocky",
         "knobjokey",
         "kock",
         "kondum",
         "kondums",
         "kum",
         "kummer",
         "kumming",
         "kums",
         "kunilingus",
         "kwif",
         "len",
         "lust",
         "lusting",
         "mafugly",
         "masterb8",
         "masterbations",
         "milf",
         "mothafuck",
         "mothafucka",
         "mothafuckas",
         "mothafuckaz",
         "mothafucked",
         "mothafucker",
         "mothafuckers",
         "mothafuckin",
         "mothafucking",
         "mothafuckings",
         "mothafucks",
         "motherfuck",
         "motherfucked",
         "motherfuckers",
         "motherfuckin",
         "motherfuckings",
         "motherfuckka",
         "motherfucks",
         "muffpuff",
         "muthafecker",
         "muthafuckker",
         "muther",
         "needthedick",
         "nig",
         "nigg",
         "nipples",
         "nob",
         "nobhead",
         "nobjocky",
         "nobjokey",
         "nude",
         "nudes",
         "numbnuts",
         "nutbutter",
         "omg",
         "orgasims",
         "orgasms",
         "pawn",
         "penisfucker",
         "phonesex",
         "phuk",
         "phuked",
         "phuking",
         "phukked",
         "phukking",
         "phuks",
         "phuq",
         "pigfucker",
         "pisser",
         "pissers",
         "pisses",
         "pissflaps",
         "pissin",
         "pissing",
         "playboy",
         "pornos",
         "pricks",
         "pron",
         "pussi",
         "pussyfart",
         "pussypalace",
         "pussys",
         "raping",
         "rimjaw",
         "rimming",
         "sandbar",
         "sausagequeen",
         "scroat",
         "shag",
         "shagger",
         "shaggin",
         "shagging",
         "shibari",
         "shibary",
         "shitdick",
         "shited",
         "shitey",
         "shitfuck",
         "shitfucker",
         "shitfull",
         "shiting",
         "shitings",
         "shitters",
         "shitting",
         "shittings",
         "shota",
         "slope",
         "slutbucket",
         "sob",
         "son-of-a-bitch",
         "spac",
         "strip club",
         "stripclub",
         "threesome",
         "throating",
         "tittywank",
         "titwank",
         "tosser",
         "twathead",
         "twatty",
         "twunt",
         "twunter",
         "vigra",
         "wanky",
         "willies",
         "willy",
         "woose",
         "x-rated2g1c",
         "xx",
         "yaoi",
         "yury"
      ];
   var i = 0;
   input=input.toLowerCase();
   input=input.replace(/[\W_]+/g," ");
   var in_words=input.split(' ');
   while (i < in_words.length)
   {
       if (bad_words.indexOf(in_words[i])>=0)
       {
           return true;
       }
        i=i+1;
   }
   return false;
} };