"use strict";
// Dedicated, bounded native UXP builder. No eval, external scripts, or existing-document edits.
// Template 1.0.0; experimental builder, live panel execution not verified; guide 1.0.0.
const VERSION = "1.0.0";
const GLYPHS = "İstanbul, İzmir, Iğdır, Şişli, çatı, özgün yapı, güçlendirme — ÇĞİÖŞÜ çğıöşü";
const BODY = "ÖRNEK METİN — Bu alan, yapının mevcut durumu ve koruma yaklaşımı için ayrılmıştır. Gerçek yapı bilgileri, tarihler ve kaynaklar editör tarafından doğrulanarak eklenmelidir.\rMalzeme, yapım tekniği ve müdahale kararları belge ve çizimlerle birlikte açıklanır. Bu metin yalnızca dizgi örneğidir; tarihsel bir iddia içermez.";
const PALETTE = [
 ["Kâğıt",0,0,0,0],["Metin Siyahı",0,0,0,100],["İkincil Metin",0,0,0,72],
 ["Kireç Taşı",3,4,9,0],["Taş Grisi",9,4,9,7],["Kiremit",15,80,80,20],
 ["Toprak",15,38,60,8],["Adaçayı",25,10,28,10],["Zeytin",45,25,50,35],
 ["Petrol",75,35,35,30],["Safran",8,25,80,5],["Gece",55,35,40,75]
];
const STYLE_ROWS = [
 ["Temel","Ana Metin","S","Regular",11.5,15], ["Temel","Ana Metin Devam","S","Regular",11.5,15],
 ["Temel","Başlık 1","S","Bold",28,30], ["Temel","Alt Başlık","S","Semibold",14,18],
 ["Temel","Ara Başlık","S","Semibold",14,18], ["Temel","Görsel Açıklaması","S","Regular",8.5,11],
 ["Temel","Görsel Kaynağı","S","Regular",8,10,"İkincil Metin"], ["Temel","Alıntı","R","Italic",15,19,"Kiremit"],
 ["Temel","Alıntı Kaynağı","S","Regular",8.5,11], ["Temel","Yan Not Başlığı","S","Semibold",10,13],
 ["Temel","Yan Not","S","Regular",9.5,13], ["Temel","Sayfa Numarası","S","Medium",9,11],
 ["Temel","Üst Bilgi","S","Regular",8.5,11,"İkincil Metin"], ["Temel","Bölüm Etiketi","S","Semibold",9,11],
 ["Temel","Dipnot","S","Regular",8.5,11], ["Temel","Kaynakça","S","Regular",9,12],
 ["Açıklama","Başlık","S","Semibold",16,20], ["Açıklama","Metin","S","Regular",9.5,13],
 ["Açıklama","Numara","S","Bold",9,11], ["Açıklama","Aşama","S","Semibold",12,15],
 ["Açıklama","Ölçek","S","Regular",8,10], ["Bilgi","Üst Etiket","S","Semibold",9,11,"Kiremit"],
 ["Bilgi","Başlık","R","Semibold",27,30], ["Bilgi","Giriş","R","Regular",13,18],
 ["Bilgi","Ana Metin","R","Regular",11,15], ["Bilgi","Ara Başlık","S","Semibold",12,15],
 ["Bilgi","Görsel Açıklaması","S","Regular",8.5,11], ["Bilgi","Kaynak","S","Regular",8,10,"İkincil Metin"],
 ["Bölüm","Numara","S","Medium",16,20], ["Bölüm","Başlık","S","Bold",48,50],
 ["Bölüm","Kısa Açıklama","S","Regular",13,18], ["Harita","Başlık","S","Semibold",16,20],
 ["Harita","Yer Adı","S","Medium",8.5,11], ["Harita","Lejant","S","Regular",9,12],
 ["Harita","Kaynak","S","Regular",8,10]
];
const LAYOUTS = ["A — Temel Sayfa","B1 — Görsel / Yatay","B2 — Görsel / Dikey","B3 — Görsel / Dizi","B4 — Görsel / Öncesi–Sonrası","B5 — Görsel / Çizim ve Detay","B6 — Görsel / Arşiv Dizisi","C1 — Açıklama / Detay","C2 — Açıklama / Süreç","C3 — Açıklama / Karşılaştırma","D — Bilgi Sayfası","E — Bölüm Açılışı","F1 — Harita / Açık","F2 — Harita / Koyu"];
function assert(x,m) { if(!x) throw new Error(m); }
function installed(id, family, style) {
 const f=id.app.fonts.itemByName(family+"\t"+style);
 return f.isValid && String(f.status)===String(id.FontStatus.INSTALLED) ? f : null;
}
function fonts(id) {
 const requiredS=["Regular","Semibold","Bold","Medium","Italic"], requiredR=["Regular","Semibold","Italic"];
 const serif=["Source Serif Pro","Source Serif"].find(f=>requiredR.every(s=>installed(id,f,s)));
 const missing=requiredS.filter(s=>!installed(id,"Source Sans 3",s)).map(s=>"Source Sans 3 "+s);
 if(!serif) missing.push("Source Serif Pro / Source Serif: Regular, Semibold, Italic");
 const language=id.app.languagesWithVendors.itemByName("Turkish");
 return {sans:"Source Sans 3",serif:serif||null,missing,turkish:language.isValid,language:language.isValid?language:null};
}
function builder(id, folders) {
 const app=id.app, fontInfo=fonts(id);
 assert(fontInfo.missing.length===0,"Önce gerekli fontları etkinleştirin: "+fontInfo.missing.join(", "));
 assert(fontInfo.turkish,"Turkish dil sözlüğü bulunamadı.");
 const d=app.documents.add();
 d.insertLabel("restorationBookVersion",VERSION); d.insertLabel("codexBridgeOwner",folders.root.nativePath);
 d.insertLabel("designGuideVersion","1.0.0");
 const S={},O={},L={},C={},M={};
 let phase="document";
 function stage(x){phase=x;d.insertLabel("restorationBuildPhase",x);}
 const mm=x=>x+" mm", pt=x=>x+" pt";
 d.documentPreferences.properties={pageWidth:"237 mm",pageHeight:"310 mm",facingPages:true,pagesPerDocument:18,
  documentBleedTopOffset:"3 mm",documentBleedBottomOffset:"3 mm",documentBleedInsideOrLeftOffset:"3 mm",documentBleedOutsideOrRightOffset:"3 mm"};
 d.viewPreferences.properties={horizontalMeasurementUnits:id.MeasurementUnits.MILLIMETERS,verticalMeasurementUnits:id.MeasurementUnits.MILLIMETERS,rulerOrigin:id.RulerOrigin.PAGE_ORIGIN};
 d.gridPreferences.properties={baselineDivision:"15 pt",baselineStart:"15 pt",baselineGridRelativeOption:id.BaselineGridRelativeOption.TOP_OF_MARGIN_OF_BASELINE_GRID_RELATIVE_OPTION,baselineGridShown:false};
 const layerNames=["01 — Zemin","02 — Görseller","03 — Harita ve Çizimler","04 — Açıklama İşaretleri","05 — Metinler","06 — Üst Bilgi ve Sayfa Numarası","07 — Kılavuzlar / Baskı Dışı"];
 d.layers.item(0).name=layerNames[0]; L[0]=d.layers.itemByID(d.layers.item(0).id);
 for(let i=1;i<layerNames.length;i++)L[i]=d.layers.add({name:layerNames[i]});
 L[6].printable=false;
 function color(n){return C[n]||d.swatches.itemByName(n);}
 const none=d.swatches.itemByName("None");
 function bounds(p,y,x,h,w){return [mm(y),mm(x),mm(y+h),mm(x+w)];}
 function xleft(p){return String(p.side)===String(id.PageSideOptions.LEFT_HAND)?18:23;}
 function rect(p,y,x,h,w,fill,style,layer=1){
  const r=p.rectangles.add(); if(style)r.applyObjectStyle(O[style],true);
  r.geometricBounds=bounds(p,y,x,h,w);r.itemLayer=L[layer];r.strokeColor=none;
  r.fillColor=fill?color(fill):none; return r;
 }
 function text(p,y,x,h,w,content,style,layer=4){
  const t=p.textFrames.add();t.applyObjectStyle(O["Temel — Metin Çerçevesi"],true);
  t.geometricBounds=bounds(p,y,x,h,w);t.itemLayer=L[layer];t.contents=content;
  t.parentStory.texts.item(0).appliedParagraphStyle=S[style];t.label=style;
  return t;
 }
 function customGrid(t,offset=0){t.baselineFrameGridOptions.properties={useCustomBaselineFrameGrid:true,startingOffsetForBaselineFrameGrid:mm(offset),baselineFrameGridIncrement:"15 pt",baselineFrameGridRelativeOption:id.BaselineFrameGridRelativeOption.TOP_OF_FRAME};}
 function body(p,y,h,bilgi=false){const offset=15*25.4/72;const chunk=h<50?BODY.split("\r")[0]:BODY;const t=text(p,y-offset,xleft(p),h+offset,196,chunk+"\r"+chunk,bilgi?"Bilgi — Ana Metin":"Temel — Ana Metin");t.textFramePreferences.properties={textColumnCount:2,textColumnGutter:"8 mm",firstBaselineOffset:id.FirstBaseline.FIXED_HEIGHT,minimumFirstBaselineOffset:"15 pt"};t.insertionPoints.item(chunk.length+1).contents=id.SpecialCharacters.COLUMN_BREAK;customGrid(t,offset);return t;}
 function heading(p,title,subtitle="ÖRNEK METİN — Yer, yapı ve konu bilgisi"){const x=xleft(p);text(p,23,x,24,196,title,"Temel — Başlık 1");text(p,49,x,9,196,subtitle,"Temel — Alt Başlık");}
 function line(p,y,x1,x2,colorName="Taş Grisi",weight=.5,layer=3){const q=p.graphicLines.add();q.geometricBounds=bounds(p,y,x1,.001,x2-x1);q.strokeColor=color(colorName);q.strokeWeight=pt(weight);q.itemLayer=L[layer];return q;}
 function image(p,y,x,h,w,name="Fotoğraf",fit="Dolgu",caption=true){
  const kind=name==="Çizim"?"Çizim":name==="Arşiv"?"Arşiv":"Fotoğraf";
  const st="Görsel — "+kind+" / "+(kind==="Fotoğraf"?fit:"Tamamı");
  const r=rect(p,y,x,h,w,"Taş Grisi",st);r.label=name+" — Görsel yer tutucu";
  const lab=text(p,y+h/2-4,x+4,10,w-8,name.toUpperCase()+"\rÖRNEK GÖRSEL", "Temel — Görsel Kaynağı");
  const items=[r,lab];
  if(caption){items.push(text(p,y+h+1.5,x,10,w,"Şekil [n] — [Yer / eleman]. [Durum / tarih].","Temel — Görsel Açıklaması"));items.push(text(p,y+h+12,x,9,w,"Kaynak: [Üretici, yıl, arşiv kimliği ve hak bilgisi]","Temel — Görsel Kaynağı"));}
  const g=p.groups.add(items);g.name=name+" — Görsel ve açıklama";return g;
 }
 function margins(p){p.marginPreferences.properties={top:"20 mm",bottom:"22 mm",left:"23 mm",right:"18 mm",columnCount:2,columnGutter:"8 mm"};}
 function guides(p){const x=xleft(p);for(let n=0;n<6;n++){for(const q of [x+n*34,x+n*34+26])p.guides.add(L[6],{orientation:id.HorizontalOrVertical.VERTICAL,location:mm(q),fitToPage:true});}p.guides.add(L[6],{orientation:id.HorizontalOrVertical.HORIZONTAL,location:"64 mm",fitToPage:true});}
 function nav(p,dark=false){const x=xleft(p),left=String(p.side)===String(id.PageSideOptions.LEFT_HAND);
  text(p,10,left?x+16:x,6,164,"[Yapı / Yer]  ·  [Kısa konu etiketi]",dark?"Temel — Üst Bilgi / Koyu Zemin":"Temel — Üst Bilgi",5);
  const t=text(p,10,left?x:x+182,6,14,"",dark?"Temel — Sayfa Numarası / Koyu Zemin":"Temel — Sayfa Numarası",5);t.contents=id.SpecialCharacters.AUTO_PAGE_NUMBER;
  if(!left)t.parentStory.texts.item(0).justification=id.Justification.RIGHT_ALIGN;
 }
 try {
 stage("colors");
 const groups={};for(const n of ["Nötr Renkler","Vurgu Renkleri","Açık Tonlar"])groups[n]=d.colorGroups.add({name:n});
 for(let i=0;i<PALETTE.length;i++){const row=PALETTE[i];C[row[0]]=d.colors.add({name:row[0],model:id.ColorModel.PROCESS,space:id.ColorSpace.CMYK,colorValue:row.slice(1)});groups[i<5?"Nötr Renkler":"Vurgu Renkleri"].colorGroupSwatches.add(C[row[0]]);}
 for(const row of [["Kiremit Açık","Kiremit",12],["Adaçayı Açık","Adaçayı",20],["Petrol Açık","Petrol",12],["Safran Açık","Safran",25]]){C[row[0]]=d.tints.add(C[row[1]],{name:row[0],tintValue:row[2]});groups["Açık Tonlar"].colorGroupSwatches.add(C[row[0]]);}
 stage("paragraphStyles");
 const pg={};for(const n of ["Temel","Açıklama","Bilgi","Bölüm","Harita"])pg[n]=d.paragraphStyleGroups.add({name:n});
 for(const row of STYLE_ROWS){const name=row[0]+" — "+row[1];S[name]=pg[row[0]].paragraphStyles.add({name,appliedFont:row[2]==="S"?fontInfo.sans:fontInfo.serif,fontStyle:row[3],pointSize:pt(row[4]),leading:pt(row[5]),appliedLanguage:fontInfo.language,fillColor:color(row[6]||"Metin Siyahı"),hyphenation:false,justification:id.Justification.LEFT_ALIGN,spaceAfter:0});}
 function set(n,p){S[n].properties=p;}
 set("Temel — Ana Metin",{alignToBaseline:true,spaceAfter:"15 pt",firstLineIndent:0,leftIndent:0,rightIndent:0,hyphenation:true,hyphenateWordsLongerThan:6,hyphenateAfterFirst:3,hyphenateBeforeLast:3,hyphenateLadderLimit:2,keepLinesTogether:true,keepFirstLines:2,keepLastLines:2});
 set("Temel — Ana Metin Devam",{basedOn:S["Temel — Ana Metin"],alignToBaseline:true,spaceAfter:0,hyphenation:true,keepLinesTogether:true,keepFirstLines:2,keepLastLines:2});
 set("Temel — Başlık 1",{spaceAfter:"4 mm",keepWithNext:2});set("Temel — Alt Başlık",{spaceAfter:"6 mm",keepWithNext:2});
 set("Temel — Ara Başlık",{spaceBefore:"6 mm",spaceAfter:"2 mm",keepWithNext:2});
 set("Temel — Görsel Açıklaması",{keepLinesTogether:true,keepFirstLines:2,keepLastLines:2,keepWithNext:1});
 set("Temel — Alıntı",{spaceBefore:"5 mm",spaceAfter:"5 mm",keepWithNext:1});
 set("Temel — Kaynakça",{leftIndent:"3 mm",firstLineIndent:"-3 mm"});
 set("Açıklama — Başlık",{basedOn:S["Temel — Ara Başlık"]});set("Açıklama — Metin",{basedOn:S["Temel — Yan Not"],spaceAfter:"2 mm"});
 set("Bilgi — Başlık",{spaceAfter:"5 mm"});set("Bilgi — Ana Metin",{alignToBaseline:true,spaceAfter:"15 pt",hyphenation:true,hyphenateWordsLongerThan:6,hyphenateAfterFirst:3,hyphenateBeforeLast:3,hyphenateLadderLimit:2,keepLinesTogether:true,keepFirstLines:2,keepLastLines:2});
 set("Bilgi — Ara Başlık",{spaceBefore:"5 mm",spaceAfter:"2 mm",keepWithNext:2});
 set("Bilgi — Görsel Açıklaması",{basedOn:S["Temel — Görsel Açıklaması"]});set("Bilgi — Kaynak",{basedOn:S["Temel — Görsel Kaynağı"]});
 for(const n of ["Açıklama — Metin","Temel — Görsel Açıklaması","Temel — Üst Bilgi","Temel — Sayfa Numarası","Harita — Başlık","Harita — Yer Adı","Harita — Lejant","Harita — Kaynak","Temel — Alıntı"]){const g=n.split(" — ")[0];S[n+" / Koyu Zemin"]=pg[g].paragraphStyles.add({name:n+" / Koyu Zemin",basedOn:S[n],fillColor:color("Kâğıt")});}
 S["Temel — Ana Metin İşaretli"]=pg.Temel.paragraphStyles.add({name:"Temel — Ana Metin İşaretli",basedOn:S["Temel — Ana Metin"],ruleAbove:true,ruleAboveColor:color("Kiremit"),ruleAboveLineWeight:"0.6 pt",ruleAboveWidth:id.RuleWidth.COLUMN_WIDTH,ruleAboveRightIndent:"86 mm",ruleAboveOffset:"2 mm"});
 stage("characterStyles");const cg=d.characterStyleGroups.add({name:"Temel"});
 for(const [n,p] of [["İtalik Terim",{fontStyle:"Italic"}],["Kalın Vurgu",{fontStyle:"Semibold"}],["Kırmızı Vurgu",{fontStyle:"Semibold",fillColor:color("Kiremit")}],["Bölünmez",{noBreak:true}],["Üst Simge",{position:id.Position.SUPERSCRIPT}],["Çapraz Başvuru",{fontStyle:"Semibold",fillColor:color("Petrol")}]] )cg.characterStyles.add(Object.assign({name:"Temel — "+n},p));
 stage("objectStyles");const og={};for(const n of ["Temel","Görsel","Açıklama","Bilgi","Harita"])og[n]=d.objectStyleGroups.add({name:n});
 function object(n,p){O[n]=og[n.split(" — ")[0]].objectStyles.add(Object.assign({name:n},p));return O[n];}
 object("Temel — Metin Çerçevesi",{enableTextFrameGeneralOptions:true,enableTextFrameBaselineOptions:true,enableFill:true,enableStroke:true,fillColor:none,strokeColor:none});
 O["Temel — Metin Çerçevesi"].textFramePreferences.properties={insetSpacing:0,verticalJustification:id.VerticalJustification.TOP_ALIGN};
 for(const [n,fit] of [["Fotoğraf / Dolgu",id.EmptyFrameFittingOptions.FILL_PROPORTIONALLY],["Fotoğraf / Tamamı",id.EmptyFrameFittingOptions.PROPORTIONALLY],["Çizim / Tamamı",id.EmptyFrameFittingOptions.PROPORTIONALLY],["Arşiv / Tamamı",id.EmptyFrameFittingOptions.PROPORTIONALLY],["Karşılaştırma",id.EmptyFrameFittingOptions.PROPORTIONALLY]]){const o=object("Görsel — "+n,{enableFrameFittingOptions:true,enableStroke:true,strokeColor:none});o.frameFittingOptions.properties={fittingOnEmptyFrame:fit,autoFit:true};}
 object("Açıklama — İşaret",{enableFill:true,enableStroke:true,fillColor:color("Kiremit"),strokeColor:none});
 object("Açıklama — Bağlantı Çizgisi",{enableStroke:true,strokeColor:color("Kiremit"),strokeWeight:"0.6 pt"});
 object("Bilgi — Panel",{enableFill:true,fillColor:color("Kireç Taşı"),enableTextFrameGeneralOptions:true});O["Bilgi — Panel"].textFramePreferences.insetSpacing="6 mm";
 object("Bilgi — Ayırıcı",{enableStroke:true,strokeColor:color("İkincil Metin"),strokeWeight:"0.5 pt"});
 object("Harita — Çerçeve",{enableStroke:true,strokeColor:none});
 for(const dark of [false,true])for(const [n,w,col] of [["Ana Hat",.8,dark?"Kâğıt":"Metin Siyahı"],["İkincil Hat",.5,dark?"Taş Grisi":"İkincil Metin"],["Geçici Hat",.7,dark?"Kâğıt":"Metin Siyahı"],["İnceleme Sınırı",.7,dark?"Kâğıt":"Petrol"]]){object("Harita — "+n+(dark?" / Koyu":" / Açık"),{enableStroke:true,strokeWeight:pt(w),strokeColor:color(col)});}
 for(const n of ["Su Alanı","Yapı Noktası","Odak Yapı"])object("Harita — "+n,{enableFill:true,fillColor:color(n==="Su Alanı"?"Petrol Açık":"Kiremit")});
 stage("tableStyles");const tg=d.tableStyleGroups.add({name:"Temel"}),cellg=d.cellStyleGroups.add({name:"Temel"});
 S["Temel — Tablo Metni"]=pg.Temel.paragraphStyles.add({name:"Temel — Tablo Metni",basedOn:S["Temel — Kaynakça"],pointSize:"9 pt",leading:"12 pt",leftIndent:0,firstLineIndent:0});
 const cells={};for(const n of ["Tablo Başlığı","Tablo Gövdesi","Tablo Kaynağı"]){cells[n]=cellg.cellStyles.add({name:"Temel — "+n,appliedParagraphStyle:S["Temel — Tablo Metni"],topInset:"2 mm",bottomInset:"2 mm",leftInset:"2 mm",rightInset:"2 mm",topEdgeStrokeWeight:"0.5 pt",bottomEdgeStrokeWeight:"0.5 pt",leftEdgeStrokeWeight:0,rightEdgeStrokeWeight:0,topEdgeStrokeColor:color("Taş Grisi"),bottomEdgeStrokeColor:color("Taş Grisi")});}
 cells["Tablo Başlığı"].fillColor=color("Kireç Taşı");
 const tableStyle=tg.tableStyles.add({name:"Temel — Veri Tablosu",bodyRegionCellStyle:cells["Tablo Gövdesi"],headerRegionCellStyle:cells["Tablo Başlığı"]});
 d.footnoteOptions.footnoteTextStyle=S["Temel — Dipnot"];
 stage("masters");
 const masterNames=["Temel","Görsel","Açıklama","Bilgi","Bölüm Açılışı","Harita Açık","Harita Koyu"];
 for(let n=0;n<7;n++){const m=n===0?d.masterSpreads.item(0):d.masterSpreads.add();m.namePrefix=String.fromCharCode(65+n);m.baseName=masterNames[n];M[n]=m;if(n===1||n===2)m.appliedMaster=M[0];
  for(let k=0;k<m.pages.length;k++){const p=m.pages.item(k);margins(p);guides(p);if(n!==1&&n!==2&&n!==4)nav(p,n===6);if(n===3||n===6)rect(p,-3,-3,316,243,n===3?"Kireç Taşı":"Gece",null,0);if(n===4)rect(p,-3,-3,316,243,k===0?"Kireç Taşı":"Adaçayı",null,0);
   text(p,294,xleft(p),7,196,"Kitap şablonu v"+VERSION+" · Design Guide 1.0.0", "Temel — Görsel Kaynağı",6);
  }
 }
 for(let n=0;n<d.pages.length;n++){const p=d.pages.item(n);margins(p);p.appliedMaster=M[0];}
 stage("layouts");
 let p=d.pages.item(0),x=xleft(p);heading(p,"Yapı ve hafıza","KİTAP ŞABLONU  ·  v"+VERSION);
 text(p,72,x,40,196,"ÖRNEK METİN — Restorasyon kitabı için düzen kataloğu.\r237 × 310 mm · İki metin sütunu · 3 mm taşma", "Bilgi — Giriş");
 text(p,124,x,134,196,LAYOUTS.map((v,i)=>v+"  ·  "+([2,3,4,5,6,7,8,9,10,11,12,14,16,17][i])).join("\r"),"Temel — Kaynakça");
 p=d.pages.item(1);heading(p,LAYOUTS[0]);body(p,64,113);image(p,191,xleft(p),65.3,196,"Fotoğraf");
 p=d.pages.item(2);p.appliedMaster=M[1];heading(p,LAYOUTS[1]);image(p,64,xleft(p),98,196,"Fotoğraf");body(p,191,97);
 p=d.pages.item(3);p.appliedMaster=M[1];heading(p,LAYOUTS[2]);x=xleft(p);image(p,64,x,141,94,"Fotoğraf");
 text(p,64,x+102,107,94,"ÖRNEK METİN — Görsele ilişkin kısa açıklama.\rBu modül, ana metinden ayrı bir yan nottur. Ana metin altta soldan sağa iki sütunda devam eder.","Temel — Yan Not");text(p,178,x+102,37,94,"“ÖRNEK METİN — Malzemenin izleri.”","Temel — Alıntı");body(p,245,43);
 p=d.pages.item(4);p.appliedMaster=M[1];heading(p,LAYOUTS[3]);x=xleft(p);for(let r=0;r<2;r++)for(let c=0;c<3;c++)image(p,64+r*90,x+c*68,45,60,"Fotoğraf");body(p,248,40);
 p=d.pages.item(5);p.appliedMaster=M[1];heading(p,LAYOUTS[4]);x=xleft(p);image(p,69,x,70.5,94,"Önce — [Tarih]");image(p,69,x+102,70.5,94,"Sonra — [Tarih]");body(p,178,110);
 p=d.pages.item(6);p.appliedMaster=M[1];heading(p,LAYOUTS[5]);x=xleft(p);image(p,64,x,126,128,"Çizim");text(p,64,x+136,132,60,"01 — [İncelenen detay]\rÖRNEK METİN — Açıklama ve doğrulanmış ölçü burada yer alır.","Açıklama — Metin");body(p,227,61);
 p=d.pages.item(7);p.appliedMaster=M[1];heading(p,LAYOUTS[6]);x=xleft(p);for(let r=0;r<2;r++)for(let c=0;c<2;c++)image(p,64+r*93,x+c*102,62.7,94,"Arşiv");
 p=d.pages.item(8);p.appliedMaster=M[2];heading(p,LAYOUTS[7]);x=xleft(p);image(p,64,x,151,128,"Çizim");
 for(let n=0;n<4;n++){const e=p.ovals.add();e.applyObjectStyle(O["Açıklama — İşaret"],true);e.geometricBounds=bounds(p,90+n*28,x+90,4,4);e.itemLayer=L[3];text(p,73+n*34,x+136,31,60,"0"+(n+1)+" — [Detay]\rÖRNEK METİN — Müdahale gerekçesi.","Açıklama — Metin");line(p,92+n*28,x+95,x+131,"Kiremit",.6);}
 text(p,249,x,30,196,"Yerel lejant: Mevcut · Korunacak · Müdahale\rÖRNEK ÇİZİM — Ölçek ve gerçek veriler henüz eklenmemiştir.","Açıklama — Ölçek");
 p=d.pages.item(9);p.appliedMaster=M[2];heading(p,LAYOUTS[8]);x=xleft(p);for(let n=0;n<4;n++)text(p,64+n*43,x,37,60,"0"+(n+1)+" — [Aşama]\rÖRNEK METİN — İşlem sırası ve kaynak.","Açıklama — Aşama");image(p,64,x+68,151,128,"Çizim");body(p,254,34);
 p=d.pages.item(10);p.appliedMaster=M[2];heading(p,LAYOUTS[9]);x=xleft(p);image(p,64,x,110,94,"Çizim");image(p,64,x+102,110,94,"Çizim");text(p,203,x,31,196,"Yerel lejant: Mevcut — siyah · Müdahale — Kiremit\rKarşılaştırma için ortak ölçek ve bakış açısı editör tarafından doğrulanmalıdır.","Açıklama — Ölçek");body(p,246,42);
 p=d.pages.item(11);p.appliedMaster=M[3];x=xleft(p);text(p,25,x,7,196,"BİLGİ  ·  ÖRNEK METİN", "Bilgi — Üst Etiket");text(p,38,x,26,196,"Malzemenin hafızası", "Bilgi — Başlık");text(p,73,x,27,196,"ÖRNEK METİN — Bir kavram, malzeme ya da yöntem için bağımsız açıklama alanı.","Bilgi — Giriş");body(p,114,104,true);image(p,236,x,32,196,"Çizim");
 p=d.pages.item(12);heading(p,"Veri ve kaynak düzeni","TABLO, ALINTI VE NOT ÖRNEKLERİ");x=xleft(p);
 const tableFrame=text(p,68,x,91,196,"","Temel — Tablo Metni");const tab=tableFrame.insertionPoints.item(0).tables.add({bodyRowCount:3,columnCount:3,headerRowCount:1});tab.appliedTableStyle=tableStyle;tab.width="196 mm";const tableData=["Öğe","Durum","Kaynak","[Malzeme]","[Mevcut]","[Belge]","[Detay]","[Korunacak]","[Arşiv]","[Müdahale]","[Öneri]","[Rapor]"];for(let i=0;i<tableData.length;i++)tab.cells.item(i).contents=tableData[i];
 text(p,173,x,47,196,"“ÖRNEK METİN — Yapının belleği, belgeler ve izler aracılığıyla okunur.”", "Temel — Alıntı");text(p,228,x,13,196,"ÖRNEK ALINTI — Yayınlanmış bir kişiye atfedilmemiştir.","Temel — Alıntı Kaynağı");
 const nf=body(p,250,38);const foot=nf.parentStory.insertionPoints.item(20).footnotes.add();foot.texts.item(0).contents="ÖRNEK DİPNOT — Doğrulanmış kaynak bilgisi buraya yazılır.";
 p=d.pages.item(13);p.appliedMaster=M[4];x=xleft(p);text(p,259,x,23,196,"ÖRNEK METİN — Bölüm açılışının sol sayfası.", "Temel — Üst Bilgi");
 p=d.pages.item(14);p.appliedMaster=M[4];x=xleft(p);text(p,61,x,13,196,"01", "Bölüm — Numara");text(p,87,x,82,196,"Yapı ve\rhafıza", "Bölüm — Başlık");text(p,207,x,43,162,"ÖRNEK METİN — Belgeler, malzemeler ve koruma kararları arasında bir okuma.","Bölüm — Kısa Açıklama");
 stage("maps");
 function map(index,dark){p=d.pages.item(index);p.appliedMaster=M[dark?6:5];x=xleft(p);const suffix=dark?" / Koyu Zemin":"";
  text(p,26,x,20,196,dark?LAYOUTS[13]:LAYOUTS[12],"Harita — Başlık"+suffix);
  const bg=rect(p,58,x,156,196,dark?"Gece":"Kireç Taşı","Harita — Çerçeve",2);bg.label="Şematik harita — gerçek coğrafi veri değildir";
  rect(p,58,x+138,156,34,dark?"Petrol":"Petrol Açık",null,2);
  for(let i=0;i<5;i++)line(p,79+i*25,x+9,x+127,dark?"Kâğıt":"Metin Siyahı",.8,2);
  for(let i=0;i<4;i++){const v=p.graphicLines.add();v.geometricBounds=bounds(p,69,x+19+i*31,131,.001);v.strokeColor=color(dark?"Taş Grisi":"İkincil Metin");v.strokeWeight="0.5 pt";v.itemLayer=L[2];}
  for(let i=0;i<5;i++){const e=p.ovals.add();e.applyObjectStyle(O["Harita — Yapı Noktası"],true);e.geometricBounds=bounds(p,83+i*23,x+22+(i%3)*31,2.5,2.5);e.itemLayer=L[3];if(dark){e.strokeColor=color("Kâğıt");e.strokeWeight="0.5 pt";}text(p,81+i*23,x+28+(i%3)*31,7,22,"Y0"+(i+1),"Harita — Yer Adı"+suffix);}
  text(p,227,x,30,196,"Yapı noktası + ID · Odak yapı · Su alanı\rŞematik gösterim — ölçekli değildir", "Harita — Lejant"+suffix);
  text(p,265,x,22,196,"ÖRNEK HARİTA · Kaynak: [Veri kaynağı]\rVeri tarihi: [Tarih] · Hazırlayan: [Ad]", "Harita — Kaynak"+suffix);
 }
 map(15,false);map(16,true);
 stage("glyphProof");p=d.pages.item(17);heading(p,"Türkçe karakter denemesi","TÜM KULLANILAN GERÇEK FONT KESİTLERİ");x=xleft(p);
 const proofRows=[["Source Sans 3 Regular","Temel — Ana Metin"],["Source Sans 3 Semibold","Temel — Ara Başlık"],["Source Sans 3 Bold","Açıklama — Numara"],["Source Sans 3 Medium","Temel — Sayfa Numarası"],[fontInfo.serif+" Regular","Bilgi — Ana Metin"],[fontInfo.serif+" Semibold","Bilgi — Başlık"],[fontInfo.serif+" Italic","Temel — Alıntı"]];
 for(let i=0;i<proofRows.length;i++){text(p,66+i*28,x,8,196,proofRows[i][0],"Temel — Görsel Kaynağı");const ps=pg.Temel.paragraphStyles.add({name:"Temel — Karakter Denemesi "+(i+1),basedOn:S[proofRows[i][1]],pointSize:"11 pt",leading:"15 pt",spaceBefore:0,spaceAfter:0,keepWithNext:0,alignToBaseline:false});S[ps.name]=ps;text(p,76+i*28,x,17,196,GLYPHS,ps.name);}
 const italic=pg.Temel.paragraphStyles.add({name:"Temel — Karakter Denemesi Sans İtalik",basedOn:S["Temel — Ana Metin"],fontStyle:"Italic",pointSize:"11 pt",leading:"15 pt",alignToBaseline:false,spaceAfter:0});S[italic.name]=italic;text(p,273,x,15,196,GLYPHS,italic.name);
 d.recompose();stage("complete");return {doc:d,fontInfo,layouts:LAYOUTS,phase};
 }catch(e){d.insertLabel("restorationBuildError",String(e.message||e));throw new Error("Sablonépítés: "+phase+"; documentId="+d.id+"; "+String(e.message||e));}
}
function qa(id,d){
 const overset=[],badFonts=[],markers=[];for(let i=0;i<d.stories.length;i++){const s=d.stories.item(i);if(s.overflows)overset.push(s.id);}
 for(let i=0;i<d.fonts.length;i++){const f=d.fonts.item(i);if(String(f.status)!==String(id.FontStatus.INSTALLED))badFonts.push(f.name);}
 for(let m=0;m<d.masterSpreads.length;m++){const a=d.masterSpreads.item(m);for(let p=0;p<a.pages.length;p++)for(let t=0;t<a.pages.item(p).textFrames.length;t++){const f=a.pages.item(p).textFrames.item(t);if(String(f.contents).indexOf("\u0018")>=0)markers.push(f.id);}}
 return {version:VERSION,documentId:d.id,pages:d.pages.length,masters:d.masterSpreads.length,paragraphStyles:d.allParagraphStyles.length,characterStyles:d.allCharacterStyles.length,objectStyles:d.allObjectStyles.length,tableStyles:d.allTableStyles.length,cellStyles:d.allCellStyles.length,colors:d.colors.length,tints:d.tints.length,layers:d.layers.length,links:d.links.length,oversetStoryIds:overset,missingFonts:badFonts,automaticMasterPageMarkers:markers.length,phase:d.extractLabel("restorationBuildPhase")};
}
async function execute(id,folders,op,ctx){
 assert(["fonts","build","qa","save"].includes(op.action),"Unknown restorationBook action.");
 if(["build","save"].includes(op.action))assert(op.experimental===true,"Experimental builder requires experimental: true.");
 if(op.action==="fonts"){const f=fonts(id);return {sans:f.sans,serif:f.serif,missing:f.missing,turkish:f.turkish};}
 if(op.action==="build"){
  assert(!(await folders.output.getEntries()).some(e=>e.name==="Restoration-Book-Layouts-v1.0.0.indd"),"A sablon már létezik; előbb ellenőrizd.");
  for(let i=0;i<id.app.documents.length;i++)assert(id.app.documents.item(i).extractLabel("restorationBookVersion")!==VERSION,"Már létezik megnyitott sablondokumentum. Ne ismételd meg az építést.");
  const result=builder(id,folders);ctx.documentId=result.doc.id;return Object.assign(qa(id,result.doc),{fonts:{sans:result.fontInfo.sans,serif:result.fontInfo.serif},layouts:LAYOUTS});
 }
 assert(Number.isInteger(op.documentId),"documentId szükséges.");const d=id.app.documents.itemByID(op.documentId);
 assert(d.isValid&&d.extractLabel("restorationBookVersion")===VERSION&&d.extractLabel("codexBridgeOwner")===folders.root.nativePath,"Csak a projekt új sablondokumentuma kezelhető.");ctx.documentId=d.id;
 if(op.action==="qa")return qa(id,d);
 if(op.action==="save"){
  const names=["Restoration-Book-Layouts-v"+VERSION+".indd","Restoration-Book-Layouts-v"+VERSION+".indt","Restoration-Book-Layouts-v"+VERSION+".idml","Restoration-Book-Layouts-v"+VERSION+".pdf","Native-QA-v"+VERSION+".json"];
  const existing=new Set((await folders.output.getEntries()).map(e=>e.name.toLowerCase()));
  assert(!names.some(n=>existing.has(n.toLowerCase())),"Output already exists; inspect it and use a new session folder.");
  const q=qa(id,d);assert(q.oversetStoryIds.length===0,"Túlcsorduló szöveg; export előtt javítandó.");assert(q.missingFonts.length===0,"Hiányzó font.");
  const base=folders.output.nativePath+"/Restoration-Book-Layouts-v"+VERSION;
  d.save(base+".indd");d.saveACopy(base+".indt",true);d.exportFile(id.ExportFormat.INDESIGN_MARKUP,base+".idml",false);
  const old=id.app.pdfExportPreferences.properties;try{id.app.pdfExportPreferences.properties={pageRange:id.PageRange.ALL_PAGES,exportReaderSpreads:false,useDocumentBleedWithPDF:false,cropMarks:false,includeSlugWithPDF:false};d.exportFile(id.ExportFormat.PDF_TYPE,base+".pdf",false);}finally{id.app.pdfExportPreferences.properties=old;}
  const f=await folders.output.createFile("Native-QA-v"+VERSION+".json",{overwrite:false});await f.write(JSON.stringify(q,null,2));return {base,qa:q};
 }
 throw new Error("Ismeretlen sablonművelet.");
}
module.exports={execute,builder,qa};
