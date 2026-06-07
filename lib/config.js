// Daily targets. Change these in Vercel env vars (CALORIE_TARGET / PROTEIN_TARGET)
// or here, then redeploy.
export const CALORIE_TARGET = Number(process.env.CALORIE_TARGET || 2500);
export const PROTEIN_TARGET = Number(process.env.PROTEIN_TARGET || 200);
export const WEIGHT_UNIT = "kg";
export const JJ_GOAL = 4;
export const GYM_GOAL = 3;
export const SLEEP_TARGET = 7.5;
