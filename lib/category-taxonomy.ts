import type { BusinessType } from "./business-types";

export type CategorySeed = {
  department: string;
  name: string;
};

const supermarket: CategorySeed[] = [
  { department: "Grocery / Dry Goods", name: "Staples" },
  { department: "Grocery / Dry Goods", name: "Pasta & noodles" },
  { department: "Grocery / Dry Goods", name: "Breakfast cereals" },
  { department: "Grocery / Dry Goods", name: "Baking ingredients" },
  { department: "Grocery / Dry Goods", name: "Canned foods" },
  { department: "Grocery / Dry Goods", name: "Sauces, spices & condiments" },
  { department: "Grocery / Dry Goods", name: "Cooking oil" },
  { department: "Grocery / Dry Goods", name: "Snacks & confectionery" },
  { department: "Fresh Produce", name: "Fruits" },
  { department: "Fresh Produce", name: "Vegetables" },
  { department: "Fresh Produce", name: "Herbs & spices" },
  { department: "Dairy & Refrigerated", name: "Milk" },
  { department: "Dairy & Refrigerated", name: "Yogurt" },
  { department: "Dairy & Refrigerated", name: "Cheese" },
  { department: "Dairy & Refrigerated", name: "Eggs" },
  { department: "Meat, Fish & Poultry", name: "Beef" },
  { department: "Meat, Fish & Poultry", name: "Chicken" },
  { department: "Meat, Fish & Poultry", name: "Fish & seafood" },
  { department: "Frozen Foods", name: "Frozen vegetables" },
  { department: "Frozen Foods", name: "Ice cream" },
  { department: "Bakery", name: "Bread" },
  { department: "Bakery", name: "Cakes" },
  { department: "Bakery", name: "Pastries" },
  { department: "Beverages", name: "Soft drinks" },
  { department: "Beverages", name: "Water" },
  { department: "Beverages", name: "Juice" },
  { department: "Beverages", name: "Tea & coffee" },
  { department: "Household Items", name: "Cleaning supplies" },
  { department: "Household Items", name: "Laundry detergents" },
  { department: "Personal Care & Beauty", name: "Soap & body care" },
  { department: "Personal Care & Beauty", name: "Hair care" },
  { department: "Personal Care & Beauty", name: "Oral care" },
  { department: "Baby Products", name: "Diapers & wipes" },
  { department: "Health & Wellness", name: "Vitamins & OTC" },
  { department: "Services / Non-stock", name: "Airtime & utilities" },
  { department: "Services / Non-stock", name: "Delivery charges" },
];

const pharmacy: CategorySeed[] = [
  { department: "Prescription Medicines", name: "Antibiotics" },
  { department: "Prescription Medicines", name: "Chronic disease medication" },
  { department: "Prescription Medicines", name: "Specialist medication" },
  { department: "Over-the-Counter (OTC)", name: "Pain relief" },
  { department: "Over-the-Counter (OTC)", name: "Cold & flu" },
  { department: "Over-the-Counter (OTC)", name: "Allergy medicine" },
  { department: "Over-the-Counter (OTC)", name: "Digestive medicine" },
  { department: "Over-the-Counter (OTC)", name: "Cough syrups" },
  { department: "Vitamins & Supplements", name: "Multivitamins" },
  { department: "Vitamins & Supplements", name: "Minerals" },
  { department: "Vitamins & Supplements", name: "Herbal supplements" },
  { department: "Baby & Mother Care", name: "Formula milk" },
  { department: "Baby & Mother Care", name: "Baby skincare" },
  { department: "Baby & Mother Care", name: "Diapers" },
  { department: "Personal Care", name: "Soap & hygiene" },
  { department: "Personal Care", name: "Oral care" },
  { department: "Personal Care", name: "Feminine hygiene" },
  { department: "Medical Devices & Equipment", name: "Thermometers" },
  {
    department: "Medical Devices & Equipment",
    name: "Blood pressure monitors",
  },
  { department: "Medical Devices & Equipment", name: "Glucose meters" },
  { department: "First Aid", name: "Bandages & gauze" },
  { department: "First Aid", name: "Antiseptics" },
  { department: "Skin & Beauty", name: "Acne care" },
  { department: "Skin & Beauty", name: "Sunscreen & lotions" },
  { department: "Sexual Wellness", name: "Condoms & lubricants" },
  { department: "Health Monitoring", name: "Test strips & diagnostic kits" },
  { department: "Services", name: "Consultation fee" },
  { department: "Services", name: "Vaccination fee" },
];

