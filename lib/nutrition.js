// Parses freeform food text ("60g oats and 2 scoops whey") into macros using
// the CalorieNinjas natural-language nutrition API.
export async function parseFood(text) {
  const key = process.env.CALORIENINJAS_KEY;
  if (!key) throw new Error("Missing CALORIENINJAS_KEY");

  const res = await fetch(
    "https://api.calorieninjas.com/v1/nutrition?query=" + encodeURIComponent(text),
    { headers: { "X-Api-Key": key }, cache: "no-store" }
  );
  if (!res.ok) throw new Error("CalorieNinjas error " + res.status);

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  const totals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein_g: acc.protein_g + (Number(it.protein_g) || 0),
      carbs_g: acc.carbs_g + (Number(it.carbohydrates_total_g) || 0),
      fat_g: acc.fat_g + (Number(it.fat_total_g) || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  return {
    calories: Math.round(totals.calories),
    protein_g: Math.round(totals.protein_g * 10) / 10,
    carbs_g: Math.round(totals.carbs_g * 10) / 10,
    fat_g: Math.round(totals.fat_g * 10) / 10,
    matched: items.length,
  };
}
