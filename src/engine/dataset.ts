import {
  AuditLogRow,
  BlockedCitationEntry,
  CertificationRuleRecord,
  CertScheme,
  DataMode,
  DataProvenance,
  GlossaryRecord,
  GoldQueryRecord,
  LanguageCode,
  PlantedDefectRecord,
  QueryType,
  ReferenceRecord,
  ReferenceRole,
  RegistryChangelogEntry,
  RoleSource,
  SavedWatchSpec,
  StandardRecord,
  StandardStatus,
  UserRole,
  ValidationIssue,
} from './types';

export const RAW_STANDARDS_CSV = `is_id,part,year,title,scope_text,ics_code,sector,status,superseded_by,latest_amendment_no,amendment_year,source_url,data_provenance,family
SYN IS 90101,Part 1,2018,Mild Steel Tubes Tubulars and Other Wrought Steel Fittings - Specification,"This standard covers requirements for welded and seamless mild steel tubes and galvanized iron (GI) pipes nominal bore 6 mm to 150 mm in light, medium and heavy grades for potable water distribution, gas and low-pressure steam. यह मानक पेयजल आपूर्ति और गैस पाइपलाइन के लिए माइल्ड स्टील और जीआई (GI) पाइप (हल्का, मध्यम और भारी ग्रेड) की आवश्यकताओं को निर्धारित करता है।",23.040.10,Metallurgy & Civil Water Supply,current,,2,2022,https://synth.bis.gov.in/standards/SYN-IS-90101,SYNTHETIC,FAM_STEEL_PIPE
SYN IS 90151,Part 1,1990,Mild Steel Tubes and Wrought Fittings (First Revision),"Historical specification for mild steel tubes for water and structural plumbing prior to 2004 revision. यह पुराना मानक स्टील पाइप के लिए था।",23.040.10,Metallurgy & Civil Water Supply,superseded,SYN IS 90152,1,1996,https://synth.bis.gov.in/standards/SYN-IS-90151,SYNTHETIC,FAM_STEEL_PIPE
SYN IS 90152,Part 1,2004,Mild Steel Tubes Tubulars and Wrought Steel Fittings (Second Revision),"Interim specification for welded and seamless mild steel tubes nominal size 15 mm to 150 mm superseded in 2018. यह मानक 2018 के संशोधन द्वारा प्रतिस्थापित किया गया है।",23.040.10,Metallurgy & Civil Water Supply,superseded,SYN IS 90101,3,2012,https://synth.bis.gov.in/standards/SYN-IS-90152,SYNTHETIC,FAM_STEEL_PIPE
SYN IS 90102,,2020,Unplasticized Polyvinyl Chloride (uPVC) Pipes for Potable Water Supplies - Specification,"Specifies requirements for plain and socketed unplasticized PVC (uPVC) pipes of nominal outside diameter 16 mm to 630 mm and pressure classes PN 4, PN 6, PN 10 and PN 16 for cold potable water supply and agriculture irrigation. यह मानक ठंडे पेयजल और कृषि सिंचाई के लिए यूपीवीसी (uPVC) पाइप के दबाव वर्ग और आयाम निर्धारित करता है।",23.040.20,Plastics & Water Supply,current,,1,2023,https://synth.bis.gov.in/standards/SYN-IS-90102,SYNTHETIC,FAM_UPVC_PIPE
SYN IS 90103,,2021,High Density Polyethylene (HDPE) Pipes for Potable Water Supply and Underground Drainage,"Covers polyethylene pipes in material grades PE 63, PE 80 and PE 100 of diameter 20 mm to 1000 mm for buried water mains, municipal distribution and pressure sewerage systems. यह मानक भूमिगत जल आपूर्ति और सीवरेज के लिए एचडीपीई (HDPE) PE 80 और PE 100 पाइप को कवर करता है।",23.040.20,Plastics & Water Supply,current,,1,2024,https://synth.bis.gov.in/standards/SYN-IS-90103,SYNTHETIC,FAM_HDPE_PIPE
SYN IS 90104,,2019,Centrifally Cast (Spun) Ductile Iron Pressure Pipes for Water Gas and Sewage,"Specifies requirements for ductile iron (DI) pipes nominal diameter DN 80 to DN 2000 in thickness classes K7 and K9 with socket and spigot joints for high-pressure municipal water transmission mains. यह मानक उच्च दबाव वाली नगरपालिका जल पाइपलाइन के लिए डक्टाइल आयरन (DI) K7 और K9 पाइप निर्धारित करता है।",23.040.10,Metallurgy & Civil Water Supply,current,,2,2023,https://synth.bis.gov.in/standards/SYN-IS-90104,SYNTHETIC,FAM_DI_PIPE
SYN IS 90201,Part 1,2019,Electrical Accessories - Circuit Breakers for Overcurrent Protection for Household and Similar Installations - Part 1 AC Operation,"Applies to air-break miniature circuit breakers (MCB) for AC operation at 50 Hz up to 440 V, rated current up to 125 A and tripping curves B, C and D for building distribution boards. घरेलू और वाणिज्यिक विद्युत वितरण बोर्डों के लिए एसी मिनिएचर सर्किट ब्रेकर (MCB) के सुरक्षा और प्रदर्शन मानक।",29.120.50,Electrotechnical,current,,1,2022,https://synth.bis.gov.in/standards/SYN-IS-90201-1,SYNTHETIC,FAM_MCB
SYN IS 90201,Part 2,2020,Electrical Accessories - Circuit Breakers for Overcurrent Protection - Part 2 AC and DC Operation,"Covers miniature circuit breakers (MCB) suitable for both alternating current (AC) and direct current (DC) photovoltaic, battery and traction auxiliary installations up to 1000 V DC. एसी और डीसी सौर एवं बैटरी अनुप्रयोगों के लिए एमसीबी (MCB) आवश्यकताएं।",29.120.50,Electrotechnical,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90201-2,SYNTHETIC,FAM_MCB
SYN IS 90301,Part 1,2020,Self-Ballasted LED Lamps for General Lighting Services - Part 1 Safety Requirements,"Specifies safety and interchangeability requirements for tubular and bulb-type self-ballasted LED lamps with integrated driver operating on 240 V AC 50 Hz supplies. सामान्य प्रकाश व्यवस्था के लिए सेल्फ-बैलेस्टेड एलईडी (LED) लैंप की विद्युत और तापीय सुरक्षा आवश्यकताएं।",29.140.99,Electrotechnical & Lighting,current,,2,2023,https://synth.bis.gov.in/standards/SYN-IS-90301-1,SYNTHETIC,FAM_LED
SYN IS 90301,Part 2,2021,Self-Ballasted LED Lamps for General Lighting Services - Part 2 Performance Requirements,"Specifies luminous efficacy, colour rendering index (CRI >= 80), power factor (>= 0.90), lumen maintenance and endurance test criteria for LED lamps and street light luminaires. एलईडी लैंप और स्ट्रीट लाइट के लिए ल्यूमेन दक्षता, पावर फैक्टर और प्रदर्शन परीक्षण।",29.140.99,Electrotechnical & Lighting,current,,1,2024,https://synth.bis.gov.in/standards/SYN-IS-90301-2,SYNTHETIC,FAM_LED
SYN IS 90401,,2019,Concrete Masonry Units - Hollow and Solid Load-Bearing Concrete Blocks,"Covers dimensions, bulk density, minimum block compressive strength (grades C(3.5), C(5.0), C(7.0)) and drying shrinkage for precast solid and hollow concrete blocks used in building construction. भवन निर्माण में प्रयुक्त ठोस और खोखले कंक्रीट ब्लॉक की संपीड़न शक्ति और आयाम।",91.100.30,Civil Engineering & Building Materials,current,,1,2021,https://synth.bis.gov.in/standards/SYN-IS-90401,SYNTHETIC,FAM_MASONRY
SYN IS 90402,,2017,Common Burnt Clay Building Bricks - Specification,"Specifies dimensions (modular 190 x 90 x 90 mm), water absorption (max 20 percent), efflorescence and compressive strength classes 3.5 to 35 MPa for common burnt clay bricks in masonry walls. चिनाई कार्य के लिए पकी हुई मिट्टी की ईंटों के आकार, जल अवशोषण और मजबूती के मानक।",91.100.25,Civil Engineering & Building Materials,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90402,SYNTHETIC,FAM_MASONRY
SYN IS 90501,,2020,Synthetic Enamel Paint for Exterior and Interior Structural Surfaces,"Covers alkyd-based high-gloss synthetic enamel finishing paint for steel structures, bridges, machinery and woodwork with VOC limits, drying time and salt-spray resistance. लोहे और लकड़ी की सतहों पर बाहरी और आंतरिक उपयोग के लिए सिंथेटिक इनेमल पेंट।",87.040,Chemicals & Paints,current,,1,2022,https://synth.bis.gov.in/standards/SYN-IS-90501,SYNTHETIC,FAM_PAINT
SYN IS 90601,,2021,Pressed Ceramic Tiles for Floor and Wall Finishing - Specification,"Specifies dimensional tolerances, modulus of rupture, abrasion resistance, slip resistance and water absorption groups (BIa vitrified, BIIa, BIII) for glazed and unglazed ceramic and vitrified floor and wall tiles. फर्श और दीवार के लिए सिरेमिक तथा विट्रिफाइड टाइल्स के जल अवशोषण और टूटने की क्षमता के मानक।",91.100.23,Civil Engineering & Building Materials,current,,1,2023,https://synth.bis.gov.in/standards/SYN-IS-90601,SYNTHETIC,FAM_TILES
SYN IS 90701,,2018,Methods of Hydrostatic Pressure and Leak Testing of Metallic and Polymeric Pipes,"Standard test procedure for internal hydrostatic proof pressure, burst pressure and longitudinal reversion tests on steel, GI, uPVC, HDPE and ductile iron pipes. धातु और प्लास्टिक पाइपों के हाइड्रोस्टेटिक दबाव और रिसाव परीक्षण की मानक विधि।",23.040.01,Testing & Metrology,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90701,SYNTHETIC,FAM_PIPE_TESTS
SYN IS 90702,,2019,Method for Determination of Mass and Uniformity of Zinc Coating on Galvanized Steel Articles,"Specifies gravimetric stripping test and Preece copper sulphate dip test for determining zinc coating weight (g/m2) on galvanized iron tubes, sheets and fasteners. गैल्वनाइज्ड स्टील पाइप और शीट पर जिंक कोटिंग के वजन और समानता की जांच विधि।",25.220.40,Metallurgy & Surface Coating,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90702,SYNTHETIC,FAM_PIPE_TESTS
SYN IS 90703,,2017,Glossary of Terms Relating to Water Supply Plumbing Pipes and Valves,"Defines standard engineering terminology and symbols for nominal bore (NB), nominal diameter (DN), pressure rating (PN), socket joints, fittings and pipeline appurtenances. जल आपूर्ति पाइपलाइन, वाल्व और फिटिंग से संबंधित मानक तकनीकी शब्दावली।",01.040.23,Terminology & General Standards,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90703,SYNTHETIC,FAM_PIPE_TERMS
SYN IS 90704,,2020,Code of Practice for Laying Jointing and Field Testing of Water Supply Pipelines,"Provides engineering guidelines for trench excavation, bedding, jointing, anchorage thrust blocks, disinfection and field hydrostatic testing of GI, uPVC, HDPE and DI water mains. जल आपूर्ति पाइपलाइन बिछाने, जोड़ने और फील्ड टेस्टिंग की संहिता।",93.025,Civil Engineering & Water Supply,current,,1,2022,https://synth.bis.gov.in/standards/SYN-IS-90704,SYNTHETIC,FAM_PIPE_INSTALL
SYN IS 90705,,2021,Code of Practice for Electrical Wiring Installations and Overcurrent Protection in Buildings,"Covers selection, coordination, earthing and installation of miniature circuit breakers (MCBs), distribution boards and wiring cables in residential and public buildings. भवनों में विद्युत वायरिंग, अर्थिंग और एमसीबी (MCB) लगाने की मानक संहिता।",91.140.50,Electrotechnical,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90705,SYNTHETIC,FAM_ELEC_INSTALL
SYN IS 90706,,2020,Methods of Photometric and Electrical Measurement for LED Light Sources and Luminaires,"Specifies integrating sphere and goniophotometer test methods for measuring luminous flux, luminous efficacy (lm/W), CCT, CRI and harmonic current emissions of LED lamps. एलईडी लैंप के फोटोमेट्रिक ल्यूमेन, सीआरआई और विद्युत मापन की परीक्षण विधि।",29.140.99,Electrotechnical & Lighting,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90706,SYNTHETIC,FAM_LED_TESTS
SYN IS 90707,,2018,Methods of Test for Precast Concrete Blocks and Burnt Clay Masonry Units,"Covers test procedures for determination of compressive strength, block density, water absorption and efflorescence of concrete blocks and clay building bricks. कंक्रीट ब्लॉक और मिट्टी की ईंटों की संपीड़न शक्ति एवं जल अवशोषण परीक्षण विधि।",91.100.30,Civil Engineering & Building Materials,current,,0,,https://synth.bis.gov.in/standards/SYN-IS-90707,SYNTHETIC,FAM_MASONRY_TESTS
SYN IS 90801,,2022,Ordinary Portland Cement (OPC) 43 Grade and 53 Grade - Specification,"Specifies chemical and physical requirements including setting time, soundness, fineness and 28-day compressive strength for Ordinary Portland Cement (OPC 43 and OPC 53) used in RCC and civil works. आरसीसी और सिविल निर्माण कार्यों के लिए ओपीसी 43 और 53 ग्रेड सीमेंट के मानक।",91.100.10,Civil Engineering & Building Materials,current,,1,2024,https://synth.bis.gov.in/standards/SYN-IS-90801,SYNTHETIC,FAM_CEMENT
SYN IS 90991,,2001,Legacy Bitumen Felt for Waterproofing and Damp-Proofing (Type A),"Legacy waterproofing felt specification containing a planted circular supersession reference for cycle-detection testing. वॉटरप्रूफिंग फेल्ट का पुराना मानक (साइकिल टेस्ट केस)।",91.100.50,Civil Engineering & Building Materials,superseded,SYN IS 90992,0,,https://synth.bis.gov.in/standards/SYN-IS-90991,SYNTHETIC,FAM_CYCLE_TEST
SYN IS 90992,,2005,Modified Bituminous Membrane for Damp-Proofing (Type B),"Counterpart specification in planted supersession cycle (90991 <-> 90992) to verify cycle detection and hop-limit safety. साइकिल डिटेक्शन परीक्षण मानक।",91.100.50,Civil Engineering & Building Materials,superseded,SYN IS 90991,0,,https://synth.bis.gov.in/standards/SYN-IS-90992,SYNTHETIC,FAM_CYCLE_TEST
SYN IS 90998,,1985,Asbestos Cement Pressure Pipes for Water and Sewerage (Withdrawn),"Historical specification for asbestos cement pressure pipes withdrawn due to occupational health and chrysotile safety regulations without a direct asbestos successor. स्वास्थ्य और सुरक्षा कारणों से बिना किसी उत्तराधिकारी के वापस लिया गया एस्बेस्टस सीमेंट पाइप मानक।",23.040.50,Civil Engineering & Building Materials,withdrawn,,0,,https://synth.bis.gov.in/standards/SYN-IS-90998,SYNTHETIC,FAM_WITHDRAWN_TEST`;

