// Codes postaux par département
export const departmentCodes: Record<string, string> = {
  'Paris': '75',
  'Seine-et-Marne': '77',
  'Yvelines': '78',
  'Hauts-de-Seine': '92',
  'Seine-Saint-Denis': '93',
  'Val-de-Marne': '94',
  'Val-d\'Oise': '95',
  'Essonne': '91',
  'Rhône': '69',
  'Isère': '38',
  'Loire': '42',
  'Haute-Savoie': '74',
  'Puy-de-Dôme': '63',
  'Ain': '01',
  'Bouches-du-Rhône': '13',
  'Alpes-Maritimes': '06',
  'Var': '83',
  'Vaucluse': '84',
  'Haute-Garonne': '31',
  'Hérault': '34',
  'Gard': '30',
  'Gironde': '33',
  'Pyrénées-Atlantiques': '64',
  'Charente-Maritime': '17',
  'Vienne': '86',
  'Nord': '59',
  'Pas-de-Calais': '62',
  'Somme': '80',
  'Oise': '60',
  'Bas-Rhin': '67',
  'Haut-Rhin': '68',
  'Moselle': '57',
  'Meurthe-et-Moselle': '54',
  'Ille-et-Vilaine': '35',
  'Finistère': '29',
  'Morbihan': '56',
  'Côtes-d\'Armor': '22',
  'Loire-Atlantique': '44',
  'Maine-et-Loire': '49',
  'Vendée': '85',
  'Sarthe': '72',
  'Seine-Maritime': '76',
  'Calvados': '14',
  'Manche': '50',
  'Eure': '27',
  'Côte-d\'Or': '21',
  'Doubs': '25',
  'Saône-et-Loire': '71',
  'Yonne': '89',
  'Indre-et-Loire': '37',
  'Loiret': '45',
  'Loir-et-Cher': '41',
  'Cher': '18',
  'Corse-du-Sud': '2A',
  'Haute-Corse': '2B'
};

// Arrondissements des grandes villes
export const cityArrondissements: Record<string, string[]> = {
  'Paris': [
    'Paris 1er', 'Paris 2e', 'Paris 3e', 'Paris 4e', 'Paris 5e',
    'Paris 6e', 'Paris 7e', 'Paris 8e', 'Paris 9e', 'Paris 10e',
    'Paris 11e', 'Paris 12e', 'Paris 13e', 'Paris 14e', 'Paris 15e',
    'Paris 16e', 'Paris 17e', 'Paris 18e', 'Paris 19e', 'Paris 20e'
  ],
  'Lyon': [
    'Lyon 1er', 'Lyon 2e', 'Lyon 3e', 'Lyon 4e', 'Lyon 5e',
    'Lyon 6e', 'Lyon 7e', 'Lyon 8e', 'Lyon 9e'
  ],
  'Marseille': [
    'Marseille 1er', 'Marseille 2e', 'Marseille 3e', 'Marseille 4e',
    'Marseille 5e', 'Marseille 6e', 'Marseille 7e', 'Marseille 8e',
    'Marseille 9e', 'Marseille 10e', 'Marseille 11e', 'Marseille 12e',
    'Marseille 13e', 'Marseille 14e', 'Marseille 15e', 'Marseille 16e'
  ]
};

