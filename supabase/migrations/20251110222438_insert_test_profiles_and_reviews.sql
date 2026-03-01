/*
  # Insertion des profils test et reviews

  1. Profils ajoutés
    - Sophie (Paris) - Massage, Domination, Fétichisme - 2 reviews
    - Marie (Lyon) - Naturiste, Tantrique, GFE
    - Léa (Marseille) - Massage, Tantra, Accompagnement - 1 review
    - Emma (Bordeaux) - BDSM, Fétichisme, Domination - 1 review
    - Jade (Nice) - Massage, Yoga, Méditation - 1 review

  2. Données incluses
    - Informations complètes de profil (photos, description, localisation)
    - Informations physiques (âge, taille, poids, mensurations, etc.)
    - Informations personnelles (langues, orientation, origine, etc.)
    - Prestations détaillées
    - Reviews avec ratings et commentaires

  3. Sécurité
    - Les utilisateurs sont créés dans auth.users
    - Les profils respectent les politiques RLS existantes
    - Les reviews sont liées correctement aux profils
*/

-- Insertion des utilisateurs dans auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'sophie@fireroses.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'marie@fireroses.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'lea@fireroses.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'emma@fireroses.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'jade@fireroses.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  -- Utilisateurs pour les reviews
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'alexandre@client.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'pierre@client.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'marc@client.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'sophie_client@client.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'thomas@client.com', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insertion des profils professionnels
INSERT INTO profiles (id, user_id, name, username, description, location, photos, user_type, physical_info, personal_info, prestations, rating)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Sophie',
    'sophie_paris',
    'Passionnée d''art et de voyages ✈️',
    'Paris',
    ARRAY[
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
    ],
    'professional',
    jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Métisse',
      'nationalite', 'Brazilian',
      'age', 27,
      'yeux', 'Marron',
      'taille', '165 cm',
      'poids', '55 Kg',
      'cheveux', 'Roux',
      'mensurations', '90-60-90',
      'poitrine', '90D',
      'bonnet', 'D',
      'tour_poitrine', '90',
      'epilation', 'Entièrement rasée'
    ),
    jsonb_build_object(
      'alcool', 'Occasionnellement',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Anglais', 'Portugais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Franco-brésilienne'
    ),
    'Massage sensuel • Domination soft • Fétichisme • Jeux de rôle • Préliminaires • Câlins • Soirées libertines • Accompagnement événements • Week-end • Dîner en ville',
    4.5
  ),
  (
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'Marie',
    'marie_lyon',
    'Amoureuse de toutes les formes d''expression artistique 🎶',
    'Lyon',
    ARRAY[
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
      'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=400'
    ],
    'professional',
    jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Caucasienne',
      'nationalite', 'Française',
      'age', 24,
      'yeux', 'Marron',
      'taille', '170 cm',
      'poids', '58 kg',
      'cheveux', 'Châtain',
      'mensurations', '85-60-90',
      'poitrine', '85C',
      'bonnet', 'C',
      'tour_poitrine', '85',
      'epilation', 'Entièrement rasée'
    ),
    jsonb_build_object(
      'alcool', 'Non',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Française'
    ),
    'Massage naturiste • Préliminaires • Soirées privées • Dîner romantique • Week-end détente • Jeux de rôle • Fétichisme des pieds • Domination soft • Accompagnement événements',
    4.2
  ),
  (
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    'Léa',
    'lea_marseille',
    'Danseuse professionnelle et masseuse certifiée 💃',
    'Marseille',
    ARRAY[
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
    ],
    'professional',
    jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Méditerranéenne',
      'nationalite', 'Italienne',
      'age', 26,
      'yeux', 'Verts',
      'taille', '168 cm',
      'poids', '54 kg',
      'cheveux', 'Noir',
      'mensurations', '88-58-89',
      'poitrine', '88C',
      'bonnet', 'C',
      'tour_poitrine', '88',
      'epilation', 'Naturelle'
    ),
    jsonb_build_object(
      'alcool', 'Social',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Italien', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Italienne'
    ),
    'Massage tantrique • Danse privée • Accompagnement VIP • Dîner en ville • Week-end détente • Voyages • Événements mondains',
    4.8
  ),
  (
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    'Emma',
    'emma_bordeaux',
    'Maîtresse expérimentée, stricte mais juste 👠',
    'Bordeaux',
    ARRAY[
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400'
    ],
    'professional',
    jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Caucasienne',
      'nationalite', 'Française',
      'age', 29,
      'yeux', 'Bleus',
      'taille', '175 cm',
      'poids', '60 kg',
      'cheveux', 'Blond',
      'mensurations', '92-62-91',
      'poitrine', '92D',
      'bonnet', 'D',
      'tour_poitrine', '92',
      'epilation', 'Entretenue'
    ),
    jsonb_build_object(
      'alcool', 'Occasionnellement',
      'fumeur', 'Social',
      'langues', ARRAY['Français', 'Anglais', 'Allemand'],
      'orientation', 'Bisexuelle',
      'origine', 'Franco-allemande'
    ),
    'Domination • BDSM • Fétichisme • Jeux de rôle • Education • Initiation • Soirées privées • Sessions personnalisées',
    4.9
  ),
  (
    'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
    'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
    'Jade',
    'jade_nice',
    'Professeure de yoga et masseuse holistique 🧘‍♀️',
    'Nice',
    ARRAY[
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1526080652727-5b77f74eacd2?w=400',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400'
    ],
    'professional',
    jsonb_build_object(
      'sexe', 'Femme',
      'ethnique', 'Asiatique',
      'nationalite', 'Franco-vietnamienne',
      'age', 25,
      'yeux', 'Marron',
      'taille', '162 cm',
      'poids', '50 kg',
      'cheveux', 'Noir',
      'mensurations', '84-58-86',
      'poitrine', '84B',
      'bonnet', 'B',
      'tour_poitrine', '84',
      'epilation', 'Naturelle'
    ),
    jsonb_build_object(
      'alcool', 'Non',
      'fumeur', 'Non',
      'langues', ARRAY['Français', 'Vietnamien', 'Anglais'],
      'orientation', 'Hétérosexuelle',
      'origine', 'Vietnamienne'
    ),
    'Massage tantrique • Yoga privé • Méditation guidée • Massage thaï • Réflexologie • Aromathérapie • Séances de bien-être',
    4.7
  )