const restaurant: CategorySeed[] = [
  { department: "Food", name: "Starters / Appetizers" },
  { department: "Food", name: "Soups" },
  { department: "Food", name: "Salads" },
  { department: "Food", name: "Main courses" },
  { department: "Food", name: "Grills / BBQ" },
  { department: "Food", name: "Burgers & sandwiches" },
  { department: "Food", name: "Pizza" },
  { department: "Food", name: "Pasta" },
  { department: "Food", name: "Seafood" },
  { department: "Food", name: "Vegetarian / vegan" },
  { department: "Food", name: "Kids meals" },
  { department: "Food", name: "Side dishes" },
  { department: "Food", name: "Desserts" },
  { department: "Beverages", name: "Water" },
  { department: "Beverages", name: "Soft drinks" },
  { department: "Beverages", name: "Fresh juice" },
  { department: "Beverages", name: "Coffee" },
  { department: "Beverages", name: "Tea" },
  { department: "Beverages", name: "Smoothies & mocktails" },
  { department: "Alcohol", name: "Beer" },
  { department: "Alcohol", name: "Wine" },
  { department: "Alcohol", name: "Spirits & cocktails" },
  { department: "Breakfast", name: "Eggs & breakfast plates" },
  { department: "Combos / Meals", name: "Meal combos" },
  { department: "Combos / Meals", name: "Family meals" },
  { department: "Add-ons / Extras", name: "Sauces & toppings" },
  { department: "Add-ons / Extras", name: "Portion upgrades" },
  { department: "Services", name: "Delivery fee" },
  { department: "Services", name: "Service charge" },
  { department: "Services", name: "Catering fee" },
];

const salon: CategorySeed[] = [
  { department: "Hair Services", name: "Haircuts" },
  { department: "Hair Services", name: "Styling & blow-dry" },
  { department: "Hair Services", name: "Braids & extensions" },
  { department: "Hair Services", name: "Color & dye" },
  { department: "Hair Services", name: "Treatments" },
  { department: "Nails", name: "Manicure" },
  { department: "Nails", name: "Pedicure" },
  { department: "Nails", name: "Gel & acrylic" },
  { department: "Beauty Services", name: "Makeup" },
  { department: "Beauty Services", name: "Facials" },
  { department: "Beauty Services", name: "Waxing" },
  { department: "Retail Products", name: "Shampoo & conditioner" },
  { department: "Retail Products", name: "Hair oils & treatments" },
  { department: "Retail Products", name: "Skincare" },
  { department: "Retail Products", name: "Cosmetics" },
  { department: "Services", name: "Booking deposit" },
  { department: "Services", name: "Home service fee" },
];

const rentalAccommodation: CategorySeed[] = [
  { department: "Rent & Accommodation", name: "Room rent" },
  { department: "Rent & Accommodation", name: "Apartment rent" },
  { department: "Rent & Accommodation", name: "Short stay" },
  { department: "Utilities", name: "Electricity" },
  { department: "Utilities", name: "Water" },
  { department: "Utilities", name: "Internet" },
  { department: "Utilities", name: "Waste collection" },
  { department: "Deposits & Fees", name: "Security deposit" },
  { department: "Deposits & Fees", name: "Booking fee" },
  { department: "Deposits & Fees", name: "Late payment fee" },
  { department: "Maintenance", name: "Repairs" },
  { department: "Maintenance", name: "Cleaning" },
  { department: "Maintenance", name: "Laundry" },
  { department: "Services", name: "Parking" },
  { department: "Services", name: "Extra guest fee" },
];

const general: CategorySeed[] = [
  { department: "Products", name: "General goods" },
  { department: "Products", name: "Fast moving items" },
  { department: "Products", name: "Slow moving items" },
  { department: "Services", name: "Service fees" },
  { department: "Services", name: "Delivery charges" },
  { department: "Non-stock", name: "Adjustments" },
];

export const categoryTaxonomy: Record<BusinessType, CategorySeed[]> = {
  supermarket_or_shop: supermarket,
  pharmacy,
  salon,
  restaurant_or_hotel: restaurant,
  rental_accommodation: rentalAccommodation,
  other: general,
};

export function getCategorySeedsForBusinessType(type?: string | null) {
  return categoryTaxonomy[(type as BusinessType) || "other"] ?? general;
}

export function getSeedCategoryKey(
  category: Pick<CategorySeed, "department" | "name">,
) {
  return `${category.department}::${category.name}`.toLowerCase();
}
