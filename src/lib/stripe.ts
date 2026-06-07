import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production") {
  console.warn("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2026-05-27.dahlia", // ou simplement supprimez-le pour utiliser la valeur par défaut si permis, mais vu l'erreur TS, ceci est attendu.
  appInfo: {
    name: "Fitloww",
    version: "0.1.0",
  },
});
