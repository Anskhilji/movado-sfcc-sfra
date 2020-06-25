/**
 * Map method for dw.util.Collection subclass instance
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {Array} Array of results of map
 */
function getRandomCustomer() {
    var customers = [{
            FirstName: 'Cheyenne',
            LastName: 'Nixon',
            Address1: '547 Neque. Street',
            City: 'Rock Springs',
            Region: 'WY',
            PostalCode: '23670',
            Email: 'sed.tortor@acmattis.com',
            Phone: '(104) 559-4389'
        },
        {
            FirstName: 'Keelie',
            LastName: 'Compton',
            Address1: '501-1349 Cras Road',
            City: 'New Haven',
            Region: 'CT',
            PostalCode: '56780',
            Email: 'consequat.lectus.sit@sollicitudinamalesuada.edu',
            Phone: '(648) 140-3371'
        },
        {
            FirstName: 'Michael',
            LastName: 'Delaney',
            Address1: 'Ap #813-6438 Gravida St.',
            City: 'Rutland',
            Region: 'VT',
            PostalCode: '67416',
            Email: 'ullamcorper.magna@euismodacfermentum.ca',
            Phone: '(977) 488-2387'
        },
        {
            FirstName: 'Cheyenne',
            LastName: 'Moody',
            Address1: '388, 8489 Sociis Road',
            City: 'Overland Park',
            Region: 'KS',
            PostalCode: '81938',
            Email: 'nunc@magnaSuspendisse.org',
            Phone: '(158) 598-9425'
        },
        {
            FirstName: 'Genevieve',
            LastName: 'Sherman',
            Address1: '455, 6314 A, Street',
            City: 'Portland',
            Region: 'OR',
            PostalCode: '11573',
            Email: 'non.egestas@risus.net',
            Phone: '(240) 473-7967'
        },
        {
            FirstName: 'Indira',
            LastName: 'Booker',
            Address1: 'Ap #341-1614 Ante. Rd.',
            City: 'Houston',
            Region: 'TX',
            PostalCode: '14155',
            Email: 'Fusce.mi.lorem@Morbisit.net',
            Phone: '(245) 578-5543'
        },
        {
            FirstName: 'Cade',
            LastName: 'Padilla',
            Address1: '5134 Quis Ave',
            City: 'Athens',
            Region: 'GA',
            PostalCode: '30715',
            Email: 'Aliquam.erat@mollisvitae.org',
            Phone: '(152) 756-9547'
        },
        {
            FirstName: 'Jasper',
            LastName: 'Le',
            Address1: '338-8990 Risus. Rd.',
            City: 'Kearney',
            Region: 'NE',
            PostalCode: '53184',
            Email: 'a@facilisi.net',
            Phone: '(504) 716-9039'
        },
        {
            FirstName: 'Merritt',
            LastName: 'Gray',
            Address1: '877, 7179 Congue, Avenue',
            City: 'Wyoming',
            Region: 'WY',
            PostalCode: '73670',
            Email: 'diam@ametconsectetuer.net',
            Phone: '(785) 219-2367'
        },
        {
            FirstName: 'Thor',
            LastName: 'Powers',
            Address1: '958, 8174 Est Rd.',
            City: 'Bowling Green',
            Region: 'KY',
            PostalCode: '52391',
            Email: 'condimentum.Donec.at@Praesenteudui.edu',
            Phone: '(155) 993-6882'
        },
        {
            FirstName: 'Lev',
            LastName: 'Hobbs',
            Address1: '759-5564 Blandit Ave',
            City: 'Portland',
            Region: 'ME',
            PostalCode: '38316',
            Email: 'et.ultrices@Integer.net',
            Phone: '(785) 258-7883'
        },
        {
            FirstName: 'Lionel',
            LastName: 'Craig',
            Address1: '5531 Laoreet Ave',
            City: 'Kenosha',
            Region: 'WI',
            PostalCode: '80198',
            Email: 'enim.consequat.purus@anteipsumprimis.com',
            Phone: '(794) 549-8854'
        },
        {
            FirstName: 'Thane',
            LastName: 'Wolfe',
            Address1: '955-9965 Luctus, St.',
            City: 'Meridian',
            Region: 'ID',
            PostalCode: '53695',
            Email: 'in@commodo.ca',
            Phone: '(570) 230-7915'
        },
        {
            FirstName: 'Quintessa',
            LastName: 'Mcgee',
            Address1: 'Ap #475-1418 Euismod Rd.',
            City: 'Cleveland',
            Region: 'OH',
            PostalCode: '31903',
            Email: 'nisi.Cum@Nuncquisarcu.net',
            Phone: '(827) 858-1802'
        },
        {
            FirstName: 'Brody',
            LastName: 'Griffin',
            Address1: '6664 Mauris St.',
            City: 'Cambridge',
            Region: 'MA',
            PostalCode: '19364',
            Email: 'Duis.mi@habitantmorbi.edu',
            Phone: '(174) 853-3930'
        },
        {
            FirstName: 'Dieter',
            LastName: 'Mcguire',
            Address1: '840, 7677 Donec Av.',
            City: 'Montpelier',
            Region: 'VT',
            PostalCode: '53729',
            Email: 'ligula@velarcu.ca',
            Phone: '(916) 835-5998'
        },
        {
            FirstName: 'Serena',
            LastName: 'French',
            Address1: '2524 Faucibus Rd.',
            City: 'Southaven',
            Region: 'MS',
            PostalCode: '73078',
            Email: 'erat@posuere.co.uk',
            Phone: '(753) 757-5474'
        },
        {
            FirstName: 'Stuart',
            LastName: 'Goodman',
            Address1: '373-4660 Lacus. Rd.',
            City: 'Owensboro',
            Region: 'KY',
            PostalCode: '61972',
            Email: 'sapien.molestie@elit.net',
            Phone: '(540) 850-7228'
        },
        {
            FirstName: 'Evelyn',
            LastName: 'Slater',
            Address1: '942-9081 Accumsan Avenue',
            City: 'Lakewood',
            Region: 'CO',
            PostalCode: '50053',
            Email: 'molestie@dictum.com',
            Phone: '(192) 928-9694'
        },
        {
            FirstName: 'Leila',
            LastName: 'Myers',
            Address1: '855, 3714 Auctor Rd.',
            City: 'Racine',
            Region: 'WI',
            PostalCode: '36756',
            Email: 'Sed.id.risus@erat.org',
            Phone: '(786) 668-7303'
        },
        {
            FirstName: 'Shafira',
            LastName: 'Alston',
            Address1: '6291 Tellus St.',
            City: 'Toledo',
            Region: 'OH',
            PostalCode: '22229',
            Email: 'amet.ultricies@facilisi.edu',
            Phone: '(787) 330-6986'
        },
        {
            FirstName: 'Aaron',
            LastName: 'Ratliff',
            Address1: 'Ap #675-9791 Gravida. Av.',
            City: 'West Valley City',
            Region: 'UT',
            PostalCode: '26617',
            Email: 'in@a.ca',
            Phone: '(110) 421-1977'
        },
        {
            FirstName: 'Wylie',
            LastName: 'Haney',
            Address1: '7669 Arcu. St.',
            City: 'Des Moines',
            Region: 'IA',
            PostalCode: '35776',
            Email: 'semper@auguescelerisquemollis.edu',
            Phone: '(228) 704-8387'
        },
        {
            FirstName: 'Camilla',
            LastName: 'Maxwell',
            Address1: '195, 1293 Varius St.',
            City: 'Lexington',
            Region: 'KY',
            PostalCode: '91028',
            Email: 'quis.diam.Pellentesque@Ut.net',
            Phone: '(888) 836-7649'
        },
        {
            FirstName: 'Ann',
            LastName: 'Newman',
            Address1: '840-3804 Ultricies St.',
            City: 'Biloxi',
            Region: 'MS',
            PostalCode: '62899',
            Email: 'amet@diamdictum.ca',
            Phone: '(586) 996-9811'
        },
        {
            FirstName: 'Sierra',
            LastName: 'Hale',
            Address1: '790-7219 Vel Av.',
            City: 'Grand Island',
            Region: 'NE',
            PostalCode: '43490',
            Email: 'eleifend@lacus.edu',
            Phone: '(433) 843-7638'
        },
        {
            FirstName: 'Wesley',
            LastName: 'Higgins',
            Address1: 'Ap #197-4150 Ultricies Street',
            City: 'Cedar Rapids',
            Region: 'IA',
            PostalCode: '63897',
            Email: 'aliquet.Phasellus.fermentum@sapien.org',
            Phone: '(565) 904-7373'
        },
        {
            FirstName: 'Lareina',
            LastName: 'Barber',
            Address1: '343-2067 Erat, Rd.',
            City: 'New Haven',
            Region: 'CT',
            PostalCode: '77352',
            Email: 'rutrum.Fusce.dolor@Etiamgravida.edu',
            Phone: '(710) 751-1562'
        },
        {
            FirstName: 'Ashton',
            LastName: 'Schmidt',
            Address1: '230-7589 Faucibus Road',
            City: 'Fayetteville',
            Region: 'AR',
            PostalCode: '72520',
            Email: 'tincidunt.orci@acmetus.com',
            Phone: '(916) 194-1738'
        },
        {
            FirstName: 'Nigel',
            LastName: 'Rosales',
            Address1: '286, 5702 Sit Avenue',
            City: 'Kaneohe',
            Region: 'HI',
            PostalCode: '18532',
            Email: 'augue.id.ante@Donectemporest.com',
            Phone: '(451) 561-5418'
        },
        {
            FirstName: 'Dustin',
            LastName: 'Gentry',
            Address1: 'Ap #799-6280 Dui St.',
            City: 'Idaho Falls',
            Region: 'ID',
            PostalCode: '88715',
            Email: 'aliquet.Proin@dictum.org',
            Phone: '(378) 207-1059'
        },
        {
            FirstName: 'Katelyn',
            LastName: 'Douglas',
            Address1: '1056 Mus. St.',
            City: 'Cheyenne',
            Region: 'WY',
            PostalCode: '95521',
            Email: 'ut@volutpatnunc.co.uk',
            Phone: '(509) 189-4586'
        },
        {
            FirstName: 'Melyssa',
            LastName: 'Fuller',
            Address1: '528, 5744 Donec St.',
            City: 'Wichita',
            Region: 'KS',
            PostalCode: '19703',
            Email: 'Quisque.porttitor.eros@maurissitamet.edu',
            Phone: '(736) 875-4196'
        },
        {
            FirstName: 'Madonna',
            LastName: 'Hartman',
            Address1: '3933 Gravida Av.',
            City: 'South Bend',
            Region: 'IN',
            PostalCode: '93581',
            Email: 'Ut.tincidunt.orci@Donec.net',
            Phone: '(614) 173-6490'
        },
        {
            FirstName: 'Stephen',
            LastName: 'Harrison',
            Address1: '926, 3978 Nec Road',
            City: 'Rockville',
            Region: 'MD',
            PostalCode: '28357',
            Email: 'justo.sit@vitae.edu',
            Phone: '(428) 260-1538'
        },
        {
            FirstName: 'Wynne',
            LastName: 'Mccarty',
            Address1: '3149 Arcu. Av.',
            City: 'Mesa',
            Region: 'AZ',
            PostalCode: '85917',
            Email: 'lectus@massaInteger.org',
            Phone: '(891) 264-8638'
        },
        {
            FirstName: 'Quincy',
            LastName: 'Tillman',
            Address1: 'Ap #616-9685 Magna. Rd.',
            City: 'Reno',
            Region: 'NV',
            PostalCode: '63523',
            Email: 'quis.lectus@dictumProin.org',
            Phone: '(779) 656-5498'
        },
        {
            FirstName: 'Dara',
            LastName: 'Cotton',
            Address1: '439-8927 Amet, St.',
            City: 'Jackson',
            Region: 'MS',
            PostalCode: '19203',
            Email: 'sit.amet@mollisnoncursus.co.uk',
            Phone: '(114) 208-2424'
        },
        {
            FirstName: 'Sharon',
            LastName: 'Stafford',
            Address1: '255, 5335 Duis St.',
            City: 'Essex',
            Region: 'VT',
            PostalCode: '47916',
            Email: 'dui.Cum.sociis@vitaeodiosagittis.net',
            Phone: '(854) 295-9833'
        },
        {
            FirstName: 'Xandra',
            LastName: 'Mcfadden',
            Address1: '154-576 Vel Ave',
            City: 'Grand Island',
            Region: 'NE',
            PostalCode: '27203',
            Email: 'Vivamus@mollis.net',
            Phone: '(763) 111-3352'
        },
        {
            FirstName: 'Addison',
            LastName: 'Merrill',
            Address1: '2245 Vehicula Avenue',
            City: 'Fayetteville',
            Region: 'AR',
            PostalCode: '72829',
            Email: 'eget.ipsum@nibhvulputatemauris.ca',
            Phone: '(953) 891-2699'
        },
        {
            FirstName: 'Illiana',
            LastName: 'Coleman',
            Address1: 'Ap #717-8713 Et Av.',
            City: 'Nashville',
            Region: 'TN',
            PostalCode: '48671',
            Email: 'consectetuer@Aliquamnec.net',
            Phone: '(945) 994-7003'
        },
        {
            FirstName: 'Imogene',
            LastName: 'Tyler',
            Address1: '636-2024 Justo Ave',
            City: 'Joliet',
            Region: 'IL',
            PostalCode: '85332',
            Email: 'dui.nec@PraesentluctusCurabitur.edu',
            Phone: '(706) 560-3281'
        },
        {
            FirstName: 'Zeph',
            LastName: 'Carter',
            Address1: '641, 5237 Vel Av.',
            City: 'Montpelier',
            Region: 'VT',
            PostalCode: '40496',
            Email: 'semper.dui@rutrumnonhendrerit.edu',
            Phone: '(414) 734-6269'
        },
        {
            FirstName: 'Caesar',
            LastName: 'Duke',
            Address1: 'Ap #251-3997 Elementum Avenue',
            City: 'Chattanooga',
            Region: 'TN',
            PostalCode: '19255',
            Email: 'mattis.velit@eget.ca',
            Phone: '(754) 442-5814'
        },
        {
            FirstName: 'Iola',
            LastName: 'Cunningham',
            Address1: 'Ap #599-9922 Sit Rd.',
            City: 'Detroit',
            Region: 'MI',
            PostalCode: '83596',
            Email: 'eu.dolor@odio.com',
            Phone: '(624) 162-1513'
        },
        {
            FirstName: 'Tashya',
            LastName: 'Barnes',
            Address1: 'Ap #561-4627 Parturient Rd.',
            City: 'Kailua',
            Region: 'HI',
            PostalCode: '20604',
            Email: 'cubilia.Curae.Phasellus@egestasFuscealiquet.org',
            Phone: '(357) 582-9205'
        },
        {
            FirstName: 'Barbara',
            LastName: 'Henderson',
            Address1: '401, 8194 In Rd.',
            City: 'Aurora',
            Region: 'CO',
            PostalCode: '57440',
            Email: 'et.ultrices@malesuada.co.uk',
            Phone: '(742) 141-6380'
        },
        {
            FirstName: 'Hannah',
            LastName: 'Sanford',
            Address1: '491-1922 Cursus Road',
            City: 'Kailua',
            Region: 'HI',
            PostalCode: '83568',
            Email: 'in@velpedeblandit.co.uk',
            Phone: '(433) 961-8674'
        },
        {
            FirstName: 'Eagan',
            LastName: 'Burgess',
            Address1: 'Ap #378-6441 Sit Avenue',
            City: 'Tacoma',
            Region: 'WA',
            PostalCode: '23587',
            Email: 'dictum.Phasellus.in@Nuncsollicitudin.edu',
            Phone: '(349) 354-5889'
        },
        {
            FirstName: 'Wang',
            LastName: 'Buck',
            Address1: '971, 1748 Iaculis Rd.',
            City: 'Duluth',
            Region: 'MN',
            PostalCode: '57555',
            Email: 'a.feugiat@Phasellusfermentumconvallis.net',
            Phone: '(791) 879-3680'
        },
        {
            FirstName: 'Henry',
            LastName: 'Maddox',
            Address1: '921-6916 Molestie Avenue',
            City: 'Salt Lake City',
            Region: 'UT',
            PostalCode: '54447',
            Email: 'cursus.luctus@ut.ca',
            Phone: '(701) 843-7158'
        },
        {
            FirstName: 'Camilla',
            LastName: 'Hendrix',
            Address1: '354, 9301 Gravida Rd.',
            City: 'Jacksonville',
            Region: 'FL',
            PostalCode: '16168',
            Email: 'mollis.Phasellus.libero@eros.com',
            Phone: '(769) 918-7916'
        },
        {
            FirstName: 'Ila',
            LastName: 'Clark',
            Address1: 'Ap #259-6194 Egestas Rd.',
            City: 'Tuscaloosa',
            Region: 'AL',
            PostalCode: '36831',
            Email: 'dui@facilisisSuspendisse.ca',
            Phone: '(946) 426-5074'
        },
        {
            FirstName: 'Leonard',
            LastName: 'Kemp',
            Address1: '137-6945 Nunc Av.',
            City: 'Bridgeport',
            Region: 'CT',
            PostalCode: '85135',
            Email: 'justo.eu@DonectinciduntDonec.com',
            Phone: '(774) 289-2044'
        },
        {
            FirstName: 'Joel',
            LastName: 'Moon',
            Address1: '3251 Iaculis Street',
            City: 'Chesapeake',
            Region: 'VA',
            PostalCode: '20125',
            Email: 'lectus@mattis.co.uk',
            Phone: '(307) 129-9387'
        },
        {
            FirstName: 'Benjamin',
            LastName: 'Howard',
            Address1: 'Ap #864-6534 Nulla St.',
            City: 'Newport News',
            Region: 'VA',
            PostalCode: '47031',
            Email: 'bibendum@mollis.com',
            Phone: '(877) 471-8073'
        },
        {
            FirstName: 'Aiko',
            LastName: 'Hinton',
            Address1: '7317 Vestibulum Ave',
            City: 'Chesapeake',
            Region: 'VA',
            PostalCode: '90195',
            Email: 'Nulla.aliquet.Proin@egetodioAliquam.org',
            Phone: '(918) 909-0907'
        },
        {
            FirstName: 'September',
            LastName: 'Le',
            Address1: '699-973 Rhoncus. St.',
            City: 'Billings',
            Region: 'MT',
            PostalCode: '98949',
            Email: 'tincidunt.pede.ac@ultriciesornareelit.com',
            Phone: '(875) 833-1842'
        },
        {
            FirstName: 'Guy',
            LastName: 'Pitts',
            Address1: '894, 6800 Vehicula Rd.',
            City: 'Chesapeake',
            Region: 'VA',
            PostalCode: '22734',
            Email: 'vehicula.et@DonecnibhQuisque.edu',
            Phone: '(614) 432-1362'
        },
        {
            FirstName: 'Darius',
            LastName: 'Giles',
            Address1: 'Ap #491-8520 Sed Rd.',
            City: 'Davenport',
            Region: 'IA',
            PostalCode: '30354',
            Email: 'fringilla@feliseget.com',
            Phone: '(141) 913-6958'
        },
        {
            FirstName: 'Madeline',
            LastName: 'Hobbs',
            Address1: '5700 Imperdiet Rd.',
            City: 'Chandler',
            Region: 'AZ',
            PostalCode: '85495',
            Email: 'lectus.Nullam@lacusQuisqueimperdiet.ca',
            Phone: '(430) 995-5754'
        },
        {
            FirstName: 'Sandra',
            LastName: 'Barber',
            Address1: '225, 9346 Ipsum. Rd.',
            City: 'Cambridge',
            Region: 'MA',
            PostalCode: '54937',
            Email: 'malesuada.id@sapienAeneanmassa.edu',
            Phone: '(493) 439-6116'
        },
        {
            FirstName: 'Dai',
            LastName: 'Parker',
            Address1: 'Ap #383-6357 Aenean Rd.',
            City: 'Billings',
            Region: 'MT',
            PostalCode: '84231',
            Email: 'diam.Sed@Innecorci.edu',
            Phone: '(254) 475-5023'
        },
        {
            FirstName: 'Fritz',
            LastName: 'Gallegos',
            Address1: '2838 Placerat. Rd.',
            City: 'Hillsboro',
            Region: 'OR',
            PostalCode: '13943',
            Email: 'Praesent.luctus@egestas.ca',
            Phone: '(703) 148-4356'
        },
        {
            FirstName: 'Petra',
            LastName: 'Carson',
            Address1: 'Ap #707-1024 Proin Rd.',
            City: 'Wichita',
            Region: 'KS',
            PostalCode: '29161',
            Email: 'lacus@interdumCurabiturdictum.com',
            Phone: '(457) 550-0933'
        },
        {
            FirstName: 'Kaitlin',
            LastName: 'Duffy',
            Address1: '814, 6410 Lorem, Street',
            City: 'Lincoln',
            Region: 'NE',
            PostalCode: '18022',
            Email: 'eu.accumsan@massalobortis.org',
            Phone: '(176) 101-4775'
        },
        {
            FirstName: 'Tobias',
            LastName: 'Duffy',
            Address1: '842, 825 Sapien. Road',
            City: 'Lewiston',
            Region: 'ME',
            PostalCode: '65757',
            Email: 'interdum.Sed@nislsemconsequat.com',
            Phone: '(802) 615-8241'
        },
        {
            FirstName: 'Tasha',
            LastName: 'Crawford',
            Address1: 'Ap #605-7624 Aliquet Rd.',
            City: 'Salem',
            Region: 'OR',
            PostalCode: '95422',
            Email: 'metus.In.lorem@viverra.co.uk',
            Phone: '(222) 567-0067'
        },
        {
            FirstName: 'Branden',
            LastName: 'Hinton',
            Address1: 'Ap #971-151 Egestas. Rd.',
            City: 'Gaithersburg',
            Region: 'MD',
            PostalCode: '74949',
            Email: 'Nunc@elementumlorem.edu',
            Phone: '(507) 865-2736'
        },
        {
            FirstName: 'Dustin',
            LastName: 'Merritt',
            Address1: 'Ap #632-1706 Netus Rd.',
            City: 'Sioux City',
            Region: 'IA',
            PostalCode: '87074',
            Email: 'lacus.pede.sagittis@nisiAenean.org',
            Phone: '(196) 567-8645'
        },
        {
            FirstName: 'Ethan',
            LastName: 'Stafford',
            Address1: 'Ap #304-1480 Amet, Rd.',
            City: 'Bowling Green',
            Region: 'KY',
            PostalCode: '75374',
            Email: 'euismod.est@nec.net',
            Phone: '(597) 764-7433'
        },
        {
            FirstName: 'Kaseem',
            LastName: 'Stokes',
            Address1: '427, 7453 At Rd.',
            City: 'Metairie',
            Region: 'LA',
            PostalCode: '33300',
            Email: 'Phasellus.nulla@felisegetvarius.co.uk',
            Phone: '(156) 838-4987'
        },
        {
            FirstName: 'Phelan',
            LastName: 'Long',
            Address1: '9320 Mi Rd.',
            City: 'Chattanooga',
            Region: 'TN',
            PostalCode: '50556',
            Email: 'ante.lectus.convallis@sitamet.org',
            Phone: '(335) 191-1702'
        },
        {
            FirstName: 'Ima',
            LastName: 'Chase',
            Address1: '3949 Blandit Rd.',
            City: 'Montgomery',
            Region: 'AL',
            PostalCode: '36245',
            Email: 'semper@etmagnis.com',
            Phone: '(554) 133-7373'
        },
        {
            FirstName: 'Stone',
            LastName: 'Hendricks',
            Address1: 'Ap #709-9424 Mauris. Ave',
            City: 'Augusta',
            Region: 'ME',
            PostalCode: '50822',
            Email: 'ligula@ornare.com',
            Phone: '(975) 287-5646'
        },
        {
            FirstName: 'Gillian',
            LastName: 'Bullock',
            Address1: '6960 Mollis Road',
            City: 'Bear',
            Region: 'DE',
            PostalCode: '84302',
            Email: 'id.ante@metusIn.net',
            Phone: '(769) 449-9700'
        },
        {
            FirstName: 'Branden',
            LastName: 'Martinez',
            Address1: 'Ap #329-3178 Auctor, Street',
            City: 'Huntsville',
            Region: 'AL',
            PostalCode: '35073',
            Email: 'nunc.id.enim@In.co.uk',
            Phone: '(492) 908-7445'
        },
        {
            FirstName: 'Wilma',
            LastName: 'Gillespie',
            Address1: '253-4911 Porttitor Rd.',
            City: 'Omaha',
            Region: 'NE',
            PostalCode: '34564',
            Email: 'porttitor@consectetuer.co.uk',
            Phone: '(322) 229-9112'
        },
        {
            FirstName: 'Benjamin',
            LastName: 'Henry',
            Address1: '2346 Euismod Road',
            City: 'Springfield',
            Region: 'MA',
            PostalCode: '70787',
            Email: 'Sed.eu@Suspendissetristique.net',
            Phone: '(262) 271-8100'
        },
        {
            FirstName: 'Echo',
            LastName: 'Daniel',
            Address1: '886, 2855 Feugiat Rd.',
            City: 'Tallahassee',
            Region: 'FL',
            PostalCode: '24562',
            Email: 'malesuada.augue@purusDuiselementum.org',
            Phone: '(543) 158-0671'
        },
        {
            FirstName: 'Jordan',
            LastName: 'Floyd',
            Address1: 'Ap #783-5444 Scelerisque St.',
            City: 'Lincoln',
            Region: 'NE',
            PostalCode: '84749',
            Email: 'interdum@urna.net',
            Phone: '(973) 560-9001'
        },
        {
            FirstName: 'Cheyenne',
            LastName: 'Burt',
            Address1: '790-636 Egestas Street',
            City: 'Lansing',
            Region: 'MI',
            PostalCode: '43972',
            Email: 'ac@molestie.ca',
            Phone: '(715) 119-2024'
        },
        {
            FirstName: 'Marvin',
            LastName: 'Rocha',
            Address1: '8053 At St.',
            City: 'Bowling Green',
            Region: 'KY',
            PostalCode: '56682',
            Email: 'orci.lobortis.augue@nisi.com',
            Phone: '(244) 470-7417'
        },
        {
            FirstName: 'Pascale',
            LastName: 'Fisher',
            Address1: '5845 Magna St.',
            City: 'Grand Island',
            Region: 'NE',
            PostalCode: '79781',
            Email: 'Proin.dolor.Nulla@et.co.uk',
            Phone: '(801) 168-4270'
        },
        {
            FirstName: 'Savannah',
            LastName: 'Sharpe',
            Address1: '5927 In Road',
            City: 'Pike Creek',
            Region: 'DE',
            PostalCode: '96867',
            Email: 'commodo@congue.ca',
            Phone: '(218) 183-9546'
        },
        {
            FirstName: 'Lucius',
            LastName: 'Jensen',
            Address1: '567-176 Aliquam Rd.',
            City: 'Reading',
            Region: 'PA',
            PostalCode: '75551',
            Email: 'vel.mauris@sollicitudin.org',
            Phone: '(819) 759-0302'
        },
        {
            FirstName: 'Yoshi',
            LastName: 'Parks',
            Address1: '265, 1529 Elit, Av.',
            City: 'Little Rock',
            Region: 'AR',
            PostalCode: '71644',
            Email: 'amet@at.com',
            Phone: '(233) 655-6760'
        },
        {
            FirstName: 'Zena',
            LastName: 'Castaneda',
            Address1: '4226 Sed Rd.',
            City: 'Henderson',
            Region: 'NV',
            PostalCode: '79738',
            Email: 'et.pede.Nunc@eratsemper.com',
            Phone: '(166) 388-2017'
        },
        {
            FirstName: 'September',
            LastName: 'Clements',
            Address1: '851-820 Lacinia Street',
            City: 'Augusta',
            Region: 'GA',
            PostalCode: '69826',
            Email: 'amet.nulla@Sednulla.com',
            Phone: '(792) 443-6079'
        },
        {
            FirstName: 'Graham',
            LastName: 'Hewitt',
            Address1: '857, 6291 Orci. Rd.',
            City: 'Bloomington',
            Region: 'MN',
            PostalCode: '38757',
            Email: 'nibh.Quisque.nonummy@elitCurabitursed.edu',
            Phone: '(269) 764-0278'
        },
        {
            FirstName: 'Matthew',
            LastName: 'Meyer',
            Address1: '523-3960 Eu St.',
            City: 'Gaithersburg',
            Region: 'MD',
            PostalCode: '70929',
            Email: 'ornare@arcu.com',
            Phone: '(951) 936-5183'
        },
        {
            FirstName: 'Melyssa',
            LastName: 'Calderon',
            Address1: '772-6603 Vulputate, Rd.',
            City: 'Hilo',
            Region: 'HI',
            PostalCode: '43415',
            Email: 'vitae@eget.co.uk',
            Phone: '(723) 334-7031'
        },
        {
            FirstName: 'Naida',
            LastName: 'Porter',
            Address1: '4231 Lorem, Rd.',
            City: 'South Bend',
            Region: 'IN',
            PostalCode: '89197',
            Email: 'ornare.libero@molestiepharetranibh.edu',
            Phone: '(252) 732-1553'
        },
        {
            FirstName: 'Keelie',
            LastName: 'Castillo',
            Address1: '592, 5585 A Street',
            City: 'Juneau',
            Region: 'AK',
            PostalCode: '99744',
            Email: 'erat.semper.rutrum@eros.net',
            Phone: '(487) 762-0937'
        },
        {
            FirstName: 'Nita',
            LastName: 'Callahan',
            Address1: '2994 Auctor. Ave',
            City: 'Knoxville',
            Region: 'TN',
            PostalCode: '84201',
            Email: 'pede.malesuada@luctusipsum.edu',
            Phone: '(636) 102-6979'
        },
        {
            FirstName: 'Colleen',
            LastName: 'Irwin',
            Address1: 'Ap #908-5558 Magna. Avenue',
            City: 'Worcester',
            Region: 'MA',
            PostalCode: '85862',
            Email: 'ac.mattis.semper@eratvolutpat.ca',
            Phone: '(158) 734-0964'
        },
        {
            FirstName: 'Cleo',
            LastName: 'Chase',
            Address1: '811, 332 Luctus Avenue',
            City: 'Aurora',
            Region: 'CO',
            PostalCode: '96747',
            Email: 'Proin.eget.odio@mollis.org',
            Phone: '(127) 261-7430'
        },
        {
            FirstName: 'Donovan',
            LastName: 'Hunt',
            Address1: '304-4685 Ac Avenue',
            City: 'Kailua',
            Region: 'HI',
            PostalCode: '91345',
            Email: 'ut@auguescelerisque.net',
            Phone: '(353) 291-9246'
        },
        {
            FirstName: 'Dominique',
            LastName: 'Watkins',
            Address1: 'Ap #204-9499 Vulputate, Ave',
            City: 'Portland',
            Region: 'OR',
            PostalCode: '90850',
            Email: 'magna.a.neque@Nunclectus.com',
            Phone: '(627) 624-2780'
        }
    ];

    return customers[Math.floor(Math.random() * customers.length)];
}

module.exports = {
    getRandomCustomer: getRandomCustomer
};