ON CONFLICT (id) DO NOTHING;

-- Insertion des profils clients (pour les reviews)
INSERT INTO profiles (id, user_id, name, username, user_type, location, photos)
VALUES
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Alexandre', 'alexandre_client', 'client', 'Paris', ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400']),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Pierre', 'pierre_client', 'client', 'Paris', ARRAY['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400']),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Marc', 'marc_client', 'client', 'Marseille', ARRAY['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400']),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Sophie C.', 'sophie_client', 'client', 'Bordeaux', ARRAY['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400']),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'd0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Thomas', 'thomas_client', 'client', 'Nice', ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'])
ON CONFLICT (id) DO NOTHING;

-- Insertion des reviews
INSERT INTO reviews (from_user_id, to_user_id, rating, comment, created_at)
VALUES
  -- Reviews pour Sophie
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 5, 'Une expérience inoubliable. Sophie est une personne extraordinaire, à l''écoute et très professionnelle.', '2024-01-15'),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 4, 'Très agréable moment passé ensemble. Je recommande vivement.', '2024-01-10'),
  
  -- Review pour Léa
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 5, 'Une présence exceptionnelle. Léa est une personne raffinée avec qui j''ai passé une soirée mémorable.', '2024-02-01'),
  
  -- Review pour Emma
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 5, 'Emma est une dominatrice exceptionnelle. Son professionnalisme et son attention aux détails sont remarquables.', '2024-02-10'),
  
  -- Review pour Jade
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 5, 'Une expérience unique et apaisante. Jade a des mains en or et une énergie incroyable.', '2024-02-15');