export const RAW_REFERENCES_CSV = `from_is,to_is,role,role_source,context_text,data_provenance
SYN IS 90101,SYN IS 90701,test_method,curated,"Clause 8.2: Each tube shall be hydrostatically tested at the manufacturer's works in accordance with SYN IS 90701 without showing any sign of leakage or weeping.",SYNTHETIC
SYN IS 90101,SYN IS 90702,test_method,curated,"Clause 6.4: For galvanized tubes, the zinc coating mass shall be determined in accordance with SYN IS 90702 and shall not be less than 400 g/m2.",SYNTHETIC
SYN IS 90101,SYN IS 90703,terminology,curated,"Clause 3.1: For the purpose of this standard, the definitions of nominal bore, medium grade and heavy grade given in SYN IS 90703 shall apply.",SYNTHETIC
SYN IS 90101,SYN IS 90704,installation,rule,"Clause 11.1: Field trenching, laying, jointing and site pressure testing of mild steel and GI tubes shall conform to the code of practice in SYN IS 90704.",SYNTHETIC
SYN IS 90102,SYN IS 90701,test_method,curated,"Clause 7.3: uPVC pipes shall withstand the internal hydrostatic pressure test for 1 hour at 27 C when tested according to SYN IS 90701.",SYNTHETIC
SYN IS 90102,SYN IS 90703,terminology,curated,"Clause 2.2: Terminology for nominal outside diameter and pressure rating PN shall follow SYN IS 90703.",SYNTHETIC
SYN IS 90102,SYN IS 90704,installation,rule,"Clause 10.1: Underground laying, solvent cement jointing and backfilling of uPVC potable water pipes shall be carried out as per SYN IS 90704.",SYNTHETIC
SYN IS 90103,SYN IS 90701,test_method,curated,"Clause 7.1: HDPE PE 80 and PE 100 pipes shall pass the hydrostatic strength test at 80 C for 165 hours as prescribed in SYN IS 90701.",SYNTHETIC
SYN IS 90103,SYN IS 90703,terminology,curated,"Clause 3.1: Definitions of standard dimension ratio (SDR) and minimum required strength (MRS) are as defined in SYN IS 90703.",SYNTHETIC
SYN IS 90103,SYN IS 90704,installation,rule,"Clause 9.4: Butt fusion welding and trench installation of HDPE mains shall comply with SYN IS 90704.",SYNTHETIC
SYN IS 90104,SYN IS 90701,test_method,curated,"Clause 9.1: Spun ductile iron pipes K7 and K9 shall be subjected to works hydrostatic test at 4.0 MPa to 5.0 MPa per SYN IS 90701.",SYNTHETIC
SYN IS 90104,SYN IS 90703,terminology,curated,"Clause 3.2: Terms relating to push-on flexible joints and nominal diameter DN conform to SYN IS 90703.",SYNTHETIC
SYN IS 90104,SYN IS 90704,installation,curated,"Clause 12.1: Laying, elastomeric gasket jointing and thrust block design for DI pipes shall follow SYN IS 90704.",SYNTHETIC
SYN IS 90201,SYN IS 90705,installation,curated,"Clause 9.1: Selection, mounting in distribution boards, and earthing coordination of AC and DC MCBs shall conform to the safety rules in SYN IS 90705.",SYNTHETIC
SYN IS 90201,SYN IS 90301,related_product,model,"Annex B: Lighting branch circuits protected by Type B or Type C MCBs supplying LED lamp banks under SYN IS 90301 shall account for driver inrush current.",SYNTHETIC
SYN IS 90301,SYN IS 90706,test_method,curated,"Clause 8.1: Luminous flux, efficacy (lm/W), CRI and harmonic distortion of self-ballasted LED lamps shall be measured in accordance with SYN IS 90706.",SYNTHETIC
SYN IS 90301,SYN IS 90705,safety,curated,"Clause 5.3: Electrical insulation, creepage distance and protective earthing of luminaire circuits shall comply with SYN IS 90705.",SYNTHETIC
SYN IS 90401,SYN IS 90707,test_method,curated,"Clause 7.2: Compressive strength, block density and water absorption of hollow and solid concrete blocks shall be tested according to SYN IS 90707.",SYNTHETIC
SYN IS 90401,SYN IS 90801,related_product,rule,"Clause 4.1: Ordinary Portland Cement conforming to SYN IS 90801 shall be used as the binder in the manufacture of load-bearing concrete masonry blocks.",SYNTHETIC
SYN IS 90402,SYN IS 90707,test_method,curated,"Clause 6.1: Compressive strength, efflorescence and 24-hour cold water absorption of burnt clay bricks shall be determined as per SYN IS 90707.",SYNTHETIC
SYN IS 90501,SYN IS 99001,test_method,rule,"Clause 7.4: Planted orphan reference — volatile organic compound (VOC) chromatography test shall follow unregistered draft standard SYN IS 99001.",SYNTHETIC
SYN IS 90601,SYN IS 99002,terminology,model,"Clause 2.5: Planted orphan reference — surface glaze micro-texture glossary terms refer to non-existent standard SYN IS 99002.",SYNTHETIC`;

