import type { LearningLesson, LearningQuestion } from "@workspace/api-zod";

export type AuthoredQuestion = LearningQuestion & { answer: number; explanation: string };
type AuthoredLesson = Omit<LearningLesson, "questions"> & { questions: AuthoredQuestion[] };
const refs = {
  elections: { title: "Election Commission of India — voter education", url: "https://www.eci.gov.in/voter-education" },
  constitution: { title: "Legislative Department — Constitution of India", url: "https://legislative.gov.in/constitution-of-india/" },
  rti: { title: "Government of India — RTI Online FAQs", url: "https://rtionline.gov.in/faq.php" },
  banking: { title: "Reserve Bank of India — basic banking education", url: "https://www.rbi.org.in/financialeducation/BasicBanking.aspx" },
  rbi: { title: "Reserve Bank of India — financial education", url: "https://www.rbi.org.in/financialeducation/" },
  insurance: { title: "IRDAI — Health Insurance Handbook (concepts; check current policy terms)", url: "https://irdai.gov.in/documents/37343/369581/Health+Insurance+Handbook+(English).pdf/0e712e9f-4329-93b2-373b-ba80491c237f?t=1631528764485&version=1.0" },
  nutrition: { title: "ICMR-NIN — Dietary Guidelines for Indians 2024", url: "https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf" },
  care: { title: "WHO — patient safety rights", url: "https://www.who.int/publications/i/item/9789240093249" },
  tax: { title: "Income Tax Department — salaried individuals (AY 2026–27; verify your applicable year)", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" },
  upi: { title: "NPCI — UPI Safety Shield", url: "https://www.npci.org.in/safety-feature" },
  ethics: { title: "UNESCO — Recommendation on the Ethics of AI", url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics" },
};
const educational = "Educational guidance for India, not personalised legal, tax, medical or financial advice. Verify current rules and local procedures with the relevant authority or qualified professional. All rupee amounts and rates in examples are hypothetical, not current offers.";
function q(id: string, prompt: string, options: string[], answer: number, explanation: string): AuthoredQuestion {
  return { id, prompt, options, answer, explanation };
}
function lesson(
  id: string, subject: LearningLesson["subject"], title: string, goal: string,
  explanation: string[], example: string, takeaways: string[], nextStep: string,
  references: (keyof typeof refs)[], questions: AuthoredQuestion[], simulationTrackId?: string,
): AuthoredLesson {
  return { id, subject, title, goal, explanation, example, takeaways, nextStep,
    caveat: educational, reviewedOn: "2026-10-24", references: references.map((r) => refs[r]),
    questions, ...(simulationTrackId ? { simulationTrackId } : {}) };
}

// Original, human-authored English curriculum. Answer keys never leave the server
// before a complete tracked submission. Published version is retained for daily assignments.
export const learningLessons: AuthoredLesson[] = [
  lesson("politics-participation", "Politics", "Participation beyond election day",
    "Choose a constructive, evidence-based way to participate in democracy.",
    ["Democratic participation includes discussing public priorities, asking representatives questions, attending lawful public meetings and voting when eligible. Disagreement is legitimate; intimidation and treating opponents as less deserving of rights are not.",
     "Separate a policy claim from a person or party. Ask what problem a proposal addresses, who benefits, who bears costs and what evidence would show success. Listening to affected people can reveal trade-offs a slogan hides. Revisit your view when better evidence appears."],
    "A college group in Pune compares candidates' public proposals on bus access using the same questions for every candidate. Students who are not eligible to vote can still learn, discuss and raise service concerns.",
    ["Participation is more than forwarding political messages.", "Apply the same evidence standards to all sides.", "Respect lawful disagreement and other people's rights."],
    "Write one local public issue and two neutral questions you would ask any representative.", ["elections", "constitution"], [
      q("pp1", "Which is constructive participation?", ["Threaten anyone who disagrees", "Ask every candidate the same evidence-based question", "Share rumours about rivals"], 1, "Consistent questions allow comparison without intimidation."),
      q("pp2", "What best tests a policy promise?", ["The popularity of the speaker", "Its slogan", "Costs, affected people and measurable outcomes"], 2, "Policy assessment needs evidence and trade-offs, not just popularity."),
      q("pp3", "A friend disagrees. What should you do?", ["Listen and challenge the claim respectfully", "Exclude them from public discussion", "Publish their phone number"], 0, "Democratic disagreement does not justify harassment or disclosure of private information."),
    ], "civic"),
  lesson("politics-elections", "Politics", "Elections: eligibility, rolls and informed choices",
    "Distinguish voter registration, election administration and informed voting.",
    ["In India, eligible citizens need to be registered on the relevant electoral roll to vote. Do not assume that possessing an identity document alone guarantees an entry. Use Election Commission resources to check eligibility, registration and polling information.",
     "Candidates and parties compete for votes; election authorities administer the process. Compare public candidate information, policies and credible reporting. Voting choices are personal: gifts, pressure and viral claims are not substitutes for independent judgement."],
    "Before an election, a first-time voter in Hyderabad checks their roll entry and official polling details rather than relying on a WhatsApp message listing an old polling station.",
    ["Check your roll entry through official channels.", "Distinguish political campaigning from official election instructions.", "Make an independent, informed choice."],
    "Locate the ECI voter-information page and note what you would need to verify before polling day; never post voter documents publicly.", ["elections"], [
      q("pe1", "What should an eligible first-time voter verify?", ["Only a campaign poster", "That their name is on the electoral roll", "How many followers a candidate has"], 1, "An identity document is not a substitute for checking registration."),
      q("pe2", "Where should you verify polling instructions?", ["An anonymous forward", "A candidate's fan page alone", "Official election authority resources"], 2, "Official resources are the appropriate source for election administration."),
      q("pe3", "Which supports an informed choice?", ["Comparing candidate information and policies", "Accepting pressure to vote a certain way", "Trusting a gift more than evidence"], 0, "Independent comparison supports voter autonomy."),
    ]),
  lesson("politics-misinformation", "Politics", "Pause before you forward",
    "Verify a political claim without amplifying it.",
    ["Misinformation can be a false statement, an old image presented as new, or a true statistic stripped of context. A familiar sender, many shares or a professional-looking graphic does not establish accuracy.",
     "Pause, find the original source, check its date and location, and compare the claim with primary documents and credible independent reporting. If evidence is missing, do not forward it. Correct your own mistaken share with a clear correction rather than silently deleting it. Avoid repeating a harmful rumour unnecessarily in your correction."],
    "A Bengaluru group receives an old flood video labelled as today's road closure. Checking the original upload date and municipal notice prevents unnecessary travel panic.",
    ["Check source, date, place and context.", "Popularity is not verification.", "Correct errors without spreading private details."],
    "Practise checking one non-sensitive public claim against its original source before sharing.", ["elections"], [
      q("pm1", "An old video is labelled as today's event. What is wrong?", ["Nothing if it is popular", "Its context is misleading", "Only the video quality"], 1, "Real footage can mislead when its date or place is changed."),
      q("pm2", "You cannot verify a dramatic claim. What next?", ["Forward with 'maybe true'", "Add a dramatic caption", "Do not amplify it; seek primary evidence"], 2, "A disclaimer does not remove the harm of amplifying an unverified claim."),
      q("pm3", "You shared a false claim. What helps?", ["Send a clear correction to the same audience", "Blame everyone who believed you", "Delete all evidence and say nothing"], 0, "A correction helps the people who saw the original message update their understanding."),
    ], "civic"),
  lesson("government-structure", "Government", "Who does what? Levels and branches",
    "Separate levels of government from branches of government.",
    ["Union, state and local governments operate at different levels. Their responsibilities are distributed by the Constitution and applicable laws; some areas involve more than one level. Municipalities and panchayats are not simply smaller versions of Parliament.",
     "The legislature makes laws and scrutinises government; the executive implements laws and administers services; the judiciary interprets laws and resolves disputes. These are branches, not geographic levels. An MP, a minister and a judge have different roles even when they discuss the same public issue."],
    "For a damaged local streetlight, a resident first checks the municipal service channel. For a disputed legal right, a court may have a role, but it is not the routine streetlight repair desk.",
    ["Levels describe scale and jurisdiction.", "Branches describe institutional functions.", "Find the responsible body before escalating."],
    "Make a two-column note: three levels on one side, three branches on the other.", ["constitution"], [
      q("gs1", "Which is a branch rather than a level?", ["State", "Local", "Judiciary"], 2, "The judiciary is an institutional branch; state and local describe levels."),
      q("gs2", "Who generally administers services and implements laws?", ["The executive", "Only voters", "Only the judiciary"], 0, "Implementation and administration are executive functions."),
      q("gs3", "Why check jurisdiction?", ["Every issue belongs to Parliament", "Responsibilities vary by law and service", "Local bodies have no responsibilities"], 1, "Correct jurisdiction helps a request reach the responsible authority."),
    ], "civic"),
  lesson("government-services", "Government", "Get a local service complaint moving",
    "Create a safe, specific and traceable local service complaint.",
    ["A useful complaint identifies a service failure, exact location, date and safe supporting evidence. Find the official municipal, panchayat or relevant utility channel; roads, water, power and sanitation may have different responsible bodies.",
     "Save the complaint number and acknowledgement. Follow the published escalation process if unresolved and record follow-up dates. Routine complaint channels are not emergency response: for immediate danger seek the appropriate emergency help and keep yourself safe. Never enter drains or touch exposed wires to gather evidence."],
    "A Jaipur resident reports a broken streetlight with a pole number, location and safely taken photograph, then tracks the acknowledgement instead of posting an address and personal details in a public group.",
    ["Use the responsible service channel.", "Keep an acknowledgement and follow up.", "Safety comes before evidence gathering."],
    "Find one official local complaint channel and draft a fictional, non-identifying service report.", ["constitution"], [
      q("gl1", "What makes a service report actionable?", ["Only an angry slogan", "Exact location and a clear description", "A list of unrelated rumours"], 1, "Specific facts help locate and assess the problem."),
      q("gl2", "What should you save?", ["Only a social-media like", "Someone else's private ID", "Complaint reference and acknowledgement"], 2, "A reference supports traceable follow-up."),
      q("gl3", "An exposed wire is dangerous. What first?", ["Keep away and seek appropriate urgent help", "Touch it to prove it is live", "Wait for a routine complaint deadline"], 0, "Do not risk injury for evidence or delay urgent safety help."),
    ], "civic"),
  lesson("government-rti", "Government", "RTI: ask for records, not guesses",
    "Frame a focused request for existing public records.",
    ["India's Right to Information framework enables eligible requests for information held by public authorities, subject to statutory exemptions and procedure. It is not a requirement for an official to invent an explanation, solve a personal dispute or create a new analysis.",
     "Identify the correct public authority and Public Information Officer. Specify records, dates and the form of information sought. Check the jurisdiction's fee, exemptions, response timelines and appeal process. The central RTI Online portal does not cover every state or local authority; a service grievance may need a separate complaint."],
    "To understand a ward road repair, a resident requests copies of the sanctioned estimate and expenditure records for a specified period instead of asking 'Why are all roads bad?'",
    ["Request identifiable existing records.", "Use the right authority and procedure.", "RTI and service complaints have different purposes."],
    "Draft a request for a fictional road project's estimate and expenditure records, without submitting personal information here.", ["rti", "constitution"], [
      q("gr1", "Which is a focused RTI request?", ["Copy of a specified project's expenditure records", "Tell me why everyone is dishonest", "Repair my road immediately"], 0, "A named record and period make an information request precise."),
      q("gr2", "Does the central RTI portal cover all local bodies?", ["Always", "No; check the authority and jurisdiction", "Only if a message is viral"], 1, "State and local procedures may differ; verify the relevant authority."),
      q("gr3", "What should be checked before filing?", ["A stranger's payment link", "Only the colour of the form", "Applicable procedure, exemptions, fee and appeal rules"], 2, "Rules depend on the authority and applicable law; do not assume a universal procedure."),
    ], "civic"),
  lesson("ethics-honesty", "Ethics", "Honesty when the truth is uncomfortable",
    "Respond to an error without hiding facts or causing extra harm.",
    ["Honesty is not just avoiding a direct lie. Omitting a known material error can mislead someone who relies on your work. First establish what you know, distinguish it from assumptions and correct the record through an appropriate channel.",
     "A practical ethical check asks: who could be harmed, which duties apply, what options exist and could you explain your choice openly? Transparency does not mean publicising confidential data. Share enough with the right person to fix the problem, and preserve relevant evidence safely."],
    "A student in Chennai notices a spreadsheet overstates a club's event collections. They notify the treasurer with the calculation and correct the total before the report is used.",
    ["Own errors and distinguish facts from guesses.", "Correct information where it is relied upon.", "Honesty and confidentiality can coexist."],
    "Write a respectful two-sentence correction for a fictional calculation mistake.", ["ethics"], [
      q("eh1", "A report has your known error. What is best?", ["Hide the file", "Tell the responsible person and correct it", "Blame an absent teammate"], 1, "Correcting the record prevents decisions based on false information."),
      q("eh2", "Does honesty require publishing confidential records?", ["Yes, all details", "Only if popular", "No; use appropriate channels and limit disclosure"], 2, "Truthfulness does not erase confidentiality duties."),
      q("eh3", "What helps assess a dilemma?", ["Affected people, duties and possible harms", "Only whether you can avoid being caught", "Only your immediate convenience"], 0, "Ethical reasoning considers effects and responsibilities, not just personal benefit."),
    ], "ethics"),
  lesson("ethics-consent", "Ethics", "Consent is specific, not assumed",
    "Recognise meaningful permission in everyday digital choices.",
    ["Ethical consent is informed, voluntary and specific to a purpose. Silence, past permission or being in a group is not automatically permission for a different use. Power imbalances can make it difficult for a person to refuse.",
     "Ask before sharing someone's photo, story or data. Explain where it will appear and who may see it, offer a genuine way to decline and respect withdrawal for future use where possible. Digital copies may be difficult to retrieve, so minimise collection and sharing in the first place. Legal requirements vary, especially for children."],
    "A Delhi college club has permission to photograph an internal workshop, but asks separately before using a close-up on a public promotional poster.",
    ["Permission has a purpose and audience.", "Refusal should be possible without pressure.", "Minimise personal data and respect boundaries."],
    "Draft a plain-language request to use a fictional event photo, including a way to decline.", ["ethics"], [
      q("ec1", "Permission for an internal photo means what?", ["Unlimited advertising rights", "Consent for that stated purpose, not every use", "Permission to sell personal details"], 1, "A new audience or purpose needs a fresh consent check."),
      q("ec2", "Which makes consent less voluntary?", ["A real choice to decline", "Clear information", "Threatening a penalty for refusal"], 2, "Coercion undermines voluntary permission."),
      q("ec3", "What is a safe data habit?", ["Collect and share only what is needed", "Keep every personal detail forever", "Assume silence means yes"], 0, "Data minimisation reduces risks even when permission exists."),
    ], "ethics"),
  lesson("ethics-ai", "Ethics", "Responsible AI and difficult loyalties",
    "Use AI transparently and respond responsibly to safety concerns.",
    ["An AI output can sound convincing while being wrong, biased or unsupported. You remain responsible for checking important claims and following school or workplace rules. Do not paste confidential records into a tool without authorisation; disclose AI assistance when required.",
     "Creating a deceptive impersonation removes another person's control over their identity. In a dilemma involving loyalty and safety, document verified facts, consider affected people and use appropriate reporting channels. Avoid both a cover-up and unsupported public accusations. Human judgement and accountability cannot be delegated to a chatbot."],
    "A Hyderabad intern refuses to use a synthetic manager voice to authorise a transaction and reports the request through the organisation's security channel without circulating the recording.",
    ["Verify AI claims and disclose use appropriately.", "Do not impersonate or expose confidential data.", "Raise documented safety concerns through suitable channels."],
    "Write your own three-rule AI policy: verification, disclosure and privacy.", ["ethics"], [
      q("ea1", "An AI answer includes a confident medical claim. What next?", ["Treat confidence as proof", "Verify using qualified sources", "Forward it as professional advice"], 1, "Confidence in generated text is not evidence."),
      q("ea2", "A teammate asks you to hide a safety issue. What is responsible?", ["Delete records", "Make unsupported accusations online", "Document facts and use an appropriate reporting channel"], 2, "This protects affected people while avoiding unnecessary disclosure and speculation."),
      q("ea3", "Which AI use is responsible?", ["Authorised use with checks and required disclosure", "Deceptive voice impersonation", "Uploading confidential customer files without permission"], 0, "Authorisation, verification and transparency preserve accountability."),
    ], "ethics"),
  lesson("economy-inflation", "Economy", "Inflation and your changing basket",
    "Explain inflation without confusing it with every individual price change.",
    ["Inflation is a rise in the general price level over time, commonly measured using a weighted basket. One vegetable becoming expensive does not by itself show how all prices changed. Households experience different effects because they buy different things.",
     "Compare the cost of a similar basket across time, including quantities and quality. A smaller pack at the same price raises the unit cost. Inflation does not physically deduct money from your account, but a given amount may buy fewer goods and services."],
    "A Lucknow learner compares a hypothetical basket costing ₹1,000 last year with the same quantities costing ₹1,060 now. That basket rose 6%; it is not a claim about India's current inflation rate.",
    ["Inflation concerns broad price changes over time.", "Compare like quantities and unit prices.", "Your spending basket can differ from the published index."],
    "Record unit prices for three regular purchases and compare like-for-like next month.", ["rbi"], [
      q("ei1", "A basket rises from ₹1,000 to ₹1,060. Increase?", ["60%", "6%", "0.6%"], 1, "₹60 divided by ₹1,000 is 0.06, or 6%."),
      q("ei2", "Same price, smaller pack means what?", ["Always better value", "No price change per unit", "Higher price per unit"], 2, "You receive less quantity for the same spending."),
      q("ei3", "Does one tomato price prove overall inflation?", ["No; broader measures use a basket", "Yes, always", "Only if a shopkeeper says so"], 0, "An individual price may change for reasons that do not represent the general price level."),
    ], "economy"),
  lesson("economy-interest", "Economy", "Interest rates: what changes and when",
    "Identify how interest and contract terms affect borrowing and saving.",
    ["Interest is the price of borrowing money or the return paid on certain savings. The amount depends on the principal, rate, time and calculation method. Compounding means interest can itself earn interest or add to debt.",
     "RBI policy rates influence financial conditions, but a change does not instantly or equally change every loan and deposit. Fixed and floating arrangements differ. For a floating loan, read the benchmark, spread and reset date; compare total cost, fees and repayment terms rather than only a headline rate."],
    "For a hypothetical ₹10,000 deposit at 5% simple annual interest for one year, interest is ₹500 before applicable tax or fees. This is a calculation example, not a bank offer.",
    ["Rate, duration and calculation method matter.", "Fixed and floating contracts respond differently.", "Check total cost and reset terms."],
    "Find the rate type and reset clause in a sample loan disclosure; do not share account information.", ["rbi", "banking"], [
      q("er1", "One year simple interest on ₹10,000 at 5%?", ["₹50", "₹500", "₹5,000"], 1, "Principal × rate × time = ₹10,000 × 0.05 × 1."),
      q("er2", "A policy rate changes. What can you assume?", ["All EMIs immediately halve", "Every deposit gets the same rate", "Effects depend on the contract and timing"], 2, "Transmission and reset conditions vary."),
      q("er3", "What helps compare loans?", ["Total cost, fees and repayment terms", "Only the advertisement colour", "Only the monthly payment without duration"], 0, "A smaller EMI over a longer period may still cost more in total."),
    ], "economy"),
  lesson("economy-purchasing-power", "Economy", "Your balance versus purchasing power",
    "Distinguish nominal money growth from real purchasing power.",
    ["A nominal return describes growth in rupees. A real return adjusts that growth for inflation: (1 + nominal rate) ÷ (1 + inflation rate) − 1. Subtracting inflation from interest is a useful rough estimate, not the exact formula.",
     "Taxes, charges and risk also affect what you keep. A higher advertised return is not automatically suitable, especially for money needed soon. Separate an accessible emergency reserve from longer-horizon investments and consider your circumstances rather than chasing an unsupported guarantee."],
    "With hypothetical 3% interest and 7% inflation, ₹1,00,000 becomes ₹1,03,000. Dividing by 1.07 gives roughly ₹96,262 in earlier purchasing power, before fees and tax; no ₹7,000 was removed from the account.",
    ["Nominal growth can coexist with real loss.", "Use the inflation-adjusted comparison.", "Liquidity and risk matter alongside return."],
    "Calculate a hypothetical inflation-adjusted return and list when you might need the money.", ["rbi"], [
      q("ep1", "Interest below inflation can mean what?", ["Automatic bank theft", "More rupees but lower purchasing power", "Guaranteed real profit"], 1, "Prices can rise faster than your balance."),
      q("ep2", "Which is the exact real-return calculation?", ["Interest + inflation", "Inflation divided by principal", "(1 + nominal rate) / (1 + inflation rate) − 1"], 2, "The ratio compares growth in money with growth in prices."),
      q("ep3", "Money needed in weeks should prioritise what?", ["Access and capital stability suited to the need", "The highest unverified promise", "A single volatile stock"], 0, "Short-term needs leave little time to recover from market losses."),
    ], "economy"),
  lesson("health-insurance", "Health", "Insurance: cover is not the whole story",
    "Read important coverage conditions before relying on a headline sum insured.",
    ["Health insurance shares eligible medical costs under a contract. Sum insured is not a promise that every expense is covered. Waiting periods, exclusions, room limits, deductibles and co-payments can affect the claim. Cashless processing does not necessarily mean zero out-of-pocket cost.",
     "Check the policy wording and customer information sheet, network arrangements, authorisation process and claim contacts. Ask the insurer to explain unclear terms. Do not delay clinically necessary emergency treatment while comparing benefits; seek help with claims alongside care."],
    "In an illustrative policy with a 20% co-pay, an admissible ₹50,000 bill could leave ₹10,000 as the learner's share, plus any excluded costs. Actual liability depends on the policy.",
    ["Read conditions as well as sum insured.", "Cashless is not the same as free.", "Emergency care should not wait for a comparison exercise."],
    "Locate the exclusions, co-pay and claims contact in a sample policy.", ["insurance"], [
      q("hi1", "Does a large sum insured cover every charge?", ["Yes, without conditions", "No; policy terms still apply", "Only on weekends"], 1, "Limits, exclusions and cost-sharing remain relevant."),
      q("hi2", "20% of an admissible ₹50,000 bill is?", ["₹1,000", "₹50,000", "₹10,000"], 2, "0.20 × ₹50,000 = ₹10,000; excluded costs may be additional."),
      q("hi3", "What should not be delayed for policy comparison?", ["Necessary emergency treatment", "Reading a non-urgent brochure", "Saving a sample quotation"], 0, "Clinical urgency takes priority; seek claims assistance alongside care."),
    ], "health"),
  lesson("health-nutrition", "Health", "Read food labels, not just slogans",
    "Use food labels and varied meals to make better-informed everyday choices.",
    ["A front-of-pack claim describes only part of a food. Read ingredients, serving size and the nutrition panel. Compare the same quantity, such as per 100 g, and then consider the portion you actually eat. 'No added sugar' does not mean no sugar or no carbohydrate.",
     "General nutrition guidance favours varied meals with vegetables, fruit, pulses and other appropriate nutrient sources, while limiting frequent highly processed foods high in salt, sugar or unhealthy fats. Needs differ by age, health and circumstance; a label or supplement is not a personalised treatment plan."],
    "A Mysuru student compares two snacks per 100 g, then notices their usual packet contains two labelled servings. The nutrients for the full packet are twice the per-serving values.",
    ["Check portion size and ingredients.", "Compare equal quantities.", "A balanced pattern matters more than one marketing claim."],
    "Compare two snack labels for serving size, sugar and sodium without treating either as a medical recommendation.", ["nutrition"], [
      q("hn1", "'No added sugar' guarantees what?", ["No carbohydrates", "Not that the food is sugar-free or unlimited", "No calories"], 1, "Naturally occurring sugars and other carbohydrates can still be present."),
      q("hn2", "A packet has two servings. You eat all of it. What then?", ["Count half a serving", "Ignore the panel", "Double per-serving nutrient amounts"], 2, "Your intake depends on the quantity actually eaten."),
      q("hn3", "What is a fair label comparison?", ["The same quantity for both foods", "One large pack versus one tiny serving", "Only the front slogan"], 0, "Equal quantities avoid misleading comparisons."),
    ], "health"),
  lesson("health-medical-care", "Health", "Navigate care with better questions",
    "Prepare for care and understand a treatment discussion safely.",
    ["A consultation is easier when you bring symptoms and their timing, current medicines, allergies and relevant records. Ask what the proposed treatment is for, its benefits and risks, alternatives, likely costs and warning signs that require urgent help. Ask for clarification in a language you understand.",
     "Do not self-diagnose from a lesson or stop prescribed medicines on your own. Ask a qualified clinician or pharmacist before changing a drug, dose or formulation. If symptoms seem severe or rapidly worsening, seek urgent professional assessment rather than waiting for an online answer or a price comparison."],
    "Before a non-emergency visit in Kochi, a learner writes when symptoms began and brings a medicine list. They ask the clinician what follow-up is needed and confirm the instructions rather than guessing the dose.",
    ["Bring a clear history and medication list.", "Ask about options and follow-up.", "Urgent symptoms need professional assessment."],
    "Prepare a blank appointment checklist with space for symptoms, medicines, questions and follow-up; keep personal medical information private.", ["care", "nutrition"], [
      q("hm1", "What is useful before a consultation?", ["A random online diagnosis alone", "Symptoms, timing, medicines and allergies", "Someone else's prescription"], 1, "A relevant history helps qualified professionals assess care."),
      q("hm2", "Can you replace a prescribed medicine yourself?", ["Always if cheaper", "If its colour matches", "Ask a qualified clinician or pharmacist first"], 2, "Ingredient, strength, formulation and clinical circumstances matter."),
      q("hm3", "Severe, rapidly worsening symptoms need what?", ["Urgent professional assessment", "A lesson quiz first", "A long wait for social-media replies"], 0, "Educational content cannot assess an emergency."),
    ], "health"),
  lesson("finance-banking", "Finance", "A bank account that fits your needs",
    "Compare account terms and protect access to everyday banking.",
    ["A bank account helps receive, hold and transfer money, but account types differ. Compare minimum balance, service fees, transaction limits, access and eligibility. RBI's basic banking resources describe basic savings options; check the actual bank's current conditions rather than assuming every account has identical benefits.",
     "Keep credentials private and use official bank channels. A bundled insurance or investment product is a separate decision with its own costs and risks. Ask for written information and time to compare; pressure at a counter is not a reason to buy something you do not understand."],
    "A Nagpur first-job learner compares an eligible basic savings option with a salary account and asks what changes if salary credits stop. They assess an offered insurance product separately.",
    ["Compare fees and conditions in writing.", "Check eligibility and transaction limits.", "Banking, insurance and investment choices are separate."],
    "Create an account-comparison checklist using public bank documents, without sharing your credentials.", ["banking", "rbi"], [
      q("fb1", "What should you compare when opening an account?", ["Only a free gift", "Fees, eligibility, balance rules and access", "Only the salesperson's confidence"], 1, "An account should fit your use and its conditions."),
      q("fb2", "A bundled investment is offered. What next?", ["Buy without reading", "Assume it is compulsory everywhere", "Assess costs and suitability separately"], 2, "A sales bundle does not establish a product's suitability."),
      q("fb3", "Where should you seek account support?", ["Official bank channels", "A stranger asking for an OTP", "An unsolicited screen-sharing caller"], 0, "Use independently verified official contacts and never disclose credentials."),
    ], "finance"),
  lesson("finance-budget-tax", "Finance", "Budget your take-home, understand your taxes",
    "Build a workable budget and recognise why gross salary is not take-home pay.",
    ["A budget allocates expected take-home income to essentials, flexible spending, debt payments and savings. Track actual spending and allow for irregular costs rather than using a rigid percentage as a universal rule. A shortfall calls for revising the plan, not hiding expenses.",
     "Gross salary can differ from take-home because of tax withholding and applicable contributions or deductions. Tax withheld is not necessarily the final liability. India's tax regimes and filing requirements depend on the relevant financial and assessment year and your circumstances. Use current Income Tax Department information and qualified advice; this lesson gives no current slab rates."],
    "In a hypothetical monthly budget, ₹30,000 take-home less ₹18,000 essentials and ₹6,000 other planned spending leaves ₹6,000 for savings or additional needs. The learner checks a sample payslip rather than budgeting from a higher gross figure.",
    ["Budget with take-home and real expenses.", "Allow for irregular needs.", "Check tax rules for the correct year and situation."],
    "Draft a fictional monthly budget and identify the financial year on a sample tax resource.", ["tax", "rbi"], [
      q("ft1", "₹30,000 minus ₹18,000 and ₹6,000 leaves?", ["₹12,000", "₹6,000", "₹24,000"], 1, "₹30,000 − ₹18,000 − ₹6,000 = ₹6,000."),
      q("ft2", "Which tax regime is always best for everyone?", ["The old regime", "The new regime", "Neither; compare applicable rules and circumstances"], 2, "The right assessment depends on the relevant year's rules and personal situation."),
      q("ft3", "What income should an everyday budget start with?", ["Expected take-home, then reconcile actual receipts", "Gross pay ignoring deductions", "An unconfirmed bonus"], 0, "Spending plans need money actually available after deductions."),
    ], "finance"),
  lesson("finance-digital-safety", "Finance", "UPI: receiving money never needs your PIN",
    "Recognise payment authorisation and respond safely to suspicious requests.",
    ["A UPI PIN authorises an outgoing debit; you do not enter it just to receive money. Read the app's amount, recipient and action before approving. A collect request asks you to pay, even if a caller describes it as a refund. Scanning a QR generally starts a payment flow, not a guaranteed receipt.",
     "Never share a PIN, OTP or screen with a caller. Open the official app yourself and independently verify a contact. If you suspect fraud, contact your bank or payment provider promptly and use official cybercrime reporting channels; fast reporting can help but recovery is not guaranteed."],
    "A learner in Indore is promised a ₹500 marketplace refund but receives a ₹500 collect request. They reject it and contact support through the official app instead of the caller's link.",
    ["PIN authorises outgoing payment.", "Check amount, recipient and action.", "Report suspected fraud promptly through official channels."],
    "Locate your payment app's reporting channel and explain the receive-without-PIN rule to someone using a fictional example.", ["upi", "banking"], [
      q("fd1", "A caller says enter your UPI PIN to receive a refund. What do you do?", ["Enter it quickly", "Reject the request and verify independently", "Share your screen"], 1, "A PIN authorises a debit; receiving money does not require it."),
      q("fd2", "What does a collect request ask you to do?", ["Receive a guaranteed refund", "Verify your age", "Authorise a payment"], 2, "The recipient of the request is being asked to pay."),
      q("fd3", "After suspected fraud, what helps?", ["Promptly contact official bank/provider and reporting channels", "Pay another fee to an unknown recovery agent", "Share the OTP to cancel the loss"], 0, "Act quickly through verified channels, but do not assume recovery is guaranteed."),
    ], "finance"),
];

export const publicQuestion = ({ answer: _answer, explanation: _explanation, ...question }: AuthoredQuestion): LearningQuestion => question;
export const publicLibrary = learningLessons.map((l) => ({ ...l, questions: l.questions.map(publicQuestion) }));

// Versioned, reusable mixed-subject bank derived from authored learning checks.
// Never change a published version: introduce v2 if assignments/content change.
export function dailyAssignment(day: string) {
  const seed = Number(day.replaceAll("-", ""));
  const subjects = ["Politics", "Government", "Ethics", "Economy", "Health", "Finance"];
  const questions = Array.from({ length: 5 }, (_, i) => {
    const subject = subjects[(seed + i) % subjects.length]!;
    const bank = learningLessons.filter((l) => l.subject === subject).flatMap((l) => l.questions);
    return bank[(seed * 7 + i * 13) % bank.length]!;
  });
  return { id: `daily-v1-${day}`, day, timezone: "Asia/Kolkata", questions };
}
