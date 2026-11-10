# FOLD: editorial sources and translation notes

Last checked: **2026-11-10 (UTC)**. Scope: the text in `src/content.ts`.

## Editorial approach

FOLD is an independently written cultural atlas, not a journey-planning service. The nine English stories are 113–118 words each. Each has a factual opening and an explicitly artistic reading of the paper scene. Russian and Kazakh versions preserve the same facts and editorial meaning, rather than copying English word order or padding to an identical word count.

Only the stable cultural and historical facts listed below are used. No opening hours, prices, transport availability, walking distances, access guarantees or accessibility claims are published. The sources may contain those details; linking to them does not copy their operational claims into FOLD.

The places are real. Their arrangement, miniature architecture, colours, watercourses, mountain profiles, scale and viewing order are artistic choices. They are not a geographical map or a record of measured buildings. Generated concept-image labels were not used as factual evidence. Every place has its own visible source URL in the content data.

## Sources by place

### Kyoto

- **Kiyomizu-dera** (`kiyomizu`): [Official temple visitor guide](https://www.kiyomizudera.or.jp/en/visit/). Verified the association of the name with Otowa Waterfall, the main hall's location on Mount Otowa, its reconstruction in 1633, timber stage construction, and Kannon dedication. Confidence: high for these retained facts. Paper architecture is described as an interpretation of roof and platform, not an exact temple or a named pagoda.
- **Gion** (`gion`): [Kyoto City official guide: Gion & Kiyomizu](https://kyoto.travel/en/areas/gion-kiyomizu/). Verified development near Yasaka Shrine, tea houses/restaurants/shops, geiko and maiko traditions, and the guidance against photographing maiko without permission. Confidence: high. No promise of seeing performers and no recommendation to enter private lanes or properties.
- **Kamo River** (`kamo`): [Japan National Tourism Organization](https://www.japan.travel/en/spot/1183/). Verified riverbank walking/running, stepping-stone crossings in some places, and summer riverside dining platforms. Confidence: high. These are cultural descriptions, not instructions about where or when to cross the river. [Kyoto Prefecture's river page](https://www.pref.kyoto.jp/kamogawa/) corroborates the river's role in the city; FOLD does not reproduce its length or flood-control information.

### Lisbon

- **Alfama** (`alfama`): [Turismo de Lisboa](https://www.visitlisboa.com/en/places/alfama). Verified historic neighbourhood character, steep cobbled lanes, stairs, views towards the Tagus and association with fado houses. Confidence: high. The copy says “one of the oldest” rather than treating the tourism site's promotional superlative as a precise historical ranking.
- **Tram 28** (`tram28`): [Turismo de Lisboa: No. 28 Tram](https://www.visitlisboa.com/en/places/no-28-tram). Verified yellow tram imagery, historic neighbourhoods, slopes and azulejo façades. Confidence: high for cultural associations. Route endpoints, operating pattern, fares and travel time are deliberately omitted; the miniature rails are not a network diagram. The scene does not claim this tram connects Alfama with Belém.
- **Belém Tower** (`belem`): [UNESCO World Heritage Centre, property 263](https://whc.unesco.org/en/list/263/), with [Turismo de Lisboa](https://www.visitlisboa.com/en/places/torre-de-belem/) as corroboration. Verified the Tagus/harbour setting, Francisco de Arruda, sixteenth-century origin, defensive and royal symbolism, projecting bastion, joint listing with Jerónimos Monastery and inscription in 1983. Confidence: high. Exact construction/completion years vary in official summaries and are not used.

### Almaty

- **Ascension Cathedral** (`cathedral`): [Kazakhstan national tourism portal, attraction 403](https://kazakhstan.travel/ru/attractions/403). Verified wooden Orthodox construction, the Park of the 28 Panfilov Guardsmen setting, construction in 1904–1907, survival of the 1911 earthquake and present religious use. Confidence: high for the retained facts. The popular “without a single nail” claim, dimensions and tallest-building rankings are deliberately excluded. The [Margulan Institute of Archaeology heritage entry](https://archaeology.kz/ru/heritages/53-voznesensk-kafedraly-sobory) explicitly describes metal bolts in the structure, a reason to avoid repeating the nail-free simplification. The Visit Almaty cathedral page was discoverable but its full text timed out in the research tool; it is not the linked evidentiary source.
- **Green Bazaar** (`bazaar`): [Kazakhstan national tourism portal, attraction 404](https://kazakhstan.travel/ru/attractions/404). Verified the market's food categories, Kazakh foods, multilingual trade and role in city life. Confidence: high for these broad cultural facts. No construction date, superlative about age, fixed stall layout or renovation status is asserted. [Almaty's city tourism gastronomy page](https://gastro.visitalmaty.kz/) also lists the market. The Kazakh display name is the commonly used **Көк базар**.
- **Kok Tobe** (`koktobe`): [Official park history](https://koktobe.com/o-nas). Verified the hilltop park, approximate 1,100 m elevation, 1960s plans for viewpoints/avenues and the start of cableway construction in 1965. Confidence: high for these stable facts. Transport operating status, access methods and journey times are not presented. The park site's news includes operational closures; FOLD therefore does not imply the cableway is available at any particular time. Kazakh name: **Көктөбе**.

## Curated viewing sequences

The three `places` arrays define the sequence used by the guided scene. These are editorial orders of attention, not recommended physical journeys:

1. **Kyoto:** Kiyomizu-dera → Gion → Kamo River. From a broad roof to enclosed streets to open water.
2. **Lisbon:** Alfama → Tram 28 → Belém Tower. From layered rooftops to a moving city symbol to the riverfront.
3. **Almaty:** Ascension Cathedral → Green Bazaar → Kok Tobe. From an individual building to everyday exchange to a wider landscape.

City notes and the guided-view introduction disclose the artistic compression. No distances or durations are assigned.

## Languages and QA

- Supported languages: English (`en`, default), Russian (`ru`) and Kazakh in Cyrillic (`kk`).
- All 3 cities have names, subtitles and notes in each language. All 9 places have names, categories, teasers and two article paragraphs in each language.
- UI strings use `Record<Lang, UIStrings>` so omissions or extra divergent keys fail TypeScript checks. There are 71 UI keys per language at this revision.
- Each story has the same factual scope across languages. Russian addresses the visitor with “ты”; Kazakh uses concise singular imperatives suitable for an interface. Both avoid artificial word-for-word reproduction of English slogans. “Unfold somewhere.” is rendered as the brief requires in Russian, “Разверни новый город.”, and as “Жаңа қаланы аш.” in Kazakh.
- Author spelling **Beibars Ileskhan** is retained in all languages; no unverified official Cyrillic spelling is asserted.
- The Kazakh content includes all nine additional Kazakh Cyrillic letters: Ә Ғ Қ Ң Ө Ұ Ү Һ І (including their lowercase forms). This is content coverage, not proof that a chosen font renders them correctly. Font coverage, shaping, wrapping and screenshot review remain separate frontend checks.
- Copy was internally checked for completeness and consistency. **No independent native-speaker review is claimed.** A Kazakh editorial pass by a native speaker remains advisable before a wider public launch.
- The content file passes a standalone TypeScript check with `--skipLibCheck`. The flag avoids an unrelated third-party `@types/three` WebGPU declaration error; it does not skip the content's own type checks. The complete app build and runtime UI checks are separate responsibilities.

## Reuse and rights

All FOLD prose is newly written and paraphrased. Source pages are linked for factual verification; their photos, logos, interface, maps and descriptive text are not copied into the project. The UNESCO page identifies a licence for its own description, but FOLD does not rely on reproducing that description. No external source should be understood as endorsing the project.