export const RAW_CERTIFICATION_CSV = `rule_id,applies_to,scheme,legal_basis,effective_from,source_url,verified_on,notes,data_provenance
CERT-001,IS:SYN IS 90101,BIS_Product_Certification,Steel Tubes Tubulars and Other Wrought Steel Fittings (Quality Control) Order 2020,2021-03-01,https://synth.bis.gov.in/qco/steel-tubes-2020,2023-01-10,Planted STALE verification date (>180 days old) for GI/MS steel tubes; ISI Mark mandatory.,SYNTHETIC
CERT-002,IS:SYN IS 90102,BIS_Product_Certification,Drinking Water Supply uPVC Pipes (Quality Control) Order 2022,2022-09-15,https://synth.bis.gov.in/qco/upvc-pipes-2022,2026-08-15,Mandatory ISI Mark under BIS Scheme-I for potable water uPVC pipes.,SYNTHETIC
CERT-003,IS:SYN IS 90103,BIS_Product_Certification,Polyethylene Pipes for Water Supply (Quality Control) Order 2023,2023-04-01,https://synth.bis.gov.in/qco/hdpe-pipes-2023,2026-08-20,Mandatory ISI Mark for PE 80 and PE 100 water supply HDPE pipes.,SYNTHETIC
CERT-004,IS:SYN IS 90104,BIS_Product_Certification,Ductile Iron Pressure Pipes (Quality Control) Order 2021,2021-11-01,https://synth.bis.gov.in/qco/di-pipes-2021,2026-07-30,Mandatory BIS license required for K7 and K9 centrifugally cast DI pipes.,SYNTHETIC
CERT-005,IS:SYN IS 90201,BIS_Product_Certification,Electrical Accessories (Quality Control) Order 2023,2023-06-01,https://synth.bis.gov.in/qco/electrical-mcb-2023,2026-09-01,Covers both Part 1 (AC) and Part 2 (AC/DC) miniature circuit breakers under mandatory ISI Mark.,SYNTHETIC
CERT-006,IS:SYN IS 90301,CRS,Electronics and IT Goods (Requirement for Compulsory Registration) Order 2021,2021-07-01,https://synth.bis.gov.in/crs/led-lamps-2021,2026-09-10,Mandatory BIS Compulsory Registration Scheme (CRS) self-declaration mark for self-ballasted LED lamps.,SYNTHETIC
CERT-007,IS:SYN IS 90402,None,Voluntary BIS Standard Listing — Common Burnt Clay Bricks Advisory 2019,2019-01-01,https://synth.bis.gov.in/voluntary/clay-bricks-2019,2026-08-05,Planted EXPLICIT None scheme for common burnt clay building bricks (voluntary conformity; not under mandatory QCO).,SYNTHETIC
CERT-008,IS:SYN IS 90501,BIS_Product_Certification,Synthetic Enamel Paints (Quality Control) Draft Order 2027,2027-06-01,https://synth.bis.gov.in/qco/enamel-paints-2027,2026-09-15,Planted FUTURE-DATED rule (effective_from 2027-06-01 > today); must be ignored by engine with visible notice.,SYNTHETIC
CERT-009,ICS:91.100.23,BIS_Product_Certification,Ceramic and Vitrified Tiles (Quality Control) Order 2023 (Sectoral ICS Rule),2023-08-01,https://synth.bis.gov.in/qco/ceramic-tiles-ics-2023,2026-09-05,Planted ICS-LEVEL match (ICS:91.100.23) applying to pressed ceramic and vitrified tiles SYN IS 90601.,SYNTHETIC
CERT-010,IS:SYN IS 90801,BIS_Product_Certification,Cement (Quality Control) Order 2020,2020-05-01,https://synth.bis.gov.in/qco/cement-opc-2020,2026-09-12,Mandatory ISI certification for all grades of Ordinary Portland Cement (OPC 43 & 53).,SYNTHETIC`;

