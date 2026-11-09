// All text shown on the site. Edit here; no component changes needed.

export const profile = {
  name: "Joshirahul Vadivel",
  firstName: "Joshirahul",
  role: "Project, Program & Operations Professional",
  location: "Erode, India",
  email: "joshirahulvadivel@gmail.com",
  linkedin: "https://in.linkedin.com/in/joshirahulvadivel",
  resume: "/joshirahul-vadivel-resume.pdf",
  headline: "Associate Project Manager · araCreate Group",
  contactNote:
    "Open to project, program and operations roles. Send a message below, or reach me by email or LinkedIn.",
  tagline:
    "I keep projects, teams and international clients moving: on time, on SLA, and on the same page.",
  summary:
    "Project, program and operations professional with 4+ years at araCreate Group, progressing from Moderator through Senior Moderator and Operations Team Lead to Associate Project Manager. I coordinate stakeholders, clients and vendors across risks, escalations, SLA/KPI commitments and reporting for international clients.",
};

export const stats = [
  { value: "4+", label: "Years at araCreate Group" },
  { value: "6+", label: "International luxury-brand projects" },
  { value: "200+", label: "Students reached through workshops" },
  { value: "24/7", label: "Service delivery coordinated" },
];

export const competencies = [
  {
    title: "Project & Program Management",
    items: ["Project Coordination", "Program Coordination", "Project Planning", "Timeline & Milestone Tracking", "Risk & Issue Management", "Change Request Tracking", "Delivery Coordination"],
  },
  {
    title: "Operations & Service Delivery",
    items: ["Operations Management", "24/7 Operations", "SLA / KPI Management", "Workflow Management", "Escalation Management", "Process Improvement", "Quality Control"],
  },
  {
    title: "Client & Stakeholder Management",
    items: ["Client Management", "Stakeholder Communication", "Vendor Management", "Procurement & Quotations", "Partner Coordination", "Cross-functional Coordination"],
  },
  {
    title: "Events & Programs",
    items: ["Event Management", "Workshop Coordination", "Academy Operations", "Training Coordination", "Logistics Coordination", "Operational Readiness"],
  },
  {
    title: "Quality & Testing",
    items: ["QA Coordination", "Defect Tracking", "Validation & Retesting", "Requirements / PRD Tracking"],
  },
];

export const tools = [
  { group: "Project & Work", items: ["Jira", "Confluence", "Microsoft Project", "Asana", "Trello"] },
  { group: "Reporting & Analytics", items: ["Excel", "Power BI", "Google Sheets", "PowerPoint"] },
  { group: "Collaboration", items: ["Teams", "Slack", "Zoom", "Outlook", "SharePoint"] },
  { group: "AI-Assisted", items: ["Research", "Planning", "Documentation", "Data analysis", "Reporting"] },
];

export type Project = {
  name: string;
  client: string;
  role: string;
  summary: string;
  points: string[];
  tags: string[];
  /** Optional public link shown in the case panel. */
  link?: string;
};

