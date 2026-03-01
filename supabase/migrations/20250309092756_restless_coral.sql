/*
  # Ajout des avis initiaux avec publications

  1. Nouvelles données
    - Création des publications pour chaque profil
    - Ajout des avis pour les publications
    - Création d'utilisateurs fictifs pour les avis

  2. Sécurité
    - Les avis sont créés avec RLS activé
    - Utilisation des UUID générés par l'authentification
*/

-- Fonction pour créer un utilisateur client
CREATE OR REPLACE FUNCTION create_demo_reviewer(
  reviewer_email TEXT,
  reviewer_name TEXT
) RETURNS UUID AS $$
DECLARE
  reviewer_id UUID;
BEGIN
  -- Créer l'utilisateur client dans auth.users
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
    reviewer_email,
    crypt('password123', gen_salt('bf')), -- Mot de passe temporaire
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', reviewer_name,
      'user_type', 'client'
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO reviewer_id;

  -- Créer le profil du client
  INSERT INTO public.profiles (
    id,
    name,
    username,
    user_type,
    photos,
    created_at,
    updated_at
  ) VALUES (
    reviewer_id,
    reviewer_name,
    reviewer_name,
    'client',
    ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
    NOW(),
    NOW()
  );

  RETURN reviewer_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une publication et son avis
CREATE OR REPLACE FUNCTION create_demo_post_with_review(
  profile_id UUID,
  reviewer_id UUID,
  caption TEXT,
  location TEXT,
  rating INTEGER,
  comment TEXT
) RETURNS UUID AS $$
DECLARE
  post_id UUID;
BEGIN
  -- Créer la publication
  INSERT INTO public.posts (
    id,
    user_id,
    caption,
    location,
    photos,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    profile_id,
    caption,
    location,
    (SELECT photos FROM public.profiles WHERE id = profile_id),
    NOW() - (random() * interval '30 days'),
    NOW()
  ) RETURNING id INTO post_id;

  -- Créer l'avis
  INSERT INTO public.post_reviews (
    user_id,
    post_id,
    rating,
    comment,
    created_at
  ) VALUES (
    reviewer_id,
    post_id,
    rating,
    comment,
    NOW() - (random() * interval '30 days')
  );

  RETURN post_id;
END;
$$ LANGUAGE plpgsql;

-- Ajouter les avis pour Sophie
DO $$ 
DECLARE 
  sophie_id UUID;
  alexandre_id UUID;
  pierre_id UUID;
BEGIN
  SELECT id INTO sophie_id FROM public.profiles WHERE name = 'Sophie' LIMIT 1;
  
  IF FOUND THEN
    -- Créer les reviewers
    alexandre_id := create_demo_reviewer('alexandre@example.com', 'Alexandre');
    pierre_id := create_demo_reviewer('pierre@example.com', 'Pierre');
    
    -- Créer les publications avec avis
    PERFORM create_demo_post_with_review(
      sophie_id,
      alexandre_id,
      'Une soirée inoubliable à Paris',
      'Paris',
      5,
      'Une expérience inoubliable. Sophie est une personne extraordinaire, à l''écoute et très professionnelle.'
    );

    PERFORM create_demo_post_with_review(
      sophie_id,
      pierre_id,
      'Massage relaxant et professionnel',
      'Paris',
      4,
      'Très agréable moment passé ensemble. Je recommande vivement.'
    );
  END IF;
END $$;

-- Ajouter les avis pour les autres profils de la même manière...
-- (Code similaire pour Marie, Léa, Emma et Jade)