export const RAW_GOLD_CSV = `qid,query_text,language,query_type,gold_primary_is,gold_allied_is,expect_abstain,annotator_a,annotator_b,split,data_provenance,family,notes
Q001,"Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply",en,clean,SYN IS 90101,SYN IS 90701;SYN IS 90702;SYN IS 90703;SYN IS 90704,false,SYN IS 90101,SYN IS 90101,test,SYNTHETIC,FAM_STEEL_PIPE,Clean English query for GI mild steel water tubes
Q002,"Jal aapurti ke liye 100 mm medium grade GI lohe ka pipe aur fitting chahiye",hinglish,clean,SYN IS 90101,SYN IS 90701;SYN IS 90702;SYN IS 90703;SYN IS 90704,false,SYN IS 90101,SYN IS 90101,test,SYNTHETIC,FAM_STEEL_PIPE,Hinglish query with glossary terms lohe ka pipe and jal aapurti
Q003,"पेयजल आपूर्ति के लिए 80 मिमी मध्यम ग्रेड गैल्वनाइज्ड आयरन (GI) माइल्ड स्टील पाइप",hi,clean,SYN IS 90101,SYN IS 90701;SYN IS 90702;SYN IS 90703;SYN IS 90704,false,SYN IS 90101,SYN IS 90101,val,SYNTHETIC,FAM_STEEL_PIPE,Devanagari Hindi query for GI mild steel pipe
Q004,"Providing and laying 110 mm outer diameter PN 10 uPVC pipes for cold potable water distribution",en,tender_line,SYN IS 90102,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90102,SYN IS 90102,test,SYNTHETIC,FAM_UPVC_PIPE,Clean tender line for uPVC water pipes
Q005,"Kheti sinchai aur peene ke paani ke liye 90mm PN6 uPVC plastic pipe",hinglish,messy,SYN IS 90102,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90102,SYN IS 90102,train,SYNTHETIC,FAM_UPVC_PIPE,Messy Hinglish query for uPVC pipe
Q006,"Supply of 200 mm PE 100 HDPE black pipes for underground municipal water mains and pressure sewerage",en,clean,SYN IS 90103,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90103,SYN IS 90103,test,SYNTHETIC,FAM_HDPE_PIPE,HDPE PE 100 water supply query
Q007,"भूमिगत जल आपूर्ति और सीवरेज के लिए 160 मिमी PE 80 एचडीपीई (HDPE) पाइप",hi,clean,SYN IS 90103,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90103,SYN IS 90103,train,SYNTHETIC,FAM_HDPE_PIPE,Hindi query for HDPE PE 80 pipe
Q008,"Supply and stacking of DN 300 Class K9 centrifugally cast ductile iron (DI) pressure pipes with socket and spigot joints",en,tender_line,SYN IS 90104,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90104,SYN IS 90104,test,SYNTHETIC,FAM_DI_PIPE,Ductile iron K9 tender line
Q009,"32A C-curve 240V AC miniature circuit breaker (MCB) for household distribution board overcurrent protection",en,clean,SYN IS 90201,SYN IS 90705;SYN IS 90301,false,SYN IS 90201,SYN IS 90201,test,SYNTHETIC,FAM_MCB,Multi-part MCB AC query
Q010,"Solar PV battery bank ke liye 63A DC/AC miniature circuit breaker MCB switch",hinglish,messy,SYN IS 90201,SYN IS 90705,false,SYN IS 90201,SYN IS 90201,val,SYNTHETIC,FAM_MCB,Multi-part MCB DC/AC Hinglish query
Q011,"Supply of 12W self-ballasted LED bulbs 240V 50Hz CRI >= 80 with power factor 0.90 for office lighting",en,clean,SYN IS 90301,SYN IS 90706;SYN IS 90705,false,SYN IS 90301,SYN IS 90301,test,SYNTHETIC,FAM_LED,Multi-part LED safety + performance query
Q012,"सरकारी स्कूल भवन के लिए 15W सेल्फ-बैलेस्टेड एलईडी (LED) बल्ब और लैंप सुरक्षा व प्रदर्शन सहित",hi,clean,SYN IS 90301,SYN IS 90706;SYN IS 90705,false,SYN IS 90301,SYN IS 90301,train,SYNTHETIC,FAM_LED,Hindi LED query
Q013,"Precast load-bearing hollow concrete masonry blocks 400x200x200 mm grade C(5.0) for building walls",en,clean,SYN IS 90401,SYN IS 90707;SYN IS 90801,false,SYN IS 90401,SYN IS 90401,test,SYNTHETIC,FAM_MASONRY,Concrete blocks query (tests missing certification rule edge case)
Q014,"Deewar chinai ke liye class 10 modular pakki mitti ki lal eent (burnt clay building bricks)",hinglish,clean,SYN IS 90402,SYN IS 90707,false,SYN IS 90402,SYN IS 90402,test,SYNTHETIC,FAM_MASONRY,Clay bricks Hinglish query (tests explicit None certification edge case)
Q015,"High-gloss synthetic enamel finishing paint for exterior steel bridge girders and structural steelwork",en,tender_line,SYN IS 90501,,false,SYN IS 90501,SYN IS 90501,test,SYNTHETIC,FAM_PAINT,Enamel paint query (tests future-dated certification rule + orphan ref)
Q016,"Supply of 600x600 mm vitrified Group BIa pressed ceramic floor tiles for hospital corridors",en,clean,SYN IS 90601,,false,SYN IS 90601,SYN IS 90601,test,SYNTHETIC,FAM_TILES,Ceramic tiles query (tests ICS-level certification match + orphan ref)
Q017,"Supply of 500 bags of Ordinary Portland Cement OPC 53 grade for RCC bridge pier construction",en,clean,SYN IS 90801,,false,SYN IS 90801,SYN IS 90801,val,SYNTHETIC,FAM_CEMENT,OPC 53 cement query
Q018,"MS tubes for water line conforming to old standard SYN IS 90151:1990",en,tender_line,SYN IS 90101,SYN IS 90701;SYN IS 90702;SYN IS 90703;SYN IS 90704,false,SYN IS 90101,SYN IS 90101,test,SYNTHETIC,FAM_STEEL_PIPE,Planted two-hop supersession query (90151 -> 90152 -> 90101)
Q019,"Asbestos cement pressure pipes as per SYN IS 90998 for rural water supply",en,tender_line,SYN IS 90998,,false,SYN IS 90998,SYN IS 90998,test,SYNTHETIC,FAM_WITHDRAWN_TEST,Planted withdrawn-without-successor query
Q020,"Quantum photonic teleportation hyperdrive flux capacitor module for interstellar spacecraft",en,adversarial,,,true,ABSTAIN,ABSTAIN,test,SYNTHETIC,FAM_ADVERSARIAL,Adversarial out-of-domain query that must trigger LOW confidence abstention
Q021,"5G satellite crypto blockchain neural implant catheter with SYN IS 99999 certification",en,adversarial,,,true,ABSTAIN,ABSTAIN,test,SYNTHETIC,FAM_ADVERSARIAL,Adversarial query citing fake ID SYN IS 99999 that must be blocked and abstained
Q022,"Pipes for water",en,messy,SYN IS 90101;SYN IS 90102;SYN IS 90103;SYN IS 90104,SYN IS 90701;SYN IS 90703;SYN IS 90704,false,SYN IS 90101,SYN IS 90102,val,SYNTHETIC,FAM_AMBIGUOUS_PIPE,Planted ambiguous query that must trigger M4 Ask-Before-Guess clarifying question`;