export const regions = {
  'Île-de-France': {
    'Paris': ['Paris'],
    'Seine-et-Marne': ['Melun', 'Meaux', 'Fontainebleau', 'Chelles', 'Pontault-Combault', 'Savigny-le-Temple', 'Torcy', 'Lagny-sur-Marne', 'Provins', 'Coulommiers', 'Ozoir-la-Ferrière', 'Roissy-en-Brie', 'Combs-la-Ville', 'Noisiel', 'Villeparisis', 'Mitry-Mory', 'Dammarie-les-Lys', 'Vaires-sur-Marne', 'Claye-Souilly', 'Brie-Comte-Robert'],
    'Yvelines': [
      'Versailles', 'Saint-Germain-en-Laye', 'Mantes-la-Jolie', 'Rambouillet', 'Poissy', 'Sartrouville', 
      'Conflans-Sainte-Honorine', 'Plaisir', 'Montigny-le-Bretonneux', 'Houilles', 'Les Mureaux', 'Élancourt', 
      'Trappes', 'Chatou', 'Vélizy-Villacoublay', 'Le Chesnay-Rocquencourt', 'Saint-Cyr-l\'École', 'Guyancourt', 
      'Marly-le-Roi', 'Carrières-sous-Poissy', 'Maisons-Laffitte', 'La Celle-Saint-Cloud', 'Chanteloup-les-Vignes',
      'Limay', 'Achères', 'Verneuil-sur-Seine', 'Viroflay', 'Carrières-sur-Seine', 'Fontenay-le-Fleury',
      'Bonnières-sur-Seine', 'Bois-d\'Arcy', 'Maurepas', 'Voisins-le-Bretonneux', 'Le Pecq', 'Villennes-sur-Seine',
      'Le Vésinet', 'Montesson', 'Croissy-sur-Seine', 'Andrésy', 'Magny-les-Hameaux'
    ],
    'Hauts-de-Seine': [
      'Nanterre', 'Boulogne-Billancourt', 'Courbevoie', 'Colombes', 'Asnières-sur-Seine', 'Rueil-Malmaison', 
      'Levallois-Perret', 'Neuilly-sur-Seine', 'Antony', 'Issy-les-Moulineaux', 'Clichy', 'Montrouge', 
      'Bagneux', 'Suresnes', 'Puteaux', 'Gennevilliers', 'Châtenay-Malabry', 'Vanves', 'Malakoff', 'Clamart',
      'Meudon', 'La Garenne-Colombes', 'Bois-Colombes', 'Châtillon', 'Sèvres', 'Le Plessis-Robinson',
      'Fontenay-aux-Roses', 'Villeneuve-la-Garenne', 'Sceaux', 'Bourg-la-Reine', 'Saint-Cloud', 'Garches',
      'Chaville', 'Vaucresson', 'Marnes-la-Coquette'
    ],
    'Seine-Saint-Denis': ['Bobigny', 'Saint-Denis', 'Montreuil', 'Aubervilliers', 'Aulnay-sous-Bois', 'Drancy', 'Noisy-le-Grand', 'Pantin', 'Le Blanc-Mesnil', 'Bondy', 'Saint-Ouen', 'Épinay-sur-Seine', 'La Courneuve', 'Sevran', 'Livry-Gargan', 'Rosny-sous-Bois', 'Gagny', 'Villepinte', 'Stains', 'Neuilly-sur-Marne'],
    'Val-de-Marne': ['Créteil', 'Vincennes', 'Vitry-sur-Seine', 'Saint-Maur-des-Fossés', 'Champigny-sur-Marne', 'Ivry-sur-Seine', 'Villejuif', 'Maisons-Alfort', 'Fontenay-sous-Bois', 'Le Kremlin-Bicêtre', 'Nogent-sur-Marne', 'Choisy-le-Roi', 'Villeneuve-Saint-Georges', 'L\'Haÿ-les-Roses', 'Cachan', 'Alfortville', 'Saint-Mandé', 'Charenton-le-Pont', 'Thiais', 'Orly'],
    'Val-d\'Oise': ['Cergy', 'Argenteuil', 'Sarcelles', 'Garges-lès-Gonesse', 'Gonesse', 'Ermont', 'Franconville', 'Goussainville', 'Pontoise', 'Herblay', 'Bezons', 'Montigny-lès-Cormeilles', 'Villiers-le-Bel', 'Taverny', 'Saint-Gratien', 'Eaubonne', 'Sannois', 'Deuil-la-Barre', 'Montmorency', 'Cormeilles-en-Parisis', 'Saint-Leu-la-Forêt', 'Soisy-sous-Montmorency', 'Saint-Brice-sous-Forêt', 'Domont', 'Eragny', 'Arnouville', 'Beaumont-sur-Oise', 'L\'Isle-Adam', 'Montmagny', 'Enghien-les-Bains']
  },
  'Auvergne-Rhône-Alpes': {
    'Rhône': ['Lyon', 'Villeurbanne', 'Vénissieux', 'Vaulx-en-Velin', 'Saint-Priest', 'Caluire-et-Cuire', 'Bron', 'Meyzieu', 'Oullins', 'Décines-Charpieu'],
    'Isère': ['Grenoble', 'Vienne', 'Saint-Martin-d\'Hères', 'Échirolles', 'Fontaine', 'Voiron', 'Bourgoin-Jallieu', 'Saint-Égrève', 'Seyssinet-Pariset', 'Meylan'],
    'Loire': ['Saint-Étienne', 'Roanne', 'Saint-Chamond', 'Firminy', 'Montbrison', 'Rive-de-Gier', 'Andrézieux-Bouthéon', 'Le Chambon-Feugerolles', 'Saint-Just-Saint-Rambert', 'Riorges'],
    'Haute-Savoie': ['Annecy', 'Thonon-les-Bains', 'Annemasse', 'Cluses', 'Sallanches', 'Rumilly', 'Bonneville', 'Seynod', 'Cran-Gevrier', 'Ville-la-Grand'],
    'Puy-de-Dôme': ['Clermont-Ferrand', 'Riom', 'Cournon-d\'Auvergne', 'Chamalières', 'Thiers', 'Beaumont', 'Issoire', 'Pont-du-Château', 'Gerzat', 'Aubière'],
    'Ain': ['Bourg-en-Bresse', 'Oyonnax', 'Ambérieu-en-Bugey', 'Saint-Genis-Pouilly', 'Bellegarde-sur-Valserine', 'Miribel', 'Ferney-Voltaire', 'Gex', 'Meximieux', 'Péronnas']
  },
  'Provence-Alpes-Côte d\'Azur': {
    'Bouches-du-Rhône': ['Marseille', 'Aix-en-Provence', 'Martigues', 'Aubagne', 'Istres', 'Salon-de-Provence', 'Vitrolles', 'Marignane', 'La Ciotat', 'Miramas'],
    'Alpes-Maritimes': ['Nice', 'Cannes', 'Antibes', 'Grasse', 'Cagnes-sur-Mer', 'Saint-Laurent-du-Var', 'Vallauris', 'Menton', 'Le Cannet', 'Vence'],
    'Var': ['Toulon', 'Saint-Tropez', 'La Seyne-sur-Mer', 'Hyères', 'Fréjus', 'Saint-Raphaël', 'Draguignan', 'La Garde', 'Six-Fours-les-Plages', 'La Valette-du-Var'],
    'Vaucluse': ['Avignon', 'Orange', 'Carpentras', 'Cavaillon', 'Sorgues', 'L\'Isle-sur-la-Sorgue', 'Le Pontet', 'Apt', 'Bollène', 'Monteux']
  },
  'Occitanie': {
    'Haute-Garonne': ['Toulouse', 'Blagnac', 'Colomiers', 'Tournefeuille', 'Muret', 'Cugnaux', 'Balma', 'Saint-Orens-de-Gameville', 'Plaisance-du-Touch', 'L\'Union'],
    'Hérault': ['Montpellier', 'Béziers', 'Sète', 'Lunel', 'Agde', 'Frontignan', 'Lattes', 'Mauguio', 'Castelnau-le-Lez', 'Saint-Jean-de-Védas'],
    'Gard': ['Nîmes', 'Alès', 'Bagnols-sur-Cèze', 'Beaucaire', 'Saint-Gilles', 'Villeneuve-lès-Avignon', 'Vauvert', 'Le Grau-du-Roi', 'Pont-Saint-Esprit', 'Marguerittes']
  },
  'Nouvelle-Aquitaine': {
    'Gironde': ['Bordeaux', 'Arcachon', 'Mérignac', 'Pessac', 'Talence', 'Villenave-d\'Ornon', 'Saint-Médard-en-Jalles', 'Bègles', 'Gradignan', 'La Teste-de-Buch'],
    'Pyrénées-Atlantiques': ['Pau', 'Biarritz', 'Bayonne', 'Anglet', 'Saint-Jean-de-Luz', 'Hendaye', 'Oloron-Sainte-Marie', 'Orthez', 'Mourenx', 'Lescar'],
    'Charente-Maritime': ['La Rochelle', 'Royan', 'Saintes', 'Rochefort', 'Saint-Jean-d\'Angély', 'Tonnay-Charente', 'Aytré', 'Lagord', 'Périgny', 'Saint-Pierre-d\'Oléron'],
    'Vienne': ['Poitiers', 'Châtellerault', 'Buxerolles', 'Loudun', 'Jaunay-Marigny', 'Migné-Auxances', 'Chauvigny', 'Montmorillon', 'Vouillé', 'Neuville-de-Poitou']
  },
  'Hauts-de-France': {
    'Nord': ['Lille', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Valenciennes', 'Douai', 'Cambrai', 'Wattrelos', 'Maubeuge', 'Armentières'],
    'Pas-de-Calais': ['Arras', 'Calais', 'Boulogne-sur-Mer', 'Lens', 'Liévin', 'Béthune', 'Bruay-la-Buissière', 'Hénin-Beaumont', 'Saint-Omer', 'Carvin'],
    'Somme': ['Amiens', 'Abbeville', 'Albert', 'Péronne', 'Corbie', 'Doullens', 'Ham', 'Roye', 'Montdidier', 'Moreuil'],
    'Oise': ['Beauvais', 'Compiègne', 'Creil', 'Senlis', 'Noyon', 'Pont-Sainte-Maxence', 'Méru', 'Clermont', 'Chantilly', 'Montataire']
  },
  'Grand Est': {
    'Bas-Rhin': ['Strasbourg', 'Haguenau', 'Schiltigheim', 'Illkirch-Graffenstaden', 'Sélestat', 'Bischheim', 'Lingolsheim', 'Ostwald', 'Saverne', 'Obernai'],
    'Haut-Rhin': ['Colmar', 'Mulhouse', 'Saint-Louis', 'Wittenheim', 'Illzach', 'Guebwiller', 'Kingersheim', 'Riedisheim', 'Wittelsheim', 'Thann'],
    'Moselle': ['Metz', 'Thionville', 'Forbach', 'Sarreguemines', 'Montigny-lès-Metz', 'Hagondange', 'Woippy', 'Saint-Avold', 'Yutz', 'Hayange'],
    'Meurthe-et-Moselle': ['Nancy', 'Vandœuvre-lès-Nancy', 'Lunéville', 'Toul', 'Pont-à-Mousson', 'Villers-lès-Nancy', 'Laxou', 'Jarville-la-Malgrange', 'Saint-Max', 'Longwy']
  },
  'Bretagne': {
    'Ille-et-Vilaine': ['Rennes', 'Saint-Malo', 'Fougères', 'Vitré', 'Bruz', 'Cesson-Sévigné', 'Betton', 'Pacé', 'Chantepie', 'Dinard'],
    'Finistère': ['Brest', 'Quimper', 'Concarneau', 'Morlaix', 'Douarnenez', 'Plougastel-Daoulas', 'Landerneau', 'Guipavas', 'Plouzané', 'Carhaix-Plouguer'],
    'Morbihan': ['Vannes', 'Lorient', 'Lanester', 'Ploemeur', 'Pontivy', 'Hennebont', 'Auray', 'Guidel', 'Séné', 'Quéven'],
    'Côtes-d\'Armor': ['Saint-Brieuc', 'Lannion', 'Dinan', 'Plérin', 'Lamballe', 'Ploufragan', 'Trégueux', 'Loudéac', 'Langueux', 'Paimpol']
  },
  'Pays de la Loire': {
    'Loire-Atlantique': ['Nantes', 'Saint-Nazaire', 'Saint-Herblain', 'Rezé', 'Saint-Sébastien-sur-Loire', 'Orvault', 'Vertou', 'Carquefou', 'La Chapelle-sur-Erdre', 'Couëron'],
    'Maine-et-Loire': ['Angers', 'Cholet', 'Saumur', 'Avrillé', 'Les Ponts-de-Cé', 'Saint-Barthélemy-d\'Anjou', 'Trélazé', 'Beaucouzé', 'Montreuil-Juigné', 'Segré'],
    'Vendée': ['La Roche-sur-Yon', 'Les Sables-d\'Olonne', 'Challans', 'Fontenay-le-Comte', 'Luçon', 'Saint-Hilaire-de-Riez', 'Les Herbiers', 'Château-d\'Olonne', 'Montaigu', 'Olonne-sur-Mer'],
    'Sarthe': ['Le Mans', 'La Flèche', 'Sablé-sur-Sarthe', 'Allonnes', 'Coulaines', 'La Ferté-Bernard', 'Arnage', 'Château-du-Loir', 'Mamers', 'Saint-Calais']
  },
  'Normandie': {
    'Seine-Maritime': ['Rouen', 'Le Havre', 'Dieppe', 'Sotteville-lès-Rouen', 'Saint-Étienne-du-Rouvray', 'Le Grand-Quevilly', 'Le Petit-Quevilly', 'Mont-Saint-Aignan', 'Fécamp', 'Elbeuf'],
    'Calvados': ['Caen', 'Deauville', 'Lisieux', 'Hérouville-Saint-Clair', 'Bayeux', 'Vire', 'Ifs', 'Mondeville', 'Ouistreham', 'Falaise'],
    'Manche': ['Cherbourg', 'Saint-Lô', 'Granville', 'Avranches', 'Coutances', 'Équeurdreville-Hainneville', 'Tourlaville', 'Saint-Hilaire-du-Harcouët', 'Carentan', 'Valognes'],
    'Eure': ['Évreux', 'Vernon', 'Louviers', 'Val-de-Reuil', 'Pont-Audemer', 'Bernay', 'Gisors', 'Les Andelys', 'Gaillon', 'Le Neubourg']
  },
  'Bourgogne-Franche-Comté': {
    'Côte-d\'Or': ['Dijon', 'Beaune', 'Chenôve', 'Talant', 'Chevigny-Saint-Sauveur', 'Quetigny', 'Fontaine-lès-Dijon', 'Nuits-Saint-Georges', 'Châtillon-sur-Seine', 'Auxonne'],
    'Doubs': ['Besançon', 'Montbéliard', 'Pontarlier', 'Morteau', 'Audincourt', 'Valentigney', 'Bethoncourt', 'Bavans', 'Mandeure', 'Grand-Charmont'],
    'Saône-et-Loire': ['Mâcon', 'Chalon-sur-Saône', 'Le Creusot', 'Montceau-les-Mines', 'Autun', 'Paray-le-Monial', 'Gueugnon', 'Digoin', 'Tournus', 'Louhans'],
    'Yonne': ['Auxerre', 'Sens', 'Joigny', 'Avallon', 'Saint-Florentin', 'Migennes', 'Tonnerre', 'Villeneuve-sur-Yonne', 'Saint-Georges-sur-Baulche', 'Paron']
  },
  'Centre-Val de Loire': {
    'Indre-et-Loire': ['Tours', 'Joué-lès-Tours', 'Saint-Pierre-des-Corps', 'Saint-Cyr-sur-Loire', 'Saint-Avertin', 'Amboise', 'Chambray-lès-Tours', 'La Riche', 'Fondettes', 'Montlouis-sur-Loire'],
    'Loiret': ['Orléans', 'Montargis', 'Fleury-les-Aubrais', 'Saint-Jean-de-Braye', 'Olivet', 'Saint-Jean-de-la-Ruelle', 'Saran', 'Gien', 'Châlette-sur-Loing', 'Amilly'],
    'Loir-et-Cher': ['Blois', 'Vendôme', 'Romorantin-Lanthenay', 'Saint-Gervais-la-Forêt', 'Vineuil', 'Saint-Laurent-Nouan', 'La Chaussée-Saint-Victor', 'Mer', 'Montrichard', 'Salbris'],
    'Cher': ['Bourges', 'Vierzon', 'Saint-Amand-Montrond', 'Saint-Doulchard', 'Saint-Germain-du-Puy', 'Mehun-sur-Yèvre', 'Saint-Florent-sur-Cher', 'Aubigny-sur-Nère', 'Dun-sur-Auron', 'La Guerche-sur-l\'Aubois']
  },
  'Corse': {
    'Corse-du-Sud': ['Ajaccio', 'Porto-Vecchio', 'Propriano', 'Sartène', 'Bonifacio', 'Grosseto-Prugna', 'Cargèse', 'Piana', 'Olmeto', 'Serra-di-Ferro'],
    'Haute-Corse': ['Bastia', 'Calvi', 'Corte', 'L\'Île-Rousse', 'Ghisonaccia', 'Prunelli-di-Fiumorbo', 'Borgo', 'Biguglia', 'Lucciana', 'Saint-Florent']
  }
} as const;

export type Region = keyof typeof regions;
export type Department<R extends Region> = keyof typeof regions[R];
export type City<R extends Region, D extends Department<R>> = typeof regions[R][D][number];