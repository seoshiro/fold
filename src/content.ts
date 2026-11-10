/**
 * FOLD editorial content. Facts checked against primary tourism/place sources
 * on 2026-11-10. The second paragraph reads the artistic paper interpretation;
 * it is not an architectural survey or a practical travel itinerary.
 */
export type Lang = 'en' | 'ru' | 'kk';
export type CityId = 'kyoto' | 'lisbon' | 'almaty';
export type Localized<T = string> = Record<Lang, T>;
export type Place = {
  id: string;
  name: Localized;
  kind: Localized;
  teaser: Localized;
  paragraphs: Localized<string[]>;
  source: { label: string; url: string };
};
export type City = {
  id: CityId;
  number: string;
  name: Localized;
  subtitle: Localized;
  notes: Localized;
  places: Place[];
};

// Array order is the curated three-stop viewing sequence, not a walking route.
export const cities: City[] = [
  {
    id: 'kyoto', number: '01',
    name: { en: 'Kyoto', ru: 'Киото', kk: 'Киото' },
    subtitle: { en: 'Between rooflines and water.', ru: 'Между крышами и водой.', kk: 'Шатырлар мен су арасында.' },
    notes: {
      en: 'Kyoto unfolds from a temple roof to the close grain of Gion, then opens out along the Kamo River. Broad eaves, repeated façades and a line of water set three different rhythms. The maple colour is an artistic choice, not a seasonal forecast. Follow the three stops to read this paper composition; the buildings and river are brought together freely, without geographical scale.',
      ru: 'Киото раскрывается от храмовой крыши к тесным улицам Гиона, а затем к простору реки Камо. Широкие карнизы, ряды фасадов и линия воды задают три разных ритма. Цвет клёнов выбран для этой композиции и не обещает конкретный сезон. Три остановки помогают рассмотреть бумажный город: здания и река собраны рядом свободно, без географического масштаба.',
      kk: 'Киото ғибадатхана шатырынан басталып, Гионның тар көшелері арқылы Камо өзенінің ашық жағасына ұласады. Кең шатыр, қатар тұрған қасбеттер мен су сызығы үш түрлі ырғақ береді. Үйеңкі түсі осы көрініс үшін таңдалған, ол маусымдық болжам емес. Үш аялдама қағаз қаланы ретімен қарауға көмектеседі. Ғимараттар мен өзен географиялық масштаб сақталмай, еркін орналастырылған.'
    },
    places: [
      {
        id: 'kiyomizu',
        name: { en: 'Kiyomizu-dera', ru: 'Киёмидзу-дэра', kk: 'Киёмидзу-дэра' },
        kind: { en: 'Temple · Higashiyama', ru: 'Храм · Хигасияма', kk: 'Ғибадатхана · Хигасияма' },
        teaser: { en: 'A timber stage held above the hillside.', ru: 'Деревянная терраса над склоном.', kk: 'Тау баурайындағы ағаш терраса.' },
        paragraphs: {
          en: [
            'Kiyomizu-dera takes its name from the clear waters of Otowa Waterfall. Its main hall stands on the steep slope of Mount Otowa; the present wooden building was reconstructed in 1633. The projecting stage is supported by traditional timber construction. A statue of Kannon, the bodhisattva associated with compassion, is enshrined inside the hall.',
            'Begin with the roof, then let your eye follow the platform beneath it. This fold borrows the relationship between a broad shelter and open air, rather than claiming to reproduce the temple. The empty space below the roof matters as much as the paper itself. It is the first pause in our Kyoto sequence, before the view moves into the closer rhythm of the streets.'
          ],
          ru: [
            'Название Киёмидзу-дэра связано с чистой водой водопада Отова. Главный зал стоит на крутом склоне горы Отова. Нынешнее деревянное здание восстановили в 1633 году; его выступающую террасу держит традиционная система деревянных опор. Внутри находится статуя Каннон, бодхисаттвы, связанного с состраданием.',
            'Сначала рассмотри крышу, затем площадку под ней. Эта складка передаёт сочетание широкого укрытия и открытого пространства, не пытаясь точно воспроизвести храм. Воздух под крышей здесь так же важен, как сама бумага. Это первая остановка нашего Киото: после неё взгляд переходит к более тесному ритму городских улиц.'
          ],
          kk: [
            'Киёмидзу-дэра атауы Отова сарқырамасының таза суымен байланысты. Негізгі зал Отова тауының тік беткейінде тұр. Қазіргі ағаш ғимарат 1633 жылы қайта салынған. Алға шығып тұрған террасасын дәстүрлі ағаш тіректер ұстап тұр. Залдың ішінде мейіріммен байланысты бодхисаттва Каннонның мүсіні орналасқан.',
            'Алдымен шатырға, содан кейін оның астындағы алаңшаға назар аудар. Бұл қатпар ғибадатхананы дәл қайталамай, кең шатыр мен ашық кеңістіктің байланысын жеткізеді. Шатыр астындағы бос кеңістік қағаздың өзі сияқты маңызды. Киотоны қарау осы жерден басталып, әрі қарай тар көшелердің жиі ырғағына ауысады.'
          ]
        },
        source: { label: 'Kiyomizu-dera · Official temple guide', url: 'https://www.kiyomizudera.or.jp/en/visit/' }
      },
      {
        id: 'gion',
        name: { en: 'Gion', ru: 'Гион', kk: 'Гион' },
        kind: { en: 'Neighbourhood · Living culture', ru: 'Район · Живая культура', kk: 'Аудан · Жанды мәдениет' },
        teaser: { en: 'A district read one doorway at a time.', ru: 'Район, который узнаёшь от двери к двери.', kk: 'Әр есігі өз сырын ашатын аудан.' },
        paragraphs: {
          en: [
            'Gion grew around the entrance to Yasaka Shrine. Today its streets bring together tea houses, restaurants and shops with the living traditions of geiko and maiko, Kyoto’s traditional performing artists and apprentices. This is a working neighbourhood as well as a cultural destination. Kyoto’s official guidance asks visitors not to photograph maiko without permission.',
            'Here, read the scene at street level: a succession of roofs, narrow openings and small changes in depth. The repeated paper façades are a way to suggest that close rhythm, not portraits of particular homes. Leave a little space between looking and entering. In this atlas, Gion is the intimate middle chapter between the temple’s wide roof and the river’s open banks.'
          ],
          ru: [
            'Гион вырос у входа в святилище Ясака. Сегодня чайные дома, рестораны и магазины соседствуют здесь с живой традицией гэйко и майко, артисток Киото и их учениц. Это действующий городской район, а не только достопримечательность. Официальный путеводитель Киото просит не фотографировать майко без разрешения.',
            'Рассмотри эту часть сцены на уровне улицы: череду крыш, узкие проёмы, небольшие уступы. Повторяющиеся бумажные фасады передают плотный ритм застройки, но не изображают конкретные дома. Между желанием рассмотреть и желанием войти стоит оставить немного пространства. В нашем атласе Гион становится камерной главой между широкой храмовой крышей и открытыми берегами реки.'
          ],
          kk: [
            'Гион Ясака ғибадатханасының кіреберісі маңында қалыптасқан. Бүгінде мұнда шай үйлері, мейрамханалар мен дүкендер бар. Гэйко мен олардың шәкірттері майко Киотоның дәстүрлі орындаушылық өнерін жалғастырып келеді. Бұл туристік нысан ғана емес, адамдар тұрып, жұмыс істейтін аудан. Киотоның ресми нұсқаулығы майконы рұқсатсыз суретке түсірмеуді сұрайды.',
            'Көріністі көше деңгейінде қара: шатырлар қатары, тар ойықтар, шағын шығыңқы бөліктер. Қағаз қасбеттер нақты үйлерді көшірмей, тығыз құрылыстың ырғағын береді. Қызыға қарау мен ішке кірудің арасында әдеп шекарасы бар. Атласта Гион ғибадатхананың кең шатырын өзеннің ашық жағасымен жалғайтын шағын тарау болды.'
          ]
        },
        source: { label: 'Kyoto Travel · City official guide', url: 'https://kyoto.travel/en/areas/gion-kiyomizu/' }
      },
      {
        id: 'kamo',
        name: { en: 'Kamo River', ru: 'Река Камо', kk: 'Камо өзені' },
        kind: { en: 'River · Everyday Kyoto', ru: 'Река · Повседневный Киото', kk: 'Өзен · Киотоның күнделікті өмірі' },
        teaser: { en: 'An open line through the city.', ru: 'Открытая линия сквозь город.', kk: 'Қаланы бойлай аққан ашық арна.' },
        paragraphs: {
          en: [
            'The Kamo River runs through Kyoto, with banks used for walking, running and sitting beside the water. In places, stepping stones cross the channel. Along parts of the riverside, summer dining platforms extend the life of nearby restaurants towards the water. The river belongs to ordinary daily routines as much as to the city’s famous views.',
            'After the temple and the closely spaced streets, give the open surface a moment. In paper, a line of water can be made from very little: a change of colour, a gap, a crossing. Our river and bridge are composed freely. They give the final stop a slower rhythm without suggesting that these three places sit beside one another at this scale.'
          ],
          ru: [
            'Камо течёт через Киото. По её берегам гуляют и бегают, у воды сидят и отдыхают. В некоторых местах через русло можно пройти по камням. Летом на отдельных участках берега рестораны устраивают террасы над водой. Река связана с повседневной жизнью города не меньше, чем с его известными видами.',
            'После храма и тесных улиц задержись у открытой поверхности. Бумажной реке нужно немного: другой цвет, просвет, переправа. Река и мост в этой сцене расположены свободно. Последняя остановка меняет ритм и даёт рассмотреть пространство между постройками, не создавая впечатления, что в настоящем Киото все три места находятся рядом.'
          ],
          kk: [
            'Камо өзені Киото арқылы ағады. Оның жағасында адамдар серуендейді, жүгіреді, суға қарап демалады. Кей жерлерде арнаны аттама тастар арқылы кесіп өтуге болады. Өзеннің кейбір бөліктерінде мейрамханалар жазғы террасаларын суға қарай шығарады. Камо қаланың әйгілі көріністеріне де, күнделікті тіршілігіне де ортақ.',
            'Ғибадатхана мен тар көшелерден кейін ашық кеңістікке назар аудар. Қағаз өзенді бейнелеуге басқа түс, саңылау мен өткел жеткілікті. Бұл көріністегі өзен мен көпір еркін орналастырылған. Соңғы аялдама құрылыстар арасындағы кеңістікті байыппен қарауға шақырады. Ол үш орынның шын қалада қатар тұрғанын білдірмейді.'
          ]
        },
        source: { label: 'Japan National Tourism Organization', url: 'https://www.japan.travel/en/spot/1183/' }
      }
    ]
  },
  {
    id: 'lisbon', number: '02',
    name: { en: 'Lisbon', ru: 'Лиссабон', kk: 'Лиссабон' },
    subtitle: { en: 'A little uphill. A little ocean.', ru: 'Чуть выше по склону. Чуть ближе к океану.', kk: 'Өрге қарай. Мұхитқа жақын.' },
    notes: {
      en: 'Lisbon is arranged as a change of scale: Alfama’s close rooftops, a yellow tram, then the river-facing tower of Belém. Ochre, tile-like marks and broad water give this fold its own vocabulary. The viewing sequence joins motifs from different parts of the city. It is not a single tram ride or a measured walking route, and the miniature rails do not describe the current transport network.',
      ru: 'Лиссабон построен на смене масштаба: тесные крыши Алфамы, жёлтый трамвай, затем обращённая к реке Беленская башня. Охра, узор плитки и широкая вода отличают эту складку от остальных. Последовательность объединяет мотивы разных частей города. Это не одна поездка на трамвае и не пешеходный маршрут; рельсы в миниатюре не повторяют действующую транспортную сеть.',
      kk: 'Лиссабонда ауқым біртіндеп өзгереді: Алфаманың тығыз шатырлары, сары трамвай, содан кейін өзенге қараған Белен мұнарасы. Охра түсі, тақташа өрнегі мен кең су айдыны осы қатпардың сипатын береді. Көру реті қаланың әр бөлігінен алынған көріністерді біріктіреді. Бұл бір трамвай сапары да, жаяу жүру бағыты да емес. Шағын рельстер қазіргі көлік желісін қайталамайды.'
    },
    places: [
      {
        id: 'alfama',
        name: { en: 'Alfama', ru: 'Алфама', kk: 'Алфама' },
        kind: { en: 'Neighbourhood · Hills & lanes', ru: 'Район · Холмы и переулки', kk: 'Аудан · Төбелер мен көшелер' },
        teaser: { en: 'Roof by roof, the hill finds its shape.', ru: 'Крыша за крышей проступает холм.', kk: 'Шатырлар арасынан төбе сұлбасы көрінеді.' },
        paragraphs: {
          en: [
            'Alfama is one of Lisbon’s oldest neighbourhoods, known for steep cobbled lanes, stairways and closely gathered buildings. Its viewpoints look across the rooftops towards the Tagus. Fado is part of the district’s cultural life, with music heard in its dedicated houses. The area rewards attention to the small scale of doors, corners and turns.',
            'Start this fold among the roofs. Let the taller and lower pieces show the hill without trying to trace a street on a map. Paper makes each change in level legible through a small shadow. The scene condenses the neighbourhood’s layered character into an invented arrangement, leaving you free to look at its rhythm before following the yellow tram.'
          ],
          ru: [
            'Алфама, один из старейших районов Лиссабона, известна крутыми мощёными переулками, лестницами и тесно стоящими домами. Со смотровых площадок над крышами виден Тежу. Фаду остаётся частью местной культуры: для этой музыки здесь есть особые заведения. Район располагает к вниманию к небольшим деталям, дверям, углам и поворотам.',
            'Начни эту складку среди крыш. Высокие и низкие части обозначают холм, но не предлагают искать конкретную улицу на карте. В бумаге каждый перепад высоты читается по небольшой тени. Сцена собирает многослойность района в вымышленную композицию: сначала можно рассмотреть её ритм, затем перейти к жёлтому трамваю.'
          ],
          kk: [
            'Алфама, Лиссабонның ең көне аудандарының бірі, тік тас көшелерімен, баспалдақтарымен және тығыз орналасқан үйлерімен белгілі. Шолу алаңдарынан шатырлардың ар жағындағы Тежу өзені көрінеді. Фаду музыкасы аудан мәдениетінің бір бөлігі, оны арнайы орындарда орындайды. Мұнда есік, бұрыш, бұрылыс сияқты ұсақ бөлшектерге үңілген жөн.',
            'Бұл қатпарды шатырлар арасынан қараудан баста. Биік және аласа бөліктер төбені аңғартады, бірақ картадағы нақты көшені көрсетпейді. Қағазда әр биіктік айырмасы шағын көлеңкемен білінеді. Ауданның қабаттасқан бейнесі ойдан құрастырылған көрініске айналған. Алдымен оның ырғағын байқап, содан кейін сары трамвайға өт.'
          ]
        },
        source: { label: 'Visit Lisboa · Turismo de Lisboa', url: 'https://www.visitlisboa.com/en/places/alfama' }
      },
      {
        id: 'tram28',
        name: { en: 'Tram 28', ru: 'Трамвай № 28', kk: '№ 28 трамвай' },
        kind: { en: 'City icon · On rails', ru: 'Символ города · На рельсах', kk: 'Қала нышаны · Рельс үстінде' },
        teaser: { en: 'A yellow line through the folds.', ru: 'Жёлтая линия среди складок.', kk: 'Қатпарлар арасындағы сары сызық.' },
        paragraphs: {
          en: [
            'Lisbon’s small yellow trams have become part of the city’s visual identity. The number 28 is especially associated with historic neighbourhoods, steep streets and buildings faced with azulejos, the ceramic tiles seen across the city. The tram gives those streets a moving frame: façades, slopes and squares appear in succession through its windows.',
            'In this atlas, the yellow body is a deliberate accent among the pale roofs. Follow its shape rather than a timetable. Its rails are drawn for the composition and do not plot an operating route or connect every landmark shown. As the middle stop, the tram shifts attention from Alfama’s small street details towards the wider river setting of the final chapter.'
          ],
          ru: [
            'Небольшие жёлтые трамваи стали частью узнаваемого облика Лиссабона. Маршрут № 28 особенно связан с историческими районами, крутыми улицами и фасадами, покрытыми керамической плиткой азулежу. Через трамвайное окно город раскрывается последовательно: дома сменяются склонами и площадями, а движение задаёт свой способ смотреть на улицу.',
            'В этом атласе жёлтый вагон выделяется среди светлых крыш. Следи за его формой, а не за расписанием. Рельсы нарисованы для композиции: они не повторяют действующий маршрут и не соединяют все показанные достопримечательности. Вторая остановка переводит внимание с мелких деталей Алфамы к более широкому речному пространству заключительной главы.'
          ],
          kk: [
            'Шағын сары трамвайлар Лиссабонның танымал бейнесіне айналған. Әсіресе № 28 бағыты тарихи аудандармен, тік көшелермен және азулежу керамикалық тақташаларымен қапталған қасбеттермен байланысты. Трамвай терезесінен үйлер, беткейлер мен алаңдар бірінен соң бірі көрінеді. Қозғалыс көшеге басқаша қарауға мүмкіндік береді.',
            'Атласта сары вагон ақшыл шатырлар арасынан көзге түседі. Мұнда кестеге емес, оның пішініне назар аудар. Рельстер көрініс үшін салынған: олар нақты бағытты қайталамайды және көрсетілген барлық нысанды жалғамайды. Екінші аялдама назарды Алфаманың шағын бөлшектерінен соңғы тараудағы кең өзен жағасына бұрады.'
          ]
        },
        source: { label: 'Visit Lisboa · Turismo de Lisboa', url: 'https://www.visitlisboa.com/en/places/no-28-tram' }
      },
      {
        id: 'belem',
        name: { en: 'Belém Tower', ru: 'Беленская башня', kk: 'Белен мұнарасы' },
        kind: { en: 'Landmark · Tagus riverfront', ru: 'Памятник · Берег Тежу', kk: 'Ескерткіш · Тежу жағасы' },
        teaser: { en: 'A watchtower at the water’s edge.', ru: 'Сторожевая башня у кромки воды.', kk: 'Су жиегіндегі күзет мұнарасы.' },
        paragraphs: {
          en: [
            'Belém Tower stands beside the Tagus at the entrance to Lisbon’s harbour. Designed by Francisco de Arruda in the sixteenth century, it combined defence with royal symbolism. A bastion extends towards the river beneath the tower. Together with the nearby Jerónimos Monastery, it forms a UNESCO World Heritage property inscribed in 1983.',
            'Let the last stop open the composition out. After the neighbourhood and tram, the tower meets a broader, quieter surface. In the paper interpretation, its strong vertical shape and low river-facing base are the important clues. Fine stone carving is reduced to simple marks and edges. This is a study in silhouette and setting, rather than a miniature architectural record of every window and turret.'
          ],
          ru: [
            'Беленская башня стоит у Тежу, при входе в лиссабонскую гавань. Франсишку де Арруда спроектировал её в XVI веке, объединив оборонительную функцию с символами королевской власти. Под башней к реке выступает бастион. Вместе с расположенным неподалёку монастырём Жеронимуш она входит в объект Всемирного наследия ЮНЕСКО, включённый в список в 1983 году.',
            'Последняя остановка раскрывает композицию. После района и трамвая башня выходит к широкой спокойной поверхности. Для бумажной версии важны её вертикальный силуэт и низкое основание, обращённое к воде. Каменная резьба сведена к простым линиям и граням. Это работа с силуэтом и окружением, а не архитектурная копия каждого окна и башенки.'
          ],
          kk: [
            'Белен мұнарасы Тежу жағасында, Лиссабон айлағының кіреберісінде тұр. Оны XVI ғасырда Франсишку де Арруда жобалаған. Ғимарат қорғаныс қызметін атқарып, патша билігінің нышандарын да көрсеткен. Мұнараның төменгі жағындағы бастион өзенге қарай шығып тұр. Жақын маңдағы Жеронимуш монастырымен бірге ол 1983 жылы ЮНЕСКО-ның Дүниежүзілік мұра тізіміне енген.',
            'Соңғы аялдама көріністі кеңейтеді. Аудан мен трамвайдан кейін мұнара ашық су айдынына шығады. Қағаз нұсқада оның тік сұлбасы мен суға қараған аласа табаны маңызды. Тастағы оюлар қарапайым сызықтар мен қырларға айналған. Мұнда әр терезе мен мұнарашаны көшіруден гөрі, жалпы сұлба мен айналаға мән берілген.'
          ]
        },
        source: { label: 'UNESCO · World Heritage Centre', url: 'https://whc.unesco.org/en/list/263/' }
      }
    ]
  },
  {
    id: 'almaty', number: '03',
    name: { en: 'Almaty', ru: 'Алматы', kk: 'Алматы' },
    subtitle: { en: 'Green streets. Mountains close.', ru: 'Зелёные улицы. Горы рядом.', kk: 'Жасыл көшелер. Жақын таулар.' },
    notes: {
      en: 'Almaty is composed in layers: a cathedral among trees, the horizontal rhythm of a market, then a hill looking back over the city. The mountain folds are an expressive backdrop, not a profile traced from a survey. The three stops move your attention from a building to everyday exchange and finally to the wider landscape. Their placement is editorial, not a claim about actual distances or a continuous walking route.',
      ru: 'Алматы собран слоями: собор среди деревьев, горизонтальный ритм рынка, затем холм с взглядом на город. Горные складки служат выразительным фоном и не повторяют точный профиль хребта. Три остановки переводят внимание от здания к повседневной торговле и дальше к пейзажу. Их расположение подчинено композиции, а не реальным расстояниям или непрерывному пешему маршруту.',
      kk: 'Алматы қабат-қабат ашылады: ағаштар арасындағы собор, базардың көлденең қатары, содан кейін қалаға қарайтын төбе. Қағаз тау қатпарлары жотаның дәл кескіні емес, көріністің көркем аясы. Үш аялдама назарды ғимараттан күнделікті саудаға, одан кең пейзажға ауыстырады. Олардың орналасуы нақты қашықтыққа не тұтас жаяу бағытқа емес, композицияға бағынады.'
    },
    places: [
      {
        id: 'cathedral',
        name: { en: 'Ascension Cathedral', ru: 'Вознесенский собор', kk: 'Вознесенск соборы' },
        kind: { en: 'Architecture · Panfilov Park', ru: 'Архитектура · Парк Панфиловцев', kk: 'Сәулет · Панфиловшылар саябағы' },
        teaser: { en: 'A wooden landmark among the trees.', ru: 'Деревянный собор среди деревьев.', kk: 'Ағаштар арасындағы ағаш собор.' },
        paragraphs: {
          en: [
            'The Ascension Cathedral stands in Almaty’s Park of the 28 Panfilov Guardsmen. Built in 1904–1907, this wooden Orthodox cathedral survived the destructive earthquake of 1911. Its history connects the city’s early twentieth-century architecture with an active place of worship today. The timber structure is a particularly distinctive part of Almaty’s built heritage.',
            'Begin the Almaty fold with the building’s clustered silhouette, then notice how the surrounding trees change its scale. Paper offers a light way to study the relationship between towers, roof and park. The miniature uses an architectural motif rather than a measured replica. Its purpose is to make the city recognisable while leaving enough open space for the market and mountain chapters to unfold.'
          ],
          ru: [
            'Вознесенский собор стоит в алматинском парке имени 28 гвардейцев-панфиловцев. Деревянный православный храм построили в 1904–1907 годах. Он выдержал разрушительное землетрясение 1911 года и остаётся действующим собором. Его история связывает архитектуру начала XX века с сегодняшней жизнью города, а деревянная конструкция выделяет его среди памятников Алматы.',
            'Начни эту складку с силуэта собора, затем посмотри, как деревья вокруг меняют ощущение масштаба. Бумага позволяет легко показать связь башен, крыши и парка. Миниатюра использует архитектурный мотив, не претендуя на точную копию. Она помогает узнать город и оставляет свободное пространство для следующих глав, базара и горного пейзажа.'
          ],
          kk: [
            'Вознесенск соборы Алматыдағы 28 гвардияшы-панфиловшылар саябағында орналасқан. Ағаш православ ғибадатханасы 1904–1907 жылдары салынған. Ол 1911 жылғы жойқын жер сілкінісіне төтеп берген және қазір де діни қызмет атқарады. Собордың тарихы XX ғасыр басындағы сәулетті бүгінгі қала өмірімен байланыстырады. Ағаш құрылысы Алматының сәулет мұрасында ерекше орын алады.',
            'Бұл қатпарды собор сұлбасынан баста, содан кейін айналасындағы ағаштар оның ауқымын қалай өзгертетініне қара. Қағаз мұнаралар, шатыр мен саябақ арасындағы байланысты жеңіл жеткізеді. Шағын көрініс сәулеттік мотивті қолданады, бірақ дәл көшірме болуға ұмтылмайды. Ол қаланы танытып, базар мен тау пейзажы ашылатын кеңістік қалдырады.'
          ]
        },
        source: { label: 'Kazakhstan.travel · National tourism portal', url: 'https://kazakhstan.travel/ru/attractions/403' }
      },
      {
        id: 'bazaar',
        name: { en: 'Green Bazaar', ru: 'Зелёный базар', kk: 'Көк базар' },
        kind: { en: 'Market · Everyday exchange', ru: 'Рынок · Городская жизнь', kk: 'Базар · Қала тіршілігі' },
        teaser: { en: 'The city gathers around a counter.', ru: 'Город встречается у прилавка.', kk: 'Қала өмірі сауда қатарында тоғысады.' },
        paragraphs: {
          en: [
            'The Green Bazaar is one of Almaty’s best-known food markets. Fruit, vegetables, dried fruit, spices, meat and dairy products share its trading spaces with traditional Kazakh foods. Kazakhstan’s tourism portal describes it as a meeting place within the city’s everyday life, where trade and conversations in different languages give the market its character.',
            'Look for a different kind of architecture here: a covering, a row, a place for people to gather. The paper composition treats the market as a repeated horizontal rhythm rather than an inventory of stalls. It is the middle chapter of this fold because it brings the city back to daily exchange. From here, the final stop opens the view towards the hill.'
          ],
          ru: [
            'Зелёный базар, один из самых известных продуктовых рынков Алматы, объединяет торговлю фруктами, овощами, сухофруктами, специями, мясом и молочными продуктами. Здесь представлены и традиционные казахские продукты. Национальный туристический портал описывает рынок как часть повседневной городской жизни, которой придают характер торговля и разговоры на разных языках.',
            'Здесь стоит заметить другую архитектуру: навес, ряд, место для встречи. Бумажная композиция передаёт рынок повторяющимся горизонтальным ритмом, не перечисляя все его прилавки. Эта остановка занимает середину маршрута просмотра и возвращает город к повседневному обмену. После неё последняя глава раскрывает вид в сторону холма.'
          ],
          kk: [
            'Көк базар, Алматының ең танымал азық-түлік базарларының бірі, жеміс-жидек, көкөніс, кепкен жеміс, дәмдеуіш, ет пен сүт өнімдерін ұсынады. Мұнда дәстүрлі қазақ тағамдары да бар. Ұлттық туристік портал базарды қала тіршілігінің бір бөлігі ретінде сипаттайды. Оның сипатын сауда мен әр тілде айтылған әңгімелер қалыптастырады.',
            'Мұнда сәулеттің басқа түріне назар аудар: қалқа, қатар, адамдар бас қосатын орын. Қағаз көрініс барлық сөрені тізбей, базарды қайталанатын көлденең ырғақпен бейнелейді. Бұл аялдама көру ретінің ортасында тұр және қаланың күнделікті тіршілігін көрсетеді. Одан кейінгі соңғы тарауда көрініс төбе жаққа қарай кеңейеді.'
          ]
        },
        source: { label: 'Kazakhstan.travel · National tourism portal', url: 'https://kazakhstan.travel/ru/attractions/404' }
      },
      {
        id: 'koktobe',
        name: { en: 'Kok Tobe', ru: 'Кок-Тобе', kk: 'Көктөбе' },
        kind: { en: 'Hill · A wider view', ru: 'Холм · Общий план', kk: 'Төбе · Кең көрініс' },
        teaser: { en: 'Turn back towards the city.', ru: 'Обернись к городу.', kk: 'Қалаға қайта көз сал.' },
        paragraphs: {
          en: [
            'Kok Tobe is a hilltop recreation area overlooking Almaty. Its park sits about 1,100 metres above sea level. The park’s own history describes plans for viewing terraces and walking avenues in the 1960s, with construction of the cableway beginning in 1965. The elevated viewpoint gives a broader setting to the city below.',
            'End this sequence by looking back across the whole fold. The mountain layers are an expressive paper backdrop; they do not identify individual peaks or promise a particular real-world view. Let the city become a collection of shapes again: a roof, a long market line, trees between them. This final chapter is about changing the scale of your attention before folding Almaty away.'
          ],
          ru: [
            'Кок-Тобе, зона отдыха на вершине холма, возвышается над Алматы. Парк расположен примерно на высоте 1100 метров над уровнем моря. В его официальной истории описаны планы смотровых площадок и прогулочных аллей 1960-х годов; строительство канатной дороги началось в 1965 году. С высоты город виден в более широком окружении.',
            'Заверши последовательность взглядом на всю складку. Слои бумажных гор служат выразительным фоном: они не обозначают отдельные вершины и не обещают конкретную панораму на месте. Город снова становится сочетанием форм: крыша, длинная линия рынка, деревья между ними. Эта глава меняет масштаб внимания перед тем, как Алматы сложится обратно.'
          ],
          kk: [
            'Көктөбе, Алматының үстінен қарайтын төбедегі демалыс орны. Саябақ теңіз деңгейінен шамамен 1100 метр биіктікте орналасқан. Оның ресми тарихында 1960-жылдары шолу алаңдары мен серуен аллеяларын салу жоспарланғаны жазылған. Аспалы жолдың құрылысы 1965 жылы басталған. Биіктен қарағанда шаһар айналасымен бірге көрінеді.',
            'Көру ретін бүкіл қатпарға қайта көз салумен аяқта. Қағаз таулардың қабаттары көркем көрініс жасайды. Олар жеке шыңдарды белгілемейді және шын жердегі нақты панораманы уәде етпейді. Қала қайтадан пішіндер жиынтығына айналады: шатыр, базардың ұзын қатары, олардың арасындағы ағаштар. Алматы қайта жиналмас бұрын, осы тарау назардың ауқымын кеңейтеді.'
          ]
        },
        source: { label: 'Kok Tobe · Official park history', url: 'https://koktobe.com/o-nas' }
      }
    ]
  }
];