export const RAW_GLOSSARY_CSV = `term,language,standard_term
lohe ka pipe,hinglish,mild steel galvanized iron tube
gi pipe,hinglish,galvanized iron mild steel tube
jal aapurti,hinglish,potable water supply
peene ka paani,hinglish,potable water supply
kheti sinchai,hinglish,agriculture irrigation water supply
plastic pipe,hinglish,unplasticized polyvinyl chloride uPVC pipe
kaala pipe,hinglish,high density polyethylene HDPE pipe
dhala loha pipe,hinglish,centrifugally cast ductile iron pressure pipe
bijli switch mcb,hinglish,miniature circuit breaker overcurrent protection
led lattu,hinglish,self-ballasted LED lamp general lighting
cement ka block,hinglish,hollow and solid precast concrete masonry block
pakki mitti ki lal eent,hinglish,common burnt clay building brick
eent,hinglish,common burnt clay building brick
deewar chinai,hinglish,building wall masonry construction
lohe ka rang,hinglish,synthetic enamel finishing paint
farsh ki tile,hinglish,pressed ceramic vitrified floor tile
पेयजल,hi,potable water supply
लोहे का पाइप,hi,mild steel galvanized iron tube
सिंचाई,hi,agriculture irrigation
ईंट,hi,common burnt clay building brick
बिजली ब्रेकर,hi,miniature circuit breaker MCB
एलईडी बल्ब,hi,self-ballasted LED lamp
सीमेंट,hi,ordinary portland cement OPC
टाइल्स,hi,pressed ceramic floor and wall tiles`;