export const projects: Project[] = [
  {
    name: "Digital Systems Upgrade",
    client: "Bernhard Halle Nachfl. GmbH",
    role: "Associate Project Manager",
    summary:
      "Digital modernization of a 152-year-old engineering brand's web presence and platform.",
    points: [
      "Supported planning and scheduling; coordinated client and delivery-team communication.",
      "Tracked milestones, risks and dependencies, and prepared stakeholder updates.",
      "Testing support: validated functionality, reported defects, retested fixes.",
    ],
    tags: ["Planning", "Stakeholders", "QA"],
  },
  {
    name: "Brand Protection Operations",
    client: "Navee",
    role: "Project Manager (Client-Facing)",
    summary:
      "Client-facing delivery of brand-protection operations for Gucci, Louis Vuitton and Celine.",
    points: [
      "Owned quality requirements, reporting, client communication, escalations and SLA commitments.",
      "Completed successfully and recognised with a Client Appreciation award.",
    ],
    tags: ["Luxury brands", "SLA", "Award"],
  },
  {
    name: "Events & Workshop Management",
    client: "ACA Academy",
    role: "Event Manager & Coordinator",
    summary: "Workshops and events for 200+ students across schools and colleges.",
    points: [
      "Coordinated trainers, curriculum, documentation, QA, equipment and industry partners.",
      "Managed stakeholder communication, logistics and operational readiness.",
    ],
    tags: ["Events", "Logistics", "Partners"],
  },
  {
    name: "24/7 Social Platform Moderation",
    client: "Jodel",
    role: "Project Manager (Client-Facing)",
    summary: "Continuous 24/7 moderation delivery on a hyperlocal community social platform.",
    points: [
      "Project administration across shift operations, workflow execution and quality control.",
      "Owned performance tracking, reporting and escalations for the account.",
    ],
    tags: ["24/7 Ops", "Quality", "Reporting"],
  },
  {
    name: "E-commerce Operations",
    client: "Brandback",
    role: "Project Manager (Client-Facing)",
    summary: "End-to-end project management for a German e-commerce startup.",
    points: [
      "Oversaw admin-panel operations.",
      "Coordinated business operations and service delivery.",
    ],
    tags: ["E-commerce", "Startup", "Delivery"],
  },
];

export const experience = [
  {
    role: "Associate Project Manager",
    focus: "Project & Stakeholder Management",
    period: "Oct 2024 – Present",
    points: [
      "Coordinate project and operational workstreams from planning through execution.",
      "Track milestones, risks, issues and escalations; resolve dependencies with clients, vendors and partners.",
      "Report progress through management reports, updates and presentations.",
      "Manage vendor requirements, quotations and procurement; plan and run academy events.",
    ],
  },
  {
    role: "Operations Team Lead",
    focus: "Team & Operations Leadership",
    period: "Feb 2024 – Sep 2024",
    points: [
      "Led service operations across six areas: content moderation, fraud detection, brand protection, data enrichment, lead generation and e-commerce support.",
      "Coordinated 24/7 delivery through shift planning, workload allocation and quality control.",
      "Owned delivery, client communication and SLA commitments for international brands and startups.",
    ],
  },
  {
    role: "Senior Moderator",
    focus: "Quality, Process Control & Escalation",
    period: "Dec 2022 – Jan 2024",
    points: [
      "Oversaw quality and performance across six-plus international luxury-brand projects.",
      "Handled workflow escalations and quality checks; supported team training.",
    ],
  },
  {
    role: "Moderator",
    focus: "Frontline Operations",
    period: "Sep 2021 – Mar 2022",
    points: [
      "Executed data labelling, content review, product enrichment and fraud-detection workflows.",
      "Identified and escalated exceptions for additional review.",
    ],
  },
];

export const education = {
  degree: "B.Sc. Information Technology",
  school: "Bharathidasan College of Arts and Science, Erode",
  period: "2018 – 2021",
};

export const certifications = [
  { name: "Risk and Project Management", issuer: "Simplilearn SkillUp" },
  { name: "Introduction to Six Sigma – Green Belt", issuer: "Simplilearn SkillUp" },
  { name: "Understanding Operations Management", issuer: "The Open University – OpenLearn" },
];

export const award = {
  name: "Client Appreciation – Navee Brand Protection",
  detail: "Recognised by the client for outstanding work and successful completion of the project.",
};

export const languages = ["Tamil – full professional fluency", "English – professional working proficiency"];

// Globe: home base and the places client work connected to.
export const globe = {
  home: { name: "Erode, India", lat: 11.34, lng: 77.72 },
  links: [
    { name: "Germany", note: "Bernhard Halle · Jodel · Brandback", lat: 52.52, lng: 13.4 },
    { name: "France", note: "Louis Vuitton · Celine", lat: 48.86, lng: 2.35 },
    { name: "Italy", note: "Gucci", lat: 43.77, lng: 11.25 },
  ],
};
