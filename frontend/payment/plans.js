/**
 * Client-side copy of the packages, used as a fallback when the backend API is
 * unreachable. The backend (backend/plans.js) is the source of truth — when it
 * is online the page uses GET /api/plans instead.
 */
window.BTB_PLANS = {
  freeRunLimit: 3,
  plans: [
    {
      id: "student_monthly",
      name: "Student Monthly",
      description: "Full access to every Labsim simulator, billed monthly.",
      amount_cents: 990,
      currency: "MYR",
      interval: "month",
      features: [
        "Unlimited simulator runs",
        "All Biology, Chemistry & Physics labs",
        "CSV data export",
        "Priority help & support",
      ],
    },
    {
      id: "student_yearly",
      name: "Student Yearly",
      description: "Best value for a full school year of unlimited access.",
      amount_cents: 8900,
      currency: "MYR",
      interval: "year",
      highlight: true,
      features: [
        "Everything in Student Monthly",
        "Save over 25% vs monthly",
        "Early access to new simulators",
      ],
    },
    {
      id: "institution_yearly",
      name: "School / Institution",
      description: "Seat-based access for classrooms and teachers.",
      amount_cents: 49900,
      currency: "MYR",
      interval: "year",
      features: [
        "Up to 60 student seats",
        "Teacher dashboard",
        "Classroom progress tracking",
        "Dedicated onboarding",
      ],
    },
  ],
};