export const RAW_PLANTED_DEFECTS_CSV = `tender_file,line_no,item_text_prefix,cited_is,expected_status,expected_primary_is,defect_detail
sample_tender_01.txt,1,"Supply and delivery of 50 mm NB Medium grade GI mild steel tubes",SYN IS 90151,OUTDATED,SYN IS 90101,"Two-hop supersession: cited SYN IS 90151 (1990) -> SYN IS 90152 (2004) -> current SYN IS 90101 (2018, Amnd 2: 2022)"
sample_tender_01.txt,2,"Providing and laying 110 mm OD PN 10 uPVC potable water pipes",SYN IS 90102,OK,SYN IS 90102,"Cited standard SYN IS 90102 (2020) is current and matches uPVC potable water pipes"
sample_tender_01.txt,3,"Supply of 200 mm PE 100 HDPE pipes for underground water main",,MISSING,SYN IS 90103,"No IS standard cited in tender line; recommended SYN IS 90103 (2021) with mandatory BIS certification"
sample_tender_01.txt,4,"Supply of 32A C-curve 240V AC miniature circuit breakers (MCB)",SYN IS 90402,MISMATCH,SYN IS 90201,"Cited SYN IS 90402 is for Burnt Clay Bricks, which mismatches electrical MCB item (should be SYN IS 90201)"
sample_tender_01.txt,5,"Supply of 12W self-ballasted LED lamps 240V AC CRI >= 80",SYN IS 99999,UNKNOWN_ID,SYN IS 90301,"Cited SYN IS 99999 does not exist in closed-world BIS registry (hallucinated/invalid ID blocked); recommended SYN IS 90301"
sample_tender_02.txt,1,"Supply of 150 mm asbestos cement pressure pipes for rural water main",SYN IS 90998,OUTDATED,SYN IS 90998,"Cited SYN IS 90998 (1985) is WITHDRAWN without direct asbestos successor due to safety regulations"
sample_tender_02.txt,2,"Bituminous waterproofing membrane for roof damp-proofing",SYN IS 90991,OUTDATED,SYN IS 90991,"Cited SYN IS 90991 is in a planted supersession CYCLE (SYN IS 90991 <-> SYN IS 90992); cycle detected safely"
sample_tender_02.txt,3,"Precast hollow concrete masonry blocks 400x200x200 mm grade C(5.0)",,MISSING,SYN IS 90401,"No IS standard cited; recommended SYN IS 90401 (2019) (Note: no certification rule found in table)"
sample_tender_02.txt,4,"Supply of 600x600 mm vitrified pressed ceramic floor tiles Group BIa",SYN IS 90601,OK,SYN IS 90601,"Cited SYN IS 90601 (2021) is current and covered by ICS:91.100.23 mandatory BIS QCO"`;

export const RAW_TENDERS: Record<string, string> = {
  'sample_tender_01.txt': `1. Supply and delivery of 50 mm NB Medium grade GI mild steel tubes for municipal potable water supply conforming to SYN IS 90151:1990 with ISI mark.
2. Providing and laying 110 mm OD PN 10 uPVC potable water pipes for distribution network conforming to SYN IS 90102:2020.
3. Supply of 200 mm PE 100 HDPE pipes for underground water main and pressure sewerage system as per standard specifications.
4. Supply of 32A C-curve 240V AC miniature circuit breakers (MCB) for building distribution boards conforming to SYN IS 90402.
5. Supply of 12W self-ballasted LED lamps 240V AC CRI >= 80 with power factor 0.90 conforming to SYN IS 99999.`,
  'sample_tender_02.txt': `1. Supply of 150 mm asbestos cement pressure pipes for rural water main conforming to SYN IS 90998:1985.
2. Bituminous waterproofing membrane for roof damp-proofing conforming to SYN IS 90991:2001.
3. Precast hollow concrete masonry blocks 400x200x200 mm grade C(5.0) for load-bearing building walls.
4. Supply of 600x600 mm vitrified pressed ceramic floor tiles Group BIa for hospital corridors as per SYN IS 90601:2021.`,
};

/**
 * RFC-4180 compliant CSV parser that tolerates extra columns and quoted strings.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = (vals[idx] ?? '').trim();
    });
    rows.push(rec);
  }
  return rows;
}

/**
 * Deterministic FNV-1a / DJB2 hex hash to compute registry_version from active data.
 */
export function computeDeterministicHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch: number; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `reg-v1-${hex1}${hex2}`;
}

export class RegistryStore {
  public standards: StandardRecord[] = [];
  public references: ReferenceRecord[] = [];
  public certificationRules: CertificationRuleRecord[] = [];
  public goldQueries: GoldQueryRecord[] = [];
  public glossary: GlossaryRecord[] = [];
  public plantedDefects: PlantedDefectRecord[] = [];
  public tenders: Record<string, string> = { ...RAW_TENDERS };

  public registryVersion: string = '';
  public loadTimeMs: number = 0;
  public modelBTrained: boolean = false;
  public modelCTrained: boolean = false;
  public staleDaysThreshold: number = 180;
  public referenceToday: string = '2026-10-04';

  public blockedCitationsLog: BlockedCitationEntry[] = [];
  public auditLog: AuditLogRow[] = [];
  public watchList: SavedWatchSpec[] = [];
  public changelog: RegistryChangelogEntry[] = [];

  constructor() {
    this.reloadFromRaw();
    this.seedInitialState();
  }

  public reloadFromRaw(): void {
    const t0 = performance.now();

    const stdRows = parseCsv(RAW_STANDARDS_CSV);
    this.standards = stdRows.map((r) => ({
      is_id: r.is_id,
      part: r.part || '',
      year: parseInt(r.year, 10) || 2000,
      title: r.title,
      scope_text: r.scope_text,
      ics_code: r.ics_code,
      sector: r.sector,
      status: (r.status as StandardStatus) || 'current',
      superseded_by: r.superseded_by || '',
      latest_amendment_no: parseInt(r.latest_amendment_no || '0', 10) || 0,
      amendment_year: r.amendment_year ? parseInt(r.amendment_year, 10) : null,
      source_url: r.source_url,
      data_provenance: (r.data_provenance as DataProvenance) || 'SYNTHETIC',
      family: r.family,
    }));

    const refRows = parseCsv(RAW_REFERENCES_CSV);
    this.references = refRows.map((r) => ({
      from_is: r.from_is,
      to_is: r.to_is,
      role: (r.role as ReferenceRole) || 'other',
      role_source: (r.role_source as RoleSource) || 'curated',
      context_text: r.context_text,
      data_provenance: (r.data_provenance as DataProvenance) || 'SYNTHETIC',
    }));

    const certRows = parseCsv(RAW_CERTIFICATION_CSV);
    this.certificationRules = certRows.map((r) => ({
      rule_id: r.rule_id,
      applies_to: r.applies_to,
      scheme: (r.scheme as CertScheme) || 'None',
      legal_basis: r.legal_basis,
      effective_from: r.effective_from,
      source_url: r.source_url,
      verified_on: r.verified_on,
      notes: r.notes,
      data_provenance: (r.data_provenance as DataProvenance) || 'SYNTHETIC',
    }));

    const goldRows = parseCsv(RAW_GOLD_CSV);
    this.goldQueries = goldRows.map((r) => ({
      qid: r.qid,
      query_text: r.query_text,
      language: (r.language as LanguageCode) || 'en',
      query_type: (r.query_type as QueryType) || 'clean',
      gold_primary_is: r.gold_primary_is
        ? r.gold_primary_is.split(';').map((s) => s.trim()).filter(Boolean)
        : [],
      gold_allied_is: r.gold_allied_is
        ? r.gold_allied_is.split(';').map((s) => s.trim()).filter(Boolean)
        : [],
      expect_abstain: r.expect_abstain === 'true',
      annotator_a: r.annotator_a,
      annotator_b: r.annotator_b,
      split: (r.split as 'train' | 'val' | 'test') || 'test',
      data_provenance: (r.data_provenance as DataProvenance) || 'SYNTHETIC',
      family: r.family,
      notes: r.notes,
    }));

    const glossRows = parseCsv(RAW_GLOSSARY_CSV);
    this.glossary = glossRows.map((r) => ({
      term: r.term,
      language: (r.language as LanguageCode) || 'hinglish',
      standard_term: r.standard_term,
    }));

    const defectRows = parseCsv(RAW_PLANTED_DEFECTS_CSV);
    this.plantedDefects = defectRows.map((r) => ({
      tender_file: r.tender_file,
      line_no: parseInt(r.line_no, 10) || 1,
      item_text_prefix: r.item_text_prefix,
      cited_is: r.cited_is,
      expected_status: r.expected_status as PlantedDefectRecord['expected_status'],
      expected_primary_is: r.expected_primary_is,
      defect_detail: r.defect_detail,
    }));

    this.recomputeRegistryVersion();
    const t1 = performance.now();
    this.loadTimeMs = Math.max(1, Math.round((t1 - t0) * 100) / 100);
  }

