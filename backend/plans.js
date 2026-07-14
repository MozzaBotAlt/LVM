/**
 * Central definition of the packages / features you sell.
 * Prices are in cents (MYR sen) to avoid floating point issues.
 *
 * This file is shared conceptually with the frontend (frontend/payment/plans.js).
 * If you change a price or plan here, mirror it there too.
 */

const FREE_RUN_LIMIT = 3; // Number of free runs before the paywall kicks in.

const PLANS = {
  student_monthly: {
    id: "student_monthly",
    name: "Student Monthly",
    description: "Full access to every Labsim simulator, billed monthly.",
    amount_cents: 990, // RM9.90
    currency: "MYR",
    interval: "month",
    durationDays: 30,
    features: [
      "Unlimited simulator runs",
      "All Biology, Chemistry & Physics labs",
      "CSV data export",
      "Priority help & support",
    ],
  },
  student_yearly: {
    id: "student_yearly",
    name: "Student Yearly",
    description: "Best value for a full school year of unlimited access.",
    amount_cents: 8900, // RM89.00
    currency: "MYR",
    interval: "year",
    durationDays: 365,
    features: [
      "Everything in Student Monthly",
      "Save over 25% vs monthly",
      "Early access to new simulators",
    ],
    highlight: true,
  },
  institution_yearly: {
    id: "institution_yearly",
    name: "School / Institution",
    description: "Seat-based access for classrooms and teachers.",
    amount_cents: 49900, // RM499.00
    currency: "MYR",
    interval: "year",
    durationDays: 365,
    features: [
      "Up to 60 student seats",
      "Teacher dashboard",
      "Classroom progress tracking",
      "Dedicated onboarding",
    ],
  },
};

function getPlan(planId) {
  return PLANS[planId] || null;
}

module.exports = { PLANS, getPlan, FREE_RUN_LIMIT };
