/*
  # Ajout de profils professionnels et publications

  1. Nouveaux Profils
    - Ajout de 10 nouveaux profils professionnels
    - Chaque profil a des informations détaillées
    - Configuration des informations physiques et personnelles

  2. Publications
    - Ajout de publications pour chaque profil
    - Configuration des tags, descriptions et photos
    - Ajout de métadonnées (date, localisation)

  3. Sécurité
    - Les politiques RLS existantes s'appliquent automatiquement
*/

-- Insertion des profils professionnels
INSERT INTO auth.users (id, email)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'clara@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'julia@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0853', 'sarah@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0854', 'emma@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0855', 'laura@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0856', 'alice@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0857', 'nina@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0858', 'sofia@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0859', 'victoria@example.com'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0860', 'elena@example.com');

-- Insertion des profils détaillés
INSERT INTO public.profiles (
  id, name, first_name, last_name, username, location, description,
  interests, photos, physical_info, personal_info, prestations, user_type, phone
)
VALUES
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'Clara',
    'Clara',
    'Martin',
    'clara_paris',
    'Paris',
    'Masseuse professionnelle certifiée, spécialisée dans les massages tantriques et la relaxation profonde',
    ARRAY['Massage', 'Tantra', 'Bien-être'],
    ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 28, "yeux": "Verts", "taille": "170 cm", "poids": "55 kg", "cheveux": "Blond", "mensurations": "90-60-90"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Française"}',
    'Massage tantrique • Massage californien • Réflexologie • Massage aux pierres chaudes',
    'pro',
    '+33612345678'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    'Julia',
    'Julia',
    'Bernard',
    'julia_lyon',
    'Lyon',
    'Danseuse et performeuse, je propose des shows privés et des accompagnements VIP',
    ARRAY['Danse', 'Performance', 'Accompagnement'],
    ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
    '{"sexe": "Femme", "ethnique": "Méditerranéenne", "nationalite": "Française", "age": 25, "yeux": "Marron", "taille": "168 cm", "poids": "52 kg", "cheveux": "Brun", "mensurations": "85-60-90"}',
    '{"alcool": "Social", "fumeur": "Non", "langues": ["Français", "Espagnol"], "orientation": "Bisexuelle", "origine": "Franco-espagnole"}',
    'Shows privés • Accompagnement événements • Dîner en ville • Week-end',
    'pro',
    '+33623456789'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0853',
    'Sarah',
    'Sarah',
    'Dubois',
    'sarah_marseille',
    'Marseille',
    'Modèle photo professionnelle, disponible pour séances photos et accompagnements',
    ARRAY['Photo', 'Mode', 'Art'],
    ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 27, "yeux": "Bleus", "taille": "175 cm", "poids": "58 kg", "cheveux": "Châtain", "mensurations": "88-62-92"}',
    '{"alcool": "Occasionnellement", "fumeur": "Non", "langues": ["Français", "Anglais", "Italien"], "orientation": "Hétérosexuelle", "origine": "Française"}',
    'Séances photo • Accompagnement événements • Soirées • Week-end',
    'pro',
    '+33634567890'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    'Emma',
    'Emma',
    'Petit',
    'emma_bordeaux',
    'Bordeaux',
    'Experte en massages holistiques et thérapie tantrique',
    ARRAY['Massage', 'Tantra', 'Thérapie'],
    ARRAY['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 30, "yeux": "Noisette", "taille": "165 cm", "poids": "54 kg", "cheveux": "Roux", "mensurations": "86-58-88"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Française"}',
    'Massage tantrique • Thérapie corporelle • Massage sensuel • Coaching bien-être',
    'pro',
    '+33645678901'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0855',
    'Laura',
    'Laura',
    'Moreau',
    'laura_nice',
    'Nice',
    'Professeure de yoga et masseuse ayurvédique, spécialisée dans le bien-être holistique',
    ARRAY['Yoga', 'Massage', 'Méditation'],
    ARRAY['https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 29, "yeux": "Verts", "taille": "172 cm", "poids": "56 kg", "cheveux": "Blond", "mensurations": "87-60-89"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Anglais", "Hindi"], "orientation": "Hétérosexuelle", "origine": "Française"}',
    'Yoga privé • Massage ayurvédique • Méditation guidée • Coaching bien-être',
    'pro',
    '+33656789012'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0856',
    'Alice',
    'Alice',
    'Leroy',
    'alice_toulouse',
    'Toulouse',
    'Artiste et performeuse, spécialisée dans les shows burlesque et l''accompagnement VIP',
    ARRAY['Danse', 'Art', 'Performance'],
    ARRAY['https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 26, "yeux": "Bleus", "taille": "169 cm", "poids": "53 kg", "cheveux": "Noir", "mensurations": "89-61-90"}',
    '{"alcool": "Social", "fumeur": "Occasionnellement", "langues": ["Français", "Anglais"], "orientation": "Bisexuelle", "origine": "Française"}',
    'Shows privés • Performances artistiques • Accompagnement événements • Soirées',
    'pro',
    '+33667890123'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0857',
    'Nina',
    'Nina',
    'Simon',
    'nina_nantes',
    'Nantes',
    'Danseuse contemporaine et professeure de pole dance, disponible pour cours privés',
    ARRAY['Danse', 'Sport', 'Art'],
    ARRAY['https://images.unsplash.com/photo-1526080652727-5b77f74eacd2?w=400'],
    '{"sexe": "Femme", "ethnique": "Métisse", "nationalite": "Française", "age": 27, "yeux": "Marron", "taille": "171 cm", "poids": "54 kg", "cheveux": "Brun", "mensurations": "86-59-88"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Anglais", "Portugais"], "orientation": "Hétérosexuelle", "origine": "Franco-brésilienne"}',
    'Cours de danse • Shows privés • Coaching sportif • Accompagnement',
    'pro',
    '+33678901234'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0858',
    'Sofia',
    'Sofia',
    'Garcia',
    'sofia_lille',
    'Lille',
    'Masseuse professionnelle spécialisée dans les massages relaxants et énergétiques',
    ARRAY['Massage', 'Bien-être', 'Relaxation'],
    ARRAY['https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400'],
    '{"sexe": "Femme", "ethnique": "Méditerranéenne", "nationalite": "Espagnole", "age": 28, "yeux": "Marron", "taille": "167 cm", "poids": "52 kg", "cheveux": "Brun", "mensurations": "85-58-87"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Espagnol", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Espagnole"}',
    'Massage relaxant • Massage énergétique • Réflexologie • Aromathérapie',
    'pro',
    '+33689012345'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0859',
    'Victoria',
    'Victoria',
    'Lefebvre',
    'victoria_strasbourg',
    'Strasbourg',
    'Mannequin internationale, disponible pour shooting photos et accompagnements haut de gamme',
    ARRAY['Mode', 'Luxe', 'Voyage'],
    ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
    '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 26, "yeux": "Verts", "taille": "178 cm", "poids": "58 kg", "cheveux": "Blond", "mensurations": "90-61-91"}',
    '{"alcool": "Social", "fumeur": "Non", "langues": ["Français", "Anglais", "Allemand"], "orientation": "Hétérosexuelle", "origine": "Française"}',
    'Shooting photo • Accompagnement luxe • Événements VIP • Week-end',
    'pro',
    '+33690123456'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0860',
    'Elena',
    'Elena',
    'Kovac',
    'elena_montpellier',
    'Montpellier',
    'Danseuse classique et professeure de yoga, spécialisée dans le bien-être corporel',
    ARRAY['Danse', 'Yoga', 'Bien-être'],
    ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'],
    '{"sexe": "Femme", "ethnique": "Slave", "nationalite": "Russe", "age": 25, "yeux": "Bleus", "taille": "170 cm", "poids": "52 kg", "cheveux": "Blond", "mensurations": "84-58-86"}',
    '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Russe", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Russe"}',
    'Cours de danse • Yoga privé • Coaching bien-être • Accompagnement',
    'pro',
    '+33601234567'
  );

-- Insertion des publications
INSERT INTO public.posts (
  user_id, caption, location, tags, photos, created_at
)
VALUES
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'Découvrez mes massages tantriques pour une relaxation profonde',
    'Paris',
    ARRAY['Massage', 'Tantra', 'Bien-être'],
    ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'],
    NOW() - INTERVAL '2 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    'Show privé et accompagnement VIP disponibles',
    'Lyon',
    ARRAY['Danse', 'Performance', 'VIP'],
    ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 'https://images.unsplash.com/photo-1533468432434-200de3b5d528?w=400'],
    NOW() - INTERVAL '3 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0853',
    'Séance photo artistique et accompagnement événementiel',
    'Marseille',
    ARRAY['Photo', 'Art', 'Événement'],
    ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400'],
    NOW() - INTERVAL '4 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    'Massage holistique et thérapie corporelle personnalisée',
    'Bordeaux',
    ARRAY['Massage', 'Thérapie', 'Bien-être'],
    ARRAY['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'],
    NOW() - INTERVAL '5 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0855',
    'Séance de yoga et massage ayurvédique',
    'Nice',
    ARRAY['Yoga', 'Massage', 'Ayurveda'],
    ARRAY['https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'],
    NOW() - INTERVAL '6 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0856',
    'Performance burlesque et show artistique',
    'Toulouse',
    ARRAY['Burlesque', 'Art', 'Show'],
    ARRAY['https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400', 'https://images.unsplash.com/photo-1533468432434-200de3b5d528?w=400'],
    NOW() - INTERVAL '7 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0857',
    'Cours privé de pole dance et danse contemporaine',
    'Nantes',
    ARRAY['Danse', 'Sport', 'Coaching'],
    ARRAY['https://images.unsplash.com/photo-1526080652727-5b77f74eacd2?w=400', 'https://images.unsplash.com/photo-1533468432434-200de3b5d528?w=400'],
    NOW() - INTERVAL '8 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0858',
    'Massage relaxant et énergétique personnalisé',
    'Lille',
    ARRAY['Massage', 'Énergie', 'Relaxation'],
    ARRAY['https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400'],
    NOW() - INTERVAL '9 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0859',
    'Shooting photo professionnel et accompagnement luxe',
    'Strasbourg',
    ARRAY['Photo', 'Luxe', 'Mode'],
    ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400'],
    NOW() - INTERVAL '10 days'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0860',
    'Cours de danse classique et séance de yoga privée',
    'Montpellier',
    ARRAY['Danse', 'Yoga', 'Coaching'],
    ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', 'https://images.unsplash.com/photo-1533468432434-200de3b5d528?w=400'],
    NOW() - INTERVAL '11 days'
  );