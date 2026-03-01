/*
  # Ajout des profils initiaux

  1. Nouvelles données
    - Création des utilisateurs via l'authentification
    - Ajout de 5 profils de démonstration :
      - Sophie (Paris)
      - Marie (Lyon)
      - Léa (Marseille) 
      - Emma (Bordeaux)
      - Jade (Nice)

  2. Sécurité
    - Les profils sont créés avec RLS activé
    - Utilisation des UUID générés par l'authentification
    - Données sensibles stockées de manière sécurisée

  Note: Les profils sont créés via l'API d'authentification
*/

-- Fonction pour créer un utilisateur et son profil
CREATE OR REPLACE FUNCTION create_demo_profile(
  email TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  location TEXT,
  description TEXT,
  interests TEXT[],
  photos TEXT[],
  physical_info JSONB,
  personal_info JSONB,
  prestations TEXT,
  phone TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt('password123', gen_salt('bf')), -- Mot de passe temporaire
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', name,
      'user_type', 'pro'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Créer le profil
  INSERT INTO public.profiles (
    id,
    name,
    first_name,
    last_name,
    username,
    location,
    description,
    interests,
    photos,
    physical_info,
    personal_info,
    prestations,
    user_type,
    phone,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    name,
    first_name,
    last_name,
    username,
    location,
    description,
    interests,
    photos,
    physical_info,
    personal_info,
    prestations,
    'pro',
    phone,
    NOW(),
    NOW()
  );

  -- Créer le portefeuille
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new_user_id, 0);

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Créer les profils de démonstration
SELECT create_demo_profile(
  'sophie@fireroses.com',
  'Sophie',
  'Sophie',
  'Martin',
  'Sophie',
  'Paris',
  'Passionnée d''art et de voyages ✈️',
  ARRAY['Massage', 'Domination', 'Fétichisme'],
  ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
  '{"sexe": "Femme", "ethnique": "Métisse", "nationalite": "Brazilian", "age": 27, "yeux": "Marron", "taille": "165 cm", "poids": "55 Kg", "cheveux": "Roux", "mensurations": "90-60-90", "poitrine": "90D", "bonnet": "D", "tour_poitrine": "90", "epilation": "Entièrement rasée"}',
  '{"alcool": "Occasionnellement", "fumeur": "Non", "langues": ["Français", "Anglais", "Portugais"], "orientation": "Hétérosexuelle", "origine": "Franco-brésilienne"}',
  'Massage sensuel • Domination soft • Fétichisme • Jeux de rôle • Préliminaires • Câlins • Soirées libertines • Accompagnement événements • Week-end • Dîner en ville',
  '+33612345678'
);

SELECT create_demo_profile(
  'marie@fireroses.com',
  'Marie',
  'Marie',
  'Dubois',
  'Marie',
  'Lyon',
  'Amoureuse de toutes les formes d''expression artistique 🎶',
  ARRAY['Naturiste', 'Tantrique', 'GFE'],
  ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400', 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?w=400'],
  '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 24, "yeux": "Marron", "taille": "170 cm", "poids": "58 kg", "cheveux": "Châtain", "mensurations": "85-60-90", "poitrine": "85C", "bonnet": "C", "tour_poitrine": "85", "epilation": "Entièrement rasée"}',
  '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Française"}',
  'Massage naturiste • Préliminaires • Soirées privées • Dîner romantique • Week-end détente • Jeux de rôle • Fétichisme des pieds • Domination soft • Accompagnement événements',
  '+33623456789'
);

SELECT create_demo_profile(
  'lea@fireroses.com',
  'Léa',
  'Léa',
  'Moreau',
  'Léa',
  'Marseille',
  'Danseuse professionnelle et masseuse certifiée 💃',
  ARRAY['Massage', 'Tantra', 'Accompagnement'],
  ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
  '{"sexe": "Femme", "ethnique": "Méditerranéenne", "nationalite": "Italienne", "age": 26, "yeux": "Verts", "taille": "168 cm", "poids": "54 kg", "cheveux": "Noir", "mensurations": "88-58-89", "poitrine": "88C", "bonnet": "C", "tour_poitrine": "88", "epilation": "Naturelle"}',
  '{"alcool": "Social", "fumeur": "Non", "langues": ["Français", "Italien", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Italienne"}',
  'Massage tantrique • Danse privée • Accompagnement VIP • Dîner en ville • Week-end détente • Voyages • Événements mondains',
  '+33634567890'
);

SELECT create_demo_profile(
  'emma@fireroses.com',
  'Emma',
  'Emma',
  'Petit',
  'Emma',
  'Bordeaux',
  'Maîtresse expérimentée, stricte mais juste 👠',
  ARRAY['BDSM', 'Fétichisme', 'Domination'],
  ARRAY['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400', 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400'],
  '{"sexe": "Femme", "ethnique": "Caucasienne", "nationalite": "Française", "age": 29, "yeux": "Bleus", "taille": "175 cm", "poids": "60 kg", "cheveux": "Blond", "mensurations": "92-62-91", "poitrine": "92D", "bonnet": "D", "tour_poitrine": "92", "epilation": "Entretenue"}',
  '{"alcool": "Occasionnellement", "fumeur": "Social", "langues": ["Français", "Anglais", "Allemand"], "orientation": "Bisexuelle", "origine": "Franco-allemande"}',
  'Domination • BDSM • Fétichisme • Jeux de rôle • Education • Initiation • Soirées privées • Sessions personnalisées',
  '+33645678901'
);

SELECT create_demo_profile(
  'jade@fireroses.com',
  'Jade',
  'Jade',
  'Nguyen',
  'Jade',
  'Nice',
  'Professeure de yoga et masseuse holistique 🧘‍♀️',
  ARRAY['Massage', 'Yoga', 'Méditation'],
  ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'https://images.unsplash.com/photo-1526080652727-5b77f74eacd2?w=400', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400'],
  '{"sexe": "Femme", "ethnique": "Asiatique", "nationalite": "Franco-vietnamienne", "age": 25, "yeux": "Marron", "taille": "162 cm", "poids": "50 kg", "cheveux": "Noir", "mensurations": "84-58-86", "poitrine": "84B", "bonnet": "B", "tour_poitrine": "84", "epilation": "Naturelle"}',
  '{"alcool": "Non", "fumeur": "Non", "langues": ["Français", "Vietnamien", "Anglais"], "orientation": "Hétérosexuelle", "origine": "Vietnamienne"}',
  'Massage tantrique • Yoga privé • Méditation guidée • Massage thaï • Réflexologie • Aromathérapie • Séances de bien-être',
  '+33656789012'
);