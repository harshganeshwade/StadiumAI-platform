/**
 * Chatbot multi-language responses and FAQ fallbacks.
 */
'use strict';

const RESPONSES = {
  navigate: {
    en: 'I can help you navigate MetLife Stadium! Your current location is **Section {zone}**. The nearest gate is Gate A. For real-time step-by-step routing instructions, click the "Directions" action below or use the "Navigate" map tab.',
    es: '¡Puedo ayudarte a navegar por el estadio! La salida más cercana está por {zone}. Usa el mapa del estadio en la app para direcciones en tiempo real. Los pasillos conectan todas las secciones. ¿Te gustaría que encuentre una ruta específica?',
    fr: 'Je peux vous aider à naviguer dans le stade ! La sortie la plus proche est par {zone}. Utilisez la carte du stade dans l\'application pour des directions en temps réel. Les coursives relient toutes les sections. Voulez-vous que je trouve un itinéraire spécifique ?',
    ar: 'يمكنني مساعدتك في التنقل في الملعب! أقرب مخرج يقع عبر {zone}. استخدم خريطة الملعب في التطبيق للحصول على اتجاهات فورية. هل تريد مني إيجاد مسار محدد؟',
    pt: 'Posso ajudá-lo a navegar pelo estádio! A saída mais próxima é pela {zone}. Use o mapa do estádio no app para direções em tempo real. Os corredores conectam todas as seções. Gostaria que eu encontrasse uma rota específica?',
    de: 'Ich kann Ihnen helfen, sich im Stadion zurechtzufinden! Der nächste Ausgang ist durch {zone}. Verwenden Sie die Stadionkarte in der App für Echtzeit-Wegbeschreibungen. Möchten Sie, dass ich eine bestimmte Route finde?',
  },
  food: {
    en: 'Since you are located near **Section {zone}**, here are your closest concessions:\n🍔 **Stadium Burger** (Food Court 1) – Burgers, fries, and craft beers. Approx 15 meters to your right. Current wait time: 4 mins.\n🍕 **Margherita Pizza** (Food Court 1) – Fresh wood-fired pizza. Approx 20 meters. Wait time: 8 mins.\n🌭 **Hot Dog Combo** (Food Court 2) – All-beef hot dogs. Approx 35 meters. Wait time: 3 mins.\n\nYou can order food directly through the "Explore" section of the app!',
    es: '¡Gran elección! Tenemos dos patios de comida en el estadio. El Patio de Comida 1 está cerca del Pasillo Norte con hamburguesas, pizza y cerveza artesanal. El Patio de Comida 2 está cerca del Pasillo Sur con hot dogs, tacos de pescado y nachos. ¿Qué te apetece?',
    fr: 'Excellent choix ! Nous avons deux aires de restauration dans le stade. L\'aire 1 est près de la coursive nord avec burgers, pizza et bière artisanale. L\'aire 2 est près de la coursive sud avec hot-dogs, tacos de poisson et nachos. Qu\'est-ce qui vous ferait plaisir ?',
    ar: 'خيار رائع! لدينا منطقتان لتناول الطعام في الملعب. منطقة الطعام 1 بالقرب من الممر الشمالي مع البرغر والبيتزا. منطقة الطعام 2 بالقرب من الممر الجنوبي مع الهوت دوغ والتاكو. ماذا تشتهي؟',
    pt: 'Ótima escolha! Temos duas praças de alimentação no estádio. A Praça 1 fica perto do Corredor Norte com hambúrgueres, pizza e cerveja artesanal. A Praça 2 fica perto do Corredor Sul com hot dogs, tacos de peixe e nachos. O que você está a fim de comer?',
    de: 'Tolle Wahl! Wir haben zwei Food-Courts im Stadion. Food Court 1 ist in der Nähe des Nordgangs mit Burgern, Pizza und Craft-Bier. Food Court 2 ist in der Nähe des Südgangs mit Hot Dogs, Fish Tacos und Nachos. Worauf haben Sie Lust?',
  },
  emergency: {
    en: '🚨 EMERGENCY ALERT: If you are in immediate danger, call stadium security at extension 911 or press the emergency button on any wall panel. Medical staff are stationed at Medical Station 1 near the South Concourse. Stay calm and follow staff instructions. Security has been notified of your location.',
    es: '🚨 ALERTA DE EMERGENCIA: Si estás en peligro inmediato, llama a seguridad del estadio al 911 o presiona el botón de emergencia en cualquier panel de pared. El personal médico está en la Estación Médica 1. Mantén la calma y sigue las instrucciones del personal.',
    fr: '🚨 ALERTE D\'URGENCE : Si vous êtes en danger immédiat, appelez la sécurité du stade au 911 ou appuyez sur le bouton d\'urgence. Le personnel médical est à la Station Médicale 1. Restez calme et suivez les instructions du personnel.',
    ar: '🚨 تنبيه طوارئ: إذا كنت في خطر فوري، اتصل بأمن الملعب على الرقم 911 أو اضغط على زر الطوارئ. الطاقم الطبي متواجد في المحطة الطبية 1. حافظ على هدوئك واتبع تعليمات الموظفين.',
    pt: '🚨 ALERTA DE EMERGÊNCIA: Se você está em perigo imediato, ligue para a segurança do estádio no ramal 911 ou pressione o botão de emergência. A equipe médica está na Estação Médica 1. Mantenha a calma e siga as instruções da equipe.',
    de: '🚨 NOTFALL-ALARM: Wenn Sie in unmittelbarer Gefahr sind, rufen Sie die Stadionsicherheit unter 911 an oder drücken Sie den Notfallknopf. Medizinisches Personal befindet sich an der Medizinstation 1. Bleiben Sie ruhig und folgen Sie den Anweisungen.',
  },
  schedule: {
    en: 'Today\'s match schedule:\n⚽ Gates Open: 2 hours before kick-off\n⚽ Pre-match Entertainment: 1 hour before\n⚽ Kick-off: Check your ticket for exact time\n⚽ Halftime: ~15 minutes\n⚽ Post-match: Stadium closes 1 hour after final whistle\n\nWould you like details about specific events?',
    es: 'Horario del partido de hoy:\n⚽ Apertura de puertas: 2 horas antes\n⚽ Entretenimiento previo: 1 hora antes\n⚽ Inicio: Consulta tu entrada\n⚽ Medio tiempo: ~15 minutos\n⚽ Post-partido: El estadio cierra 1 hora después\n\n¿Quieres detalles sobre eventos específicos?',
    fr: 'Programme du match d\'aujourd\'hui :\n⚽ Ouverture des portes : 2 heures avant\n⚽ Animations d\'avant-match : 1 heure avant\n⚽ Coup d\'envoi : Consultez votre billet\n⚽ Mi-temps : ~15 minutes\n⚽ Après-match : Le stade ferme 1 heure après\n\nVoulez-vous des détails ?',
    ar: 'جدول مباراة اليوم:\n⚽ فتح البوابات: قبل ساعتين\n⚽ ترفيه ما قبل المباراة: قبل ساعة\n⚽ بداية المباراة: تحقق من تذكرتك\n⚽ الاستراحة: ~15 دقيقة\n⚽ بعد المباراة: يغلق الملعب بعد ساعة\n\nهل تريد تفاصيل؟',
    pt: 'Programação do jogo de hoje:\n⚽ Abertura dos portões: 2 horas antes\n⚽ Entretenimento pré-jogo: 1 hora antes\n⚽ Início: Verifique seu ingresso\n⚽ Intervalo: ~15 minutos\n⚽ Pós-jogo: Estádio fecha 1 hora após\n\nDeseja detalhes sobre eventos específicos?',
    de: 'Spielplan heute:\n⚽ Einlass: 2 Stunden vorher\n⚽ Vorprogramm: 1 Stunde vorher\n⚽ Anstoß: Siehe Ticket\n⚽ Halbzeit: ~15 Minuten\n⚽ Nach dem Spiel: Stadion schließt 1 Stunde danach\n\nMöchten Sie Details zu bestimmten Events?',
  },
  parking: {
    en: 'Parking information:\n🅿️ Lot A (Premium) – Near Gate A, covered, $35\n🅿️ Lot B (Standard) – Near Gate B, open-air, $20\n🅿️ Lot C (Economy) – Shuttle service, $10\n🅿️ Lot D (VIP Valet) – Full service, $50\n🅿️ Lot E (Accessible) – ADA parking, $15\n\nAll lots accept mobile payment. Need help finding your car after the match?',
    es: 'Información de estacionamiento:\n🅿️ Lote A (Premium) – Cerca de Puerta A, cubierto, $35\n🅿️ Lote B (Estándar) – Cerca de Puerta B, $20\n🅿️ Lote C (Económico) – Con shuttle, $10\n🅿️ Lote D (VIP Valet) – Servicio completo, $50\n🅿️ Lote E (Accesible) – Estacionamiento ADA, $15',
    fr: 'Informations parking :\n🅿️ Lot A (Premium) – Près de la Porte A, couvert, 35$\n🅿️ Lot B (Standard) – Près de la Porte B, 20$\n🅿️ Lot C (Économique) – Navette, 10$\n🅿️ Lot D (VIP Voiturier) – Service complet, 50$\n🅿️ Lot E (Accessible) – PMR, 15$',
    ar: 'معلومات مواقف السيارات:\n🅿️ الموقف A (مميز) – بالقرب من البوابة A، مغطى، 35$\n🅿️ الموقف B (عادي) – بالقرب من البوابة B، 20$\n🅿️ الموقف C (اقتصادي) – خدمة حافلة، 10$\n🅿️ الموقف D (VIP) – خدمة كاملة، 50$\n🅿️ الموقف E (ميسر) – مواقف ذوي الاحتياجات، 15$',
    pt: 'Informações de estacionamento:\n🅿️ Lote A (Premium) – Perto do Portão A, coberto, $35\n🅿️ Lote B (Padrão) – Perto do Portão B, $20\n🅿️ Lote C (Econômico) – Shuttle, $10\n🅿️ Lote D (VIP Manobrista) – Serviço completo, $50\n🅿️ Lote E (Acessível) – PCD, $15',
    de: 'Parkinformationen:\n🅿️ Lot A (Premium) – Tor A, überdacht, 35$\n🅿️ Lot B (Standard) – Tor B, 20$\n🅿️ Lot C (Economy) – Shuttle, 10$\n🅿️ Lot D (VIP Valet) – Vollservice, 50$\n🅿️ Lot E (Barrierefrei) – 15$',
  },
  restroom: {
    en: 'Since you are located near **Section {zone}**, your nearest restrooms are:\n🚻 **Standard Restroom** – Turn right out of your section entrance, 15 meters down the concourse near Section 102.\n🚻 **Accessible & Family Restroom** – Complete with baby-changing tables, situated 25 meters to your left near Medical Station 1.',
    es: 'Los baños están ubicados en cada nivel del estadio:\n🚻 Nivel 1: Cerca de cada puerta (Puertas A-D)\n🚻 Nivel 2: En ambos extremos de cada pasillo\n🚻 Baños familiares/accesibles: Cerca de la Estación Médica 1\n🚻 Cambiadores: Disponibles en todos los baños familiares',
    fr: 'Les toilettes sont situées à chaque niveau :\n🚻 Niveau 1 : Près de chaque porte (A-D)\n🚻 Niveau 2 : Aux deux extrémités de chaque coursive\n🚻 Toilettes familiales/accessibles : Près de la Station Médicale 1\n🚻 Tables à langer : Dans toutes les toilettes familiales',
    ar: 'دورات المياه موجودة في كل مستوى:\n🚻 المستوى 1: بالقرب من كل بوابة (A-D)\n🚻 المستوى 2: في طرفي كل ممر\n🚻 دورات المياه العائلية/الميسرة: بالقرب من المحطة الطبية 1\n🚻 طاولات تغيير الحفاضات: متوفرة في جميع الحمامات العائلية',
    pt: 'Banheiros estão localizados em todos os níveis:\n🚻 Nivel 1: Perto de cada portão (A-D)\n🚻 Nível 2: Nas extremidades de cada corredor\n🚻 Banheiros familiares/acessíveis: Perto da Estação Médica 1\n🚻 Trocadores: Disponíveis em todos os banheiros familiares',
    de: 'Toiletten befinden sich auf jeder Ebene:\n🚻 Ebene 1: Nahe jedem Tor (A-D)\n🚻 Ebene 2: An beiden Enden jedes Gangs\n🚻 Familien-/Barrierefreie Toiletten: Nahe Medizinstation 1\n🚻 Wickelräume: In allen Familientoiletten verfügbar',
  },
  help: {
    en: 'Welcome to MetLife Stadium! 🏟️ I am your GenAI-powered Stadium Operations & Fan Assistant. I am designed to help both attendees and stadium staff have a seamless event day. Here is everything I can do for you:\n\n📍 **Navigation & Routes**: Get real-time, optimal directions to any zone, section, seat, gate, or amenity based on current stadium crowd levels and gate congestion.\n\n🍔 **Food, Drinks & Concessions**: Explore menus, check queue times at our North and South Food Courts, get personalized dining recommendations, and order food directly.\n\n🅿️ **Parking Assistant**: Find the best parking lots (Lots A-E), check parking rates, or ask me to locate your car after the game.\n\n🎫 **Live Event Schedule**: View lineup details, game kick-off times, halftime programs, and event timelines.\n\n🚻 **Restrooms**: Find the closest standard, accessible, or family restroom with baby-changing tables on your level.\n\n🛍️ **Official Merchandise**: Browse official fan shops and merchandise kiosks to buy jerseys, caps, or commemorative scarfs.\n\n🏥 **First Aid & Medical**: Instantly request medical staff, look up defibrillator (AED) positions, or locate the main Medical Station 1.\n\n🌤️ **Real-time Weather**: Stay updated with current temperatures, ultraviolet levels, and roof retraction updates.\n\n🚨 **Security & Emergency Alerting**: Instantly report issues, access immediate emergency procedures, or request staff deployment if required.\n\nHow can I help you make the most of your game day today?',
    es: '¡Soy tu asistente StadiumAI! Puedo ayudarte con:\n📍 Navegación\n🍔 Comida y Bebidas\n🅿️ Estacionamiento\n🎫 Horarios\n🚻 Baños\n🛍️ Mercancía\n🏥 Médico\n🌤️ Clima\n🚨 Emergencias\n\n¡Solo pregúntame!',
    fr: 'Je suis votre assistant StadiumAI ! Je peux vous aider avec :\n📍 Navigation\n🍔 Restauration\n🅿️ Parking\n🎫 Programme\n🚻 Toilettes\n🛍️ Boutique\n🏥 Médical\n🌤️ Météo\n🚨 Urgences\n\nDemandez-moi !',
    ar: 'أنا مساعد StadiumAI! يمكنني مساعدتك في:\n📍 التنقل\n🍔 الطعام والمشروبات\n🅿️ مواقف السيارات\n🎫 الجدول\n🚻 دورات المياه\n🛍️ البضائع\n🏥 الطبي\n🌤️ الطقس\n🚨 الطوارئ\n\nاسألني أي شيء!',
    pt: 'Sou seu assistente StadiumAI! Posso ajudar com:\n📍 Navegação\n🍔 Comida e Bebidas\n🅿️ Estacionamento\n🎫 Programação\n🚻 Banheiros\n🛍️ Mercadorias\n🏥 Médico\n🌤️ Clima\n🚨 Emergência\n\nPergunte-me qualquer coisa!',
    de: 'Ich bin Ihr StadiumAI-Assistent! Ich kann helfen mit:\n📍 Navigation\n🍔 Essen & Trinken\n🅿️ Parken\n🎫 Spielplan\n🚻 Toiletten\n🛍️ Merchandise\n🏥 Medizin\n🌤️ Wetter\n🚨 Notfall\n\nFragen Sie mich einfach!',
  },
  weather: {
    en: 'Current stadium weather conditions:\n🌤️ Temperature: 24°C (75°F)\n💨 Wind: 8 km/h NW\n💧 Humidity: 45%\n☀️ UV Index: 6 (Moderate)\n\nThe stadium roof is partially retractable. Sunscreen recommended for sections in direct sunlight. Rain is not expected today. Stay hydrated — water stations are available at all concourse corners.',
    es: 'Condiciones climáticas actuales del estadio:\n🌤️ Temperatura: 24°C (75°F)\n💨 Viento: 8 km/h NO\n💧 Humedad: 45%\n☀️ Índice UV: 6 (Moderado)\n\nProtector solar recomendado. No se espera lluvia. ¡Mantente hidratado!',
    fr: 'Conditions météo du stade :\n🌤️ Température : 24°C\n💨 Vent : 8 km/h NO\n💧 Humidité : 45%\n☀️ Indice UV : 6 (Modéré)\n\nCrème solaire recommandée. Pas de pluie prévue. Restez hydraté !',
    ar: 'أحوال الطقس الحالية:\n🌤️ الحرارة: 24°م\n💨 الرياح: 8 كم/س شمال غرب\n💧 الرطوبة: 45%\n☀️ مؤشر الأشعة: 6\n\nيُنصح باستخدام واقي الشمس. لا يتوقع هطول أمطار.',
    pt: 'Condições climáticas do estádio:\n🌤️ Temperatura: 24°C\n💨 Vento: 8 km/h NO\n💧 Umidade: 45%\n☀️ Índice UV: 6 (Moderado)\n\nProtetor solar recomendado. Não há previsão de chuva. Mantenha-se hidratado!',
    de: 'Aktuelle Stadionwetterbedingungen:\n🌤️ Temperatur: 24°C\n💨 Wind: 8 km/h NW\n💧 Luftfeuchtigkeit: 45%\n☀️ UV-Index: 6 (Mäßig)\n\nSonnenschutz empfohlen. Kein Regen erwartet. Trinken Sie genug!',
  },
  merchandise: {
    en: 'Visit our team stores for official merchandise! 🛍️\n📍 Main Store: North Concourse – Jerseys, caps, scarves\n📍 South Kiosk: South Concourse – Scarves, posters\n📍 East Stand: East Concourse – Mini footballs, water bottles\n📍 West Stand: West Concourse – Keychains, accessories\n\n⭐ Hot item: 2026 Season Jersey – $89.99\n\nAll stores accept mobile payment and contactless cards.',
    es: '¡Visita nuestras tiendas oficiales! 🛍️\n📍 Tienda Principal: Pasillo Norte – Camisetas, gorras\n📍 Kiosco Sur: Pasillo Sur – Bufandas, pósters\n📍 Este: Pasillo Este – Balones, botellas\n📍 Oeste: Pasillo Oeste – Llaveros\n\n⭐ Destacado: Camiseta 2026 – $89.99',
    fr: 'Visitez nos boutiques officielles ! 🛍️\n📍 Boutique Principale : Coursive Nord – Maillots, casquettes\n📍 Kiosque Sud : Coursive Sud – Écharpes, affiches\n📍 Est : Coursive Est – Mini ballons, gourdes\n📍 Ouest : Coursive Ouest – Porte-clés\n\n⭐ Article vedette : Maillot 2026 – 89,99$',
    ar: 'زُر متاجرنا الرسمية! 🛍️\n📍 المتجر الرئيسي: الممر الشمالي – قمصان، قبعات\n📍 كشك الجنوب: الممر الجنوبي – أوشحة، ملصقات\n📍 الشرق: الممر الشرقي – كرات صغيرة\n📍 الغرب: الممر الغربي – سلاسل مفاتيح\n\n⭐ الأكثر مبيعاً: قميص 2026 – 89.99$',
    pt: 'Visite nossas lojas oficiais! 🛍️\n📍 Loja Principal: Corredor Norte – Camisas, bonés\n📍 Quiosque Sul: Corredor Sul – Cachecóis, pôsteres\n📍 Leste: Corredor Leste – Mini bolas, garrafas\n📍 Oeste: Corredor Oeste – Chaveiros\n\n⭐ Destaque: Camisa 2026 – $89.99',
    de: 'Besuchen Sie unsere Fan-Shops! 🛍️\n📍 Hauptshop: Nordgang – Trikots, Kappen\n📍 Süd-Kiosk: Südgang – Schals, Poster\n📍 Ost: Ostgang – Mini-Bälle, Flaschen\n📍 West: Westgang – Schlüsselanhänger\n\n⭐ Highlight: Trikot 2026 – 89,99$',
  },
  medical: {
    en: 'Medical assistance is available 24/7 during events:\n🏥 Medical Station 1: Near South Concourse (main station)\n👨‍⚕️ Roaming medics are positioned throughout the stadium\n📞 Medical hotline: Dial 333 from any stadium phone\n\n💊 First aid kits are located at every gate and concourse corner\n♿ AED defibrillators are mounted every 100 meters\n\nIf someone is unconscious or having a cardiac event, call for help immediately and an AED will be brought to you.',
    es: 'Asistencia médica disponible 24/7:\n🏥 Estación Médica 1: Cerca del Pasillo Sur\n👨‍⚕️ Médicos itinerantes en todo el estadio\n📞 Línea médica: Marque 333\n\n💊 Botiquines en cada puerta\n♿ Desfibriladores cada 100 metros',
    fr: 'Assistance médicale disponible 24/7 :\n🏥 Station Médicale 1 : Près de la Coursive Sud\n👨‍⚕️ Médecins itinérants dans tout le stade\n📞 Urgence médicale : Composez le 333\n\n💊 Trousses de secours à chaque porte\n♿ DAE tous les 100 mètres',
    ar: 'المساعدة الطبية متوفرة على مدار الساعة:\n🏥 المحطة الطبية 1: بالقرب من الممر الجنوبي\n👨‍⚕️ أطباء متجولون في الملعب\n📞 خط الطوارئ الطبي: اتصل 333\n\n💊 حقائب إسعافات أولية عند كل بوابة\n♿ أجهزة إنعاش كل 100 متر',
    pt: 'Assistência médica disponível 24/7:\n🏥 Estação Médica 1: Perto do Corredor Sul\n👨‍⚕️ Médicos itinerantes pelo estádio\n📞 Linha médica: Disque 333\n\n💊 Kits de primeiros socorros em cada portão\n♿ DEAs a cada 100 metros',
    de: 'Medizinische Hilfe 24/7 verfügbar:\n🏥 Medizinstation 1: Nahe Südgang\n👨‍⚕️ Mobile Sanitäter im gesamten Stadion\n📞 Notruf: 333 wählen\n\n💊 Erste-Hilfe-Kästen an jedem Tor\n♿ AED-Defibrillatoren alle 100 Meter',
  },
  lost_child: {
    en: '🚨 LOST CHILD ALERT: Please stay calm. Here\'s what to do:\n1. Go to the nearest information desk or security point\n2. Tell staff the child\'s name, age, description, and last known location\n3. Security will initiate a Code Adam lockdown of all exits\n4. Announcements will be made on the PA system\n5. All staff have been trained in child recovery procedures\n\n📍 Nearest security: Gate A information desk\n📞 Direct line: Dial 222 from any stadium phone\n\nDo NOT leave your current area — a security team is being dispatched.',
    es: '🚨 ALERTA DE NIÑO PERDIDO: Mantenga la calma.\n1. Vaya al punto de seguridad más cercano\n2. Informe nombre, edad y descripción del niño\n3. Se iniciará un bloqueo de salidas\n4. Se harán anuncios por altavoz\n📞 Línea directa: Marque 222',
    fr: '🚨 ENFANT PERDU : Restez calme.\n1. Allez au point de sécurité le plus proche\n2. Donnez le nom, l\'âge et la description\n3. Un verrouillage des sorties sera initié\n4. Des annonces seront faites\n📞 Ligne directe : 222',
    ar: '🚨 تنبيه طفل مفقود: يرجى التزام الهدوء.\n1. توجه إلى أقرب نقطة أمنية\n2. أخبر الموظفين باسم وعمر ووصف الطفل\n3. سيتم إغلاق جميع المخارج\n4. سيتم عمل إعلانات\n📞 خط مباشر: 222',
    pt: '🚨 ALERTA CRIANÇA PERDIDA: Mantenha a calma.\n1. Vá ao ponto de segurança mais próximo\n2. Informe nome, idade e descrição\n3. Bloqueio de saídas será iniciado\n4. Anúncios serão feitos\n📞 Ligne direta: 222',
    de: '🚨 VERMISSTES KIND: Bleiben Sie ruhig.\n1. Nennen Sie Name, Alter und Beschreibung\n3. Ausgangssperre wird eingeleitet\n4. Durchsagen werden gemacht\n📞 Direktleitung: 222',
  },
  seating: {
    en: 'Based on your ticket profile, your seat is in **Section {zone}**, **{seat}** under the **{ticket_class}** category. 💺\n\nDirections:\n- Enter through the closest gate (Gate A/B).\n- Use the escalators to your seating level.\n- Friendly ushers are standing by the entrance of Section {zone} to check your ticket and guide you to your exact row.',
    es: '¡Puedo ayudarte a encontrar tu asiento! 💺\n\nSecciones 101-104: Nivel inferior\nSecciones 105-108: Nivel superior\nVIP Lounge: Nivel 3\n\nBusca el número de sección en tu entrada. Los acomodadores están en cada sección.',
    fr: 'Je peux vous aider à trouver votre place ! 💺\n\nSections 101-104 : Tribune basse (Niveau 1)\nSections 105-108 : Tribune haute (Niveau 2)\nSalon VIP : Niveau 3\n\nConsultez votre billet pour le numéro de section.',
    ar: 'يمكنني مساعدتك في إيجاد مقعدك! 💺\n\nالأقسام 101-104: المستوى الأول\nالأقسام 105-108: المستوى الثاني\nصالة VIP: المستوى الثالث\n\nابحث عن رقم القسم في تذكرتك.',
    pt: 'Posso ajudar a encontrar seu assento! 💺\n\nSeções 101-104: Nível inferior\nSeções 105-108: Nível superior\nLounge VIP: Nível 3\n\nProcure o número da seção no seu ingresso.',
    de: 'Ich helfe Ihnen, Ihren Platz zu finden! 💺\n\nSektionen 101-104: Unterer Ring (Ebene 1)\nSektionen 105-108: Oberer Ring (Ebene 2)\nVIP-Lounge: Ebene 3\n\nSchauen Sie auf Ihr Ticket für die Sektionsnummer.',
  },
};

const FALLBACK_RESPONSES = {
  en: 'I\'m not sure I understood that. Here are some things I can help with:\n• Navigate the stadium\n• Find food & drinks\n• Parking info\n• Match schedule\n• Restroom locations\n• Merchandise\n• Medical assistance\n• Weather updates\n\nCould you rephrase your question, or type "help" for a full list of options?',
  es: 'No estoy seguro de haber entendido. Escribe "ayuda" para ver las opciones disponibles.',
  fr: 'Je n\'ai pas bien compris. Tapez "aide" para voir les options disponibles.',
  ar: 'لم أفهم جيداً. اكتب "مساعدة" لرؤية الخيارات المتاحة.',
  pt: 'Não tenho certeza se entendi. Digite "ajuda" para ver as opções disponíveis.',
  de: 'Ich bin nicht sicher, ob ich das verstanden habe. Geben Sie "hilfe" ein, um die verfügbaren Optionen zu sehen.',
};

module.exports = {
  RESPONSES,
  FALLBACK_RESPONSES
};