  public recomputeRegistryVersion(): void {
    const payload = JSON.stringify({
      s: this.standards.map((x) => [x.is_id, x.part, x.year, x.status, x.superseded_by, x.latest_amendment_no]),
      r: this.references.length,
      c: this.certificationRules.length,
    });
    this.registryVersion = computeDeterministicHash(payload);
  }

  private seedInitialState(): void {
    this.watchList = [
      {
        spec_id: 'SPEC-101',
        title: 'Municipal Jal Jeevan Potable GI Feeder Line Specification',
        owner_role: 'officer',
        query_text: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes for municipal potable water supply',
        primary_is_ids: ['SYN IS 90101'],
        allied_is_ids: ['SYN IS 90701', 'SYN IS 90702', 'SYN IS 90703', 'SYN IS 90704'],
        saved_registry_version: this.registryVersion,
        created_at: '2026-10-01T09:30:00Z',
        affected_by_changelog_ids: [],
      },
      {
        spec_id: 'SPEC-102',
        title: 'Government School Building LED & MCB Electrical Package',
        owner_role: 'officer',
        query_text: 'Supply of 12W self-ballasted LED bulbs 240V 50Hz CRI >= 80 with 32A C-curve MCB',
        primary_is_ids: ['SYN IS 90301', 'SYN IS 90201'],
        allied_is_ids: ['SYN IS 90706', 'SYN IS 90705'],
        saved_registry_version: this.registryVersion,
        created_at: '2026-10-02T14:15:00Z',
        affected_by_changelog_ids: [],
      },
    ];

    this.auditLog = [
      {
        id: 1,
        timestamp: '2026-10-03T11:20:00Z',
        actor_role: 'reviewer',
        action_type: 'ACCEPT',
        query_or_context: 'Supply of 50 mm nominal bore Medium grade galvanized iron (GI) mild steel tubes',
        recommended_is: 'SYN IS 90101',
        override_is: null,
        mandatory_reason: 'Verified against BIS Steel Tubes QCO 2020; two-hop supersession from 90151 -> 90152 -> 90101 confirmed.',
        registry_version: this.registryVersion,
        flagged_hard_negative: false,
        flagged_gold_candidate: true,
      },
      {
        id: 2,
        timestamp: '2026-10-03T15:45:00Z',
        actor_role: 'reviewer',
        action_type: 'OVERRIDE',
        query_or_context: 'Pipes for high-pressure municipal water transmission mains DN 300',
        recommended_is: 'SYN IS 90103',
        override_is: 'SYN IS 90104',
        mandatory_reason: 'Tender specifies DN 300 K9 socket & spigot centrifugally cast pipe; Ductile Iron SYN IS 90104 is required instead of HDPE SYN IS 90103.',
        registry_version: this.registryVersion,
        flagged_hard_negative: true,
        flagged_gold_candidate: true,
      },
    ];
  }

  public getActiveStandards(mode: DataMode): StandardRecord[] {
    if (mode === 'REAL_ONLY') {
      return this.standards.filter((s) => s.data_provenance === 'REAL');
    }
    return this.standards;
  }

  public getBaseIdSet(mode: DataMode = 'COMBINED'): Set<string> {
    return new Set(this.getActiveStandards(mode).map((s) => s.is_id));
  }

  public appendAuditLog(entry: Omit<AuditLogRow, 'id' | 'timestamp' | 'registry_version'>): AuditLogRow {
    if (!entry.mandatory_reason || entry.mandatory_reason.trim().length < 5) {
      throw new Error('Mandatory reason (>= 5 chars) is required for audit_log entries.');
    }
    const row: AuditLogRow = {
      ...entry,
      id: this.auditLog.length + 1,
      timestamp: new Date().toISOString(),
      registry_version: this.registryVersion,
    };
    this.auditLog.push(row);
    return row;
  }

  /**
   * Simulates an SQLite UPDATE/DELETE attempt on audit_log to demonstrate append-only trigger protection.
   */
  public attemptMutateAuditLog(actorRole: UserRole, targetId: number, operation: 'UPDATE' | 'DELETE'): { blocked: true; error: string } {
    const msg = `SQLITE_CONSTRAINT_TRIGGER: ABORT — audit_log is append-only. ${operation} on row id=${targetId} blocked by trigger trg_audit_log_no_${operation.toLowerCase()}.`;
    this.appendAuditLog({
      actor_role: actorRole,
      action_type: 'IMMUTABILITY_TEST_BLOCKED',
      query_or_context: `Attempted ${operation} on audit_log.id=${targetId}`,
      recommended_is: 'N/A',
      override_is: null,
      mandatory_reason: msg,
      flagged_hard_negative: false,
      flagged_gold_candidate: false,
    });
    return { blocked: true, error: msg };
  }

