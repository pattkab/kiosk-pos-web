CREATE OR REPLACE FUNCTION seed_default_categories_for_organization(
    p_organization_id UUID,
    p_business_type TEXT DEFAULT 'other'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_type TEXT := lower(coalesce(nullif(trim(p_business_type), ''), 'other'));
    v_inserted_count INTEGER := 0;
BEGIN
    IF p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization is required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM organization_members om
        JOIN profiles p ON p.id = om.profile_id
        WHERE om.organization_id = p_organization_id
          AND p.auth_user_id = auth.uid()
          AND om.removed_at IS NULL
          AND om.role IN ('owner', 'admin', 'manager')
    ) THEN
        RAISE EXCEPTION 'You do not have permission to seed categories for this organization.';
    END IF;

    WITH taxonomy(department, name) AS (
        SELECT entries.department, entries.name
        FROM (VALUES
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Staples'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Pasta & noodles'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Breakfast cereals'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Baking ingredients'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Canned foods'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Sauces, spices & condiments'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Cooking oil'),
            ('supermarket_or_shop', 'Grocery / Dry Goods', 'Snacks & confectionery'),
            ('supermarket_or_shop', 'Fresh Produce', 'Fruits'),
            ('supermarket_or_shop', 'Fresh Produce', 'Vegetables'),
            ('supermarket_or_shop', 'Fresh Produce', 'Herbs & spices'),
            ('supermarket_or_shop', 'Dairy & Refrigerated', 'Milk'),
            ('supermarket_or_shop', 'Dairy & Refrigerated', 'Yogurt'),
            ('supermarket_or_shop', 'Dairy & Refrigerated', 'Cheese'),
            ('supermarket_or_shop', 'Dairy & Refrigerated', 'Eggs'),
            ('supermarket_or_shop', 'Meat, Fish & Poultry', 'Beef'),
            ('supermarket_or_shop', 'Meat, Fish & Poultry', 'Chicken'),
            ('supermarket_or_shop', 'Meat, Fish & Poultry', 'Fish & seafood'),
            ('supermarket_or_shop', 'Frozen Foods', 'Frozen vegetables'),
            ('supermarket_or_shop', 'Frozen Foods', 'Ice cream'),
            ('supermarket_or_shop', 'Bakery', 'Bread'),
            ('supermarket_or_shop', 'Bakery', 'Cakes'),
            ('supermarket_or_shop', 'Bakery', 'Pastries'),
            ('supermarket_or_shop', 'Beverages', 'Soft drinks'),
            ('supermarket_or_shop', 'Beverages', 'Water'),
            ('supermarket_or_shop', 'Beverages', 'Juice'),
            ('supermarket_or_shop', 'Beverages', 'Tea & coffee'),
            ('supermarket_or_shop', 'Household Items', 'Cleaning supplies'),
            ('supermarket_or_shop', 'Household Items', 'Laundry detergents'),
            ('supermarket_or_shop', 'Personal Care & Beauty', 'Soap & body care'),
            ('supermarket_or_shop', 'Personal Care & Beauty', 'Hair care'),
            ('supermarket_or_shop', 'Personal Care & Beauty', 'Oral care'),
            ('supermarket_or_shop', 'Baby Products', 'Diapers & wipes'),
            ('supermarket_or_shop', 'Health & Wellness', 'Vitamins & OTC'),
            ('supermarket_or_shop', 'Services / Non-stock', 'Airtime & utilities'),
            ('supermarket_or_shop', 'Services / Non-stock', 'Delivery charges'),
            ('pharmacy', 'Prescription Medicines', 'Antibiotics'),
            ('pharmacy', 'Prescription Medicines', 'Chronic disease medication'),
            ('pharmacy', 'Prescription Medicines', 'Specialist medication'),
            ('pharmacy', 'Over-the-Counter (OTC)', 'Pain relief'),
            ('pharmacy', 'Over-the-Counter (OTC)', 'Cold & flu'),
            ('pharmacy', 'Over-the-Counter (OTC)', 'Allergy medicine'),
            ('pharmacy', 'Over-the-Counter (OTC)', 'Digestive medicine'),
            ('pharmacy', 'Over-the-Counter (OTC)', 'Cough syrups'),
            ('pharmacy', 'Vitamins & Supplements', 'Multivitamins'),
            ('pharmacy', 'Vitamins & Supplements', 'Minerals'),
            ('pharmacy', 'Vitamins & Supplements', 'Herbal supplements'),
            ('pharmacy', 'Baby & Mother Care', 'Formula milk'),
            ('pharmacy', 'Baby & Mother Care', 'Baby skincare'),
            ('pharmacy', 'Baby & Mother Care', 'Diapers'),
            ('pharmacy', 'Personal Care', 'Soap & hygiene'),
            ('pharmacy', 'Personal Care', 'Oral care'),
            ('pharmacy', 'Personal Care', 'Feminine hygiene'),
            ('pharmacy', 'Medical Devices & Equipment', 'Thermometers'),
            ('pharmacy', 'Medical Devices & Equipment', 'Blood pressure monitors'),
            ('pharmacy', 'Medical Devices & Equipment', 'Glucose meters'),
            ('pharmacy', 'First Aid', 'Bandages & gauze'),
            ('pharmacy', 'First Aid', 'Antiseptics'),
            ('pharmacy', 'Skin & Beauty', 'Acne care'),
            ('pharmacy', 'Skin & Beauty', 'Sunscreen & lotions'),
            ('pharmacy', 'Sexual Wellness', 'Condoms & lubricants'),
            ('pharmacy', 'Health Monitoring', 'Test strips & diagnostic kits'),
            ('pharmacy', 'Services', 'Consultation fee'),
            ('pharmacy', 'Services', 'Vaccination fee'),
            ('restaurant_or_hotel', 'Food', 'Starters / Appetizers'),
            ('restaurant_or_hotel', 'Food', 'Soups'),
            ('restaurant_or_hotel', 'Food', 'Salads'),
            ('restaurant_or_hotel', 'Food', 'Main courses'),
            ('restaurant_or_hotel', 'Food', 'Grills / BBQ'),
            ('restaurant_or_hotel', 'Food', 'Burgers & sandwiches'),
            ('restaurant_or_hotel', 'Food', 'Pizza'),
            ('restaurant_or_hotel', 'Food', 'Pasta'),
            ('restaurant_or_hotel', 'Food', 'Seafood'),
            ('restaurant_or_hotel', 'Food', 'Vegetarian / vegan'),
            ('restaurant_or_hotel', 'Food', 'Kids meals'),
            ('restaurant_or_hotel', 'Food', 'Side dishes'),
            ('restaurant_or_hotel', 'Food', 'Desserts'),
            ('restaurant_or_hotel', 'Beverages', 'Water'),
            ('restaurant_or_hotel', 'Beverages', 'Soft drinks'),
            ('restaurant_or_hotel', 'Beverages', 'Fresh juice'),
            ('restaurant_or_hotel', 'Beverages', 'Coffee'),
            ('restaurant_or_hotel', 'Beverages', 'Tea'),
            ('restaurant_or_hotel', 'Beverages', 'Smoothies & mocktails'),
            ('restaurant_or_hotel', 'Alcohol', 'Beer'),
            ('restaurant_or_hotel', 'Alcohol', 'Wine'),
            ('restaurant_or_hotel', 'Alcohol', 'Spirits & cocktails'),
            ('restaurant_or_hotel', 'Breakfast', 'Eggs & breakfast plates'),
            ('restaurant_or_hotel', 'Combos / Meals', 'Meal combos'),
            ('restaurant_or_hotel', 'Combos / Meals', 'Family meals'),
            ('restaurant_or_hotel', 'Add-ons / Extras', 'Sauces & toppings'),
            ('restaurant_or_hotel', 'Add-ons / Extras', 'Portion upgrades'),
            ('restaurant_or_hotel', 'Services', 'Delivery fee'),
            ('restaurant_or_hotel', 'Services', 'Service charge'),
            ('restaurant_or_hotel', 'Services', 'Catering fee'),
            ('salon', 'Hair Services', 'Haircuts'),
            ('salon', 'Hair Services', 'Styling & blow-dry'),
            ('salon', 'Hair Services', 'Braids & extensions'),
            ('salon', 'Hair Services', 'Color & dye'),
            ('salon', 'Hair Services', 'Treatments'),
            ('salon', 'Nails', 'Manicure'),
            ('salon', 'Nails', 'Pedicure'),
            ('salon', 'Nails', 'Gel & acrylic'),
            ('salon', 'Beauty Services', 'Makeup'),
            ('salon', 'Beauty Services', 'Facials'),
            ('salon', 'Beauty Services', 'Waxing'),
            ('salon', 'Retail Products', 'Shampoo & conditioner'),
            ('salon', 'Retail Products', 'Hair oils & treatments'),
            ('salon', 'Retail Products', 'Skincare'),
            ('salon', 'Retail Products', 'Cosmetics'),
            ('salon', 'Services', 'Booking deposit'),
            ('salon', 'Services', 'Home service fee'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Standard room nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Deluxe room nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Twin room nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Family room nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Suite nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Cottage or cabin nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Dorm bed nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Entire home nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Weekend or holiday nightly rate'),
            ('rental_accommodation', 'Accommodation Nightly Rates', 'Long-stay nightly rate'),
            ('rental_accommodation', 'Guest Fees', 'Extra guest nightly fee'),
            ('rental_accommodation', 'Guest Fees', 'Child guest nightly fee'),
            ('rental_accommodation', 'Guest Services', 'Breakfast add-on'),
            ('rental_accommodation', 'Guest Services', 'Late checkout'),
            ('rental_accommodation', 'Guest Services', 'Cleaning fee'),
            ('rental_accommodation', 'Guest Services', 'Airport transfer'),
            ('other', 'Products', 'General goods'),
            ('other', 'Products', 'Fast moving items'),
            ('other', 'Products', 'Slow moving items'),
            ('other', 'Services', 'Service fees'),
            ('other', 'Services', 'Delivery charges'),
            ('other', 'Non-stock', 'Adjustments')
        ) AS entries(business_type, department, name)
        WHERE entries.business_type = v_business_type
    ),
    inserted AS (
        INSERT INTO categories (organization_id, name, description)
        SELECT p_organization_id, taxonomy.name, taxonomy.department
        FROM taxonomy
        WHERE NOT EXISTS (
            SELECT 1
            FROM categories c
            WHERE c.organization_id = p_organization_id
              AND lower(c.name) = lower(taxonomy.name)
        )
        RETURNING 1
    )
    SELECT count(*) INTO v_inserted_count FROM inserted;

    RETURN v_inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_default_categories_for_organization(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_currency TEXT DEFAULT 'USD',
    p_business_type TEXT DEFAULT 'other'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_organization_id UUID;
    v_slug TEXT;
    v_currency TEXT;
    v_business_type TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to create an organization.';
    END IF;

    SELECT id INTO v_profile_id
    FROM profiles
    WHERE auth_user_id = auth.uid();

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for the signed-in user.';
    END IF;

    v_slug := lower(trim(p_slug));
    v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'USD'));
    v_business_type := lower(coalesce(nullif(trim(p_business_type), ''), 'other'));

    IF length(trim(p_name)) < 2 THEN
        RAISE EXCEPTION 'Organization name must be at least 2 characters.';
    END IF;

    IF v_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Organization slug can only contain lowercase letters, numbers, and hyphens.';
    END IF;

    IF v_business_type NOT IN (
        'supermarket_or_shop',
        'pharmacy',
        'salon',
        'restaurant_or_hotel',
        'rental_accommodation',
        'other'
    ) THEN
        RAISE EXCEPTION 'Unsupported business type.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM organizations
        WHERE slug = v_slug
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'This organization slug is already taken.';
    END IF;

    INSERT INTO organizations (name, slug, currency, business_type, owner_id)
    VALUES (trim(p_name), v_slug, v_currency, v_business_type, v_profile_id)
    RETURNING id INTO v_organization_id;

    INSERT INTO organization_members (organization_id, profile_id, role)
    VALUES (v_organization_id, v_profile_id, 'owner')
    ON CONFLICT (organization_id, profile_id)
    DO UPDATE SET role = 'owner', removed_at = NULL;

    INSERT INTO settings (organization_id)
    VALUES (v_organization_id)
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO organization_settings (organization_id, low_stock_threshold_default)
    VALUES (v_organization_id, 5)
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO cash_registers (organization_id, name)
    VALUES (v_organization_id, 'Main Register')
    ON CONFLICT DO NOTHING;

    PERFORM seed_default_categories_for_organization(v_organization_id, v_business_type);

    INSERT INTO activity_logs (organization_id, profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_organization_id,
        v_profile_id,
        'CREATE_ORGANIZATION',
        'organization',
        v_organization_id,
        jsonb_build_object('slug', v_slug, 'currency', v_currency, 'business_type', v_business_type)
    );

    RETURN v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, TEXT, TEXT) TO authenticated;