const english = {
  tagline: 'Unfold somewhere.',
  atlas: 'A paper atlas',
  chooseCity: 'Choose a city',
  backToCrane: 'Fold back',
  backToCity: 'Back to the city',
  walk: 'Walk',
  places: 'Places',
  notes: 'Notes',
  beginWalk: 'Begin the walk',
  previous: 'Previous',
  next: 'Next',
  finishWalk: 'Finish the walk',
  stop: 'Stop',
  of: 'of',
  readStory: 'Read the story',
  close: 'Close',
  save: 'Save place',
  saved: 'Saved',
  savedPlaces: 'Saved places',
  noSavedPlaces: 'Keep a place here by saving it from its story.',
  source: 'Source',
  artNote: 'An artistic interpretation, not a map.',
  dragHint: 'Drag gently to look around',
  keyboardHint: 'Use Tab to choose. Press Enter to open. Escape goes back.',
  skipIntro: 'Skip intro',
  loadingPaper: 'Preparing the paper',
  loadingScene: 'Assembling the scene',
  reducedMotion: 'Reduced motion',
  language: 'Language',
  soundOff: 'Sound off',
  resetView: 'Reset view',
  destinations: 'Cities',
  about: 'About',
  aboutTitle: 'Three cities. One paper crane.',
  aboutBody: 'FOLD is an independent portfolio concept by Beibars Ileskhan. An original paper model becomes a playful editorial atlas, with nine stories in three languages. It is an artistic exploration, not a travel service.',
  madeBy: 'Made by Beibars Ileskhan',
  portfolio: 'Portfolio',
  fallback: 'Paper edition · 3D is unavailable. All places and stories are still here.',
  retry3d: 'Try 3D again',
  loadingFailed: 'The scene could not load. Continue with the paper edition.',
  firstVisit: 'An atlas inside a paper crane',
  selectFold: 'Choose a fold to begin',
  explore: 'Explore',
  back: 'Back',
  remove: 'Remove from saved',
  savedUnavailable: 'This browser cannot keep your saved places after you leave.',
  copied: 'Link copied',
  share: 'Copy link',
  sceneDescription: 'An ivory paper crane opens its wing into a miniature city against a red background.',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fullList: 'See all places',
  nextCity: 'Next city',
  guideIntro: 'Three stops to explore this fold. A viewing sequence, not a walking route.',
  chapter: 'Chapter',
  visitSource: 'Read the official source',
  folded: 'Folded',
  showSaved: 'Open saved places',
  touchHint: 'Tap a place to open its story',
  rotateLeft: 'Look left',
  rotateRight: 'Look right',
  openCity: 'Open city',
  openPlace: 'Open place',
  savedHint: 'Saved in this browser',
  shareFailed: 'Copy this address from your browser to share.',
  home: 'Home',
  routeComplete: 'You have reached the last stop.',
  sceneReady: 'The paper atlas is ready.',
  lightVersion: 'Paper edition',
  returnToWalk: 'Return to the walk',
  authorNotes: 'Notes on this fold'
};
export type UIStrings = typeof english;
export const ui: Record<Lang, UIStrings> = {
  en: english,
  ru: {
    tagline: 'Разверни новый город.',
    atlas: 'Бумажный атлас',
    chooseCity: 'Выбери город',
    backToCrane: 'Сложить обратно',
    backToCity: 'К городу',
    walk: 'Прогулка',
    places: 'Места',
    notes: 'Заметки',
    beginWalk: 'Начать прогулку',
    previous: 'Назад',
    next: 'Далее',
    finishWalk: 'Завершить прогулку',
    stop: 'Остановка',
    of: 'из',
    readStory: 'Открыть историю',
    close: 'Закрыть',
    save: 'Сохранить место',
    saved: 'Сохранено',
    savedPlaces: 'Сохранённые места',
    noSavedPlaces: 'Сохрани понравившееся место из его истории. Оно появится здесь.',
    source: 'Источник',
    artNote: 'Художественная интерпретация, а не карта.',
    dragHint: 'Плавно перетаскивай, чтобы осмотреть сцену',
    keyboardHint: 'Tab выбирает, Enter открывает, Escape возвращает назад.',
    skipIntro: 'Пропустить вступление',
    loadingPaper: 'Готовим бумагу',
    loadingScene: 'Собираем сцену',
    reducedMotion: 'Меньше движения',
    language: 'Язык',
    soundOff: 'Звук выключен',
    resetView: 'Вернуть ракурс',
    destinations: 'Города',
    about: 'О проекте',
    aboutTitle: 'Три города. Один бумажный журавль.',
    aboutBody: 'Beibars Ileskhan создал FOLD как самостоятельный проект для портфолио. Авторская бумажная модель превращается в интерактивный атлас с девятью историями на трёх языках. Это художественный проект, а не туристический сервис.',
    madeBy: 'Автор: Beibars Ileskhan',
    portfolio: 'Портфолио',
    fallback: 'Бумажная версия · 3D недоступно. Все места и истории можно открыть здесь.',
    retry3d: 'Снова включить 3D',
    loadingFailed: 'Не удалось загрузить сцену. Продолжи в бумажной версии.',
    firstVisit: 'Атлас внутри бумажного журавля',
    selectFold: 'Выбери складку и начни',
    explore: 'Исследовать',
    back: 'Назад',
    remove: 'Убрать из сохранённого',
    savedUnavailable: 'Этот браузер не сможет сохранить выбранные места после выхода.',
    copied: 'Ссылка скопирована',
    share: 'Скопировать ссылку',
    sceneDescription: 'Бумажный журавль цвета слоновой кости раскрывает крыло с миниатюрным городом на красном фоне.',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    fullList: 'Все места',
    nextCity: 'Следующий город',
    guideIntro: 'Три остановки, чтобы рассмотреть складку. Это порядок просмотра, а не пеший маршрут.',
    chapter: 'Глава',
    visitSource: 'Открыть официальный источник',
    folded: 'Сложено',
    showSaved: 'Открыть сохранённые места',
    touchHint: 'Нажми на место, чтобы открыть историю',
    rotateLeft: 'Посмотреть слева',
    rotateRight: 'Посмотреть справа',
    openCity: 'Открыть город',
    openPlace: 'Открыть место',
    savedHint: 'Сохраняется в этом браузере',
    shareFailed: 'Чтобы поделиться, скопируй адрес из строки браузера.',
    home: 'Главная',
    routeComplete: 'Это последняя остановка.',
    sceneReady: 'Бумажный атлас готов.',
    lightVersion: 'Бумажная версия',
    returnToWalk: 'Вернуться к прогулке',
    authorNotes: 'Об этой складке'
  },
  kk: {
    tagline: 'Жаңа қаланы аш.',
    atlas: 'Қағаз атлас',
    chooseCity: 'Қаланы таңда',
    backToCrane: 'Қайта бүктеу',
    backToCity: 'Қалаға оралу',
    walk: 'Серуен',
    places: 'Орындар',
    notes: 'Жазбалар',
    beginWalk: 'Серуенді бастау',
    previous: 'Артқа',
    next: 'Келесі',
    finishWalk: 'Серуенді аяқтау',
    stop: 'Аялдама',
    of: '/',
    readStory: 'Әңгімені оқу',
    close: 'Жабу',
    save: 'Орынды сақтау',
    saved: 'Сақталды',
    savedPlaces: 'Сақталған орындар',
    noSavedPlaces: 'Ұнаған орынды оның әңгімесінен сақта. Ол осында пайда болады.',
    source: 'Дереккөз',
    artNote: 'Бұл карта емес, көркем бейнелеу.',
    dragHint: 'Көріністі қарау үшін жайлап сүйре',
    keyboardHint: 'Tab арқылы таңда, Enter арқылы аш, Escape арқылы артқа орал.',
    skipIntro: 'Кіріспені өткізу',
    loadingPaper: 'Қағаз дайындалып жатыр',
    loadingScene: 'Көрініс жиналып жатыр',
    reducedMotion: 'Қозғалысты азайту',
    language: 'Тіл',
    soundOff: 'Дыбыс өшірулі',
    resetView: 'Бастапқы көрініс',
    destinations: 'Қалалар',
    about: 'Жоба туралы',
    aboutTitle: 'Үш қала. Бір қағаз тырна.',
    aboutBody: 'FOLD жобасын Beibars Ileskhan дербес портфолио жұмысы ретінде жасады. Авторлық қағаз модель үш тілдегі тоғыз әңгімесі бар интерактивті атласқа айналады. Бұл туристік қызмет емес, көркем жоба.',
    madeBy: 'Автор: Beibars Ileskhan',
    portfolio: 'Портфолио',
    fallback: 'Қағаз нұсқа · 3D қолжетімсіз. Барлық орын мен әңгімені осы жерден ашуға болады.',
    retry3d: '3D нұсқасын қайта қосу',
    loadingFailed: 'Көрініс жүктелмеді. Қағаз нұсқада жалғастыр.',
    firstVisit: 'Қағаз тырнаның ішіндегі атлас',
    selectFold: 'Қатпарды таңдап, баста',
    explore: 'Зерттеу',
    back: 'Артқа',
    remove: 'Сақталғандардан алып тастау',
    savedUnavailable: 'Бұл браузер шыққаннан кейін таңдаған орындарыңды сақтай алмайды.',
    copied: 'Сілтеме көшірілді',
    share: 'Сілтемені көшіру',
    sceneDescription: 'Қызыл фонда піл сүйегі түстес қағаз тырнаның қанатынан шағын қала ашылады.',
    zoomIn: 'Жақындату',
    zoomOut: 'Алыстату',
    fullList: 'Барлық орын',
    nextCity: 'Келесі қала',
    guideIntro: 'Қатпарды қарауға арналған үш аялдама. Бұл жаяу бағыт емес, көру реті.',
    chapter: 'Тарау',
    visitSource: 'Ресми дереккөзді ашу',
    folded: 'Бүктелді',
    showSaved: 'Сақталған орындарды ашу',
    touchHint: 'Әңгімесін оқу үшін орынды бас',
    rotateLeft: 'Сол жақтан қарау',
    rotateRight: 'Оң жақтан қарау',
    openCity: 'Қаланы ашу',
    openPlace: 'Орынды ашу',
    savedHint: 'Осы браузерде сақталады',
    shareFailed: 'Бөлісу үшін браузердегі мекенжайды көшір.',
    home: 'Басты бет',
    routeComplete: 'Бұл соңғы аялдама.',
    sceneReady: 'Қағаз атлас дайын.',
    lightVersion: 'Қағаз нұсқа',
    returnToWalk: 'Серуенге оралу',
    authorNotes: 'Осы қатпар туралы'
  }
};