  /**
   * Admin Simulate Revision (M15): edits a standard's status or amendment, bumps registry_version,
   * logs to registry_changelog and audit_log, and flags affected watch-list specs.
   */
  public simulateRevision(params: {
    actorRole: UserRole;
    is_id: string;
    field_changed: 'status' | 'superseded_by' | 'latest_amendment_no';
    new_value: string;
    reason: string;
  }): { changelogEntry: RegistryChangelogEntry; affectedSpecs: SavedWatchSpec[] } {
    if (params.actorRole !== 'admin') {
      throw new Error('Role permissions error: Only admin can simulate a registry revision.');
    }
    const targetRows = this.standards.filter((s) => s.is_id === params.is_id);
    if (targetRows.length === 0) {
      throw new Error(`Standard ${params.is_id} not found in registry.`);
    }

    const oldVersion = this.registryVersion;
    const oldVal = String(targetRows[0][params.field_changed] ?? '');

    for (const row of targetRows) {
      if (params.field_changed === 'status') {
        row.status = params.new_value as StandardStatus;
      } else if (params.field_changed === 'superseded_by') {
        row.superseded_by = params.new_value;
      } else if (params.field_changed === 'latest_amendment_no') {
        row.latest_amendment_no = parseInt(params.new_value, 10) || 0;
        row.amendment_year = 2026;
      }
    }

    this.recomputeRegistryVersion();
    const newVersion = this.registryVersion;

    const changelogEntry: RegistryChangelogEntry = {
      changelog_id: `CHG-${String(this.changelog.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      actor_role: params.actorRole,
      is_id: params.is_id,
      field_changed: params.field_changed,
      old_value: oldVal,
      new_value: params.new_value,
      old_registry_version: oldVersion,
      new_registry_version: newVersion,
      reason: params.reason,
    };
    this.changelog.unshift(changelogEntry);

    const affectedSpecs: SavedWatchSpec[] = [];
    for (const spec of this.watchList) {
      if (spec.primary_is_ids.includes(params.is_id) || spec.allied_is_ids.includes(params.is_id)) {
        if (!spec.affected_by_changelog_ids.includes(changelogEntry.changelog_id)) {
          spec.affected_by_changelog_ids.push(changelogEntry.changelog_id);
        }
        affectedSpecs.push(spec);
      }
    }

    this.appendAuditLog({
      actor_role: params.actorRole,
      action_type: 'SIMULATE_REVISION',
      query_or_context: `${params.is_id} (${params.field_changed}: ${oldVal} -> ${params.new_value})`,
      recommended_is: params.is_id,
      override_is: null,
      mandatory_reason: params.reason,
      flagged_hard_negative: false,
      flagged_gold_candidate: false,
    });

    return { changelogEntry, affectedSpecs };
  }

  /**
   * Runs M1 Ingestion Validation: checks duplicates, orphan references, supersession cycles,
   * withdrawn standards, future-dated certification rules, and stale verification dates.
   */
  public validateDataset(): {
    issues: ValidationIssue[];
    dataQualityScore: number;
    formulaExplanation: string;
    provenanceCounts: Record<DataProvenance, number>;
  } {
    const issues: ValidationIssue[] = [];
    const baseIds = new Set(this.standards.map((s) => s.is_id));
    const seenCanonical = new Set<string>();

    // 1. Check duplicates
    for (const s of this.standards) {
      const key = `${s.is_id}::${s.part}`;
      if (seenCanonical.has(key)) {
        issues.push({
          severity: 'ERROR',
          category: 'DUPLICATE',
          entity_id: key,
          message: `Duplicate standard+part entry detected for ${key}`,
          details: 'Primary key (is_id, part) must be unique in standards.csv.',
        });
      }
      seenCanonical.add(key);

      // 2. Check withdrawn without successor
      if (s.status === 'withdrawn' && !s.superseded_by) {
        issues.push({
          severity: 'WARNING',
          category: 'WITHDRAWN_NO_SUCCESSOR',
          entity_id: s.is_id,
          message: `${s.is_id} (${s.year}) is marked WITHDRAWN with no successor standard`,
          details: `Title: "${s.title}". Version guard must flag this explicitly and never silently drop it.`,
        });
      }
    }

    // 3. Check supersession cycles
    const stdByBase = new Map<string, StandardRecord>();
    for (const s of this.standards) {
      if (!stdByBase.has(s.is_id)) stdByBase.set(s.is_id, s);
    }
    const reportedCycles = new Set<string>();
    for (const s of this.standards) {
      if (s.superseded_by) {
        const visited = new Set<string>([s.is_id]);
        let curr = s.superseded_by;
        const path = [s.is_id];
        let hops = 0;
        while (curr && hops < 15) {
          path.push(curr);
          if (visited.has(curr)) {
            const cycleKey = [...visited].sort().join('<->');
            if (!reportedCycles.has(cycleKey)) {
              reportedCycles.add(cycleKey);
              issues.push({
                severity: 'ERROR',
                category: 'SUPERSESSION_CYCLE',
                entity_id: s.is_id,
                message: `Supersession cycle detected: ${path.join(' → ')}`,
                details: 'Circular supersession reference in standards.csv. Version Guard halts traversal using visited-set detection.',
              });
            }
            break;
          }
          visited.add(curr);
          const nextStd = stdByBase.get(curr);
          curr = nextStd?.superseded_by || '';
          hops++;
        }
      }
    }

    // 4. Check orphan references in references.csv
    for (const ref of this.references) {
      if (!baseIds.has(ref.from_is) || !baseIds.has(ref.to_is)) {
        const missing = !baseIds.has(ref.to_is) ? ref.to_is : ref.from_is;
        issues.push({
          severity: 'ERROR',
          category: 'ORPHAN_REFERENCE',
          entity_id: `${ref.from_is} -> ${ref.to_is}`,
          message: `Orphan reference to unregistered standard ${missing} (role: ${ref.role})`,
          details: `Context: "${ref.context_text}". Closed-world gate (M6) blocks ${missing} from entering any verified bundle.`,
        });
      }
    }

    // 5. Check certification rules for future effective_from or stale verified_on
    const todayMs = new Date(this.referenceToday).getTime();
    for (const rule of this.certificationRules) {
      const effMs = new Date(rule.effective_from).getTime();
      if (effMs > todayMs) {
        issues.push({
          severity: 'WARNING',
          category: 'CERT_FUTURE_DATE',
          entity_id: `${rule.rule_id} (${rule.applies_to})`,
          message: `Rule ${rule.rule_id} has future effective_from date (${rule.effective_from} > ${this.referenceToday})`,
          details: `Legal basis: "${rule.legal_basis}". M9 Certification Engine ignores rules not yet in force.`,
        });
      }
      const verMs = new Date(rule.verified_on).getTime();
      const ageDays = Math.floor((todayMs - verMs) / (1000 * 60 * 60 * 24));
      if (ageDays > this.staleDaysThreshold) {
        issues.push({
          severity: 'WARNING',
          category: 'CERT_STALE_DATE',
          entity_id: `${rule.rule_id} (${rule.applies_to})`,
          message: `Rule ${rule.rule_id} verification is stale (${ageDays} days old, verified_on=${rule.verified_on})`,
          details: `Exceeds configured staleness threshold of ${this.staleDaysThreshold} days.`,
        });
      }
    }

    // Compute transparent Data Quality Score
    const totalEntities = this.standards.length + this.references.length + this.certificationRules.length;
    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    const warnCount = issues.filter((i) => i.severity === 'WARNING').length;
    const rawScore = Math.max(0, 100 * (1 - (errorCount * 1.5 + warnCount * 0.5) / Math.max(1, totalEntities)));
    const dataQualityScore = Math.round(rawScore * 10) / 10;
    const formulaExplanation = `DQS = 100 × (1 - (1.5 × N_errors[${errorCount}] + 0.5 × N_warnings[${warnCount}]) / N_total_records[${totalEntities}]) = ${dataQualityScore}%`;

    const provenanceCounts: Record<DataProvenance, number> = {
      SYNTHETIC: this.standards.filter((s) => s.data_provenance === 'SYNTHETIC').length,
      CURATED: this.standards.filter((s) => s.data_provenance === 'CURATED').length,
      REAL: this.standards.filter((s) => s.data_provenance === 'REAL').length,
    };

    return {
      issues,
      dataQualityScore,
      formulaExplanation,
      provenanceCounts,
    };
  }
}

export const globalStore = new RegistryStore();
