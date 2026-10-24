import type { Track, Lesson, Language } from "./lifewise-types";

function step(title: string, situation: string, choices: string[]) {
  return { title, situation, choices: choices.map((text, i) => ({ id: String(i), text })) };
}

export const tracks: Track[] = [
  {
    id: "finance", name: "Finance",
    title: "Your First Bank Account & ₹50,000 Paycheck",
    description: "Outsmart bank sales pitches, understand your payslip, and spot a UPI trap before it costs you.",
    difficulty: "Beginner", duration: "60 seconds", impactLabel: "₹ illustrative savings",
    skills: ["Banking basics", "Salary & taxes", "UPI safety"],
    steps: [
      step("The bank clerk's big pitch", "Your first ₹50,000 paycheck just arrived. A bank clerk recommends an account requiring ₹10,000 minimum balance and a bundled ULIP. You want low fees and flexibility. What do you choose?", [
        "Take the minimum-balance account and bundled ULIP without comparing charges.",
        "Ask about an eligible zero-balance BSBD account. Compare insurance and investments separately.",
        "Keep all the money as cash at home so no bank can charge fees.",
      ]),
      step("Your payslip is not your take-home", "HR asks you to choose a tax regime. Your payslip also lists an EPF deduction. What is your next step?", [
        "Always choose the old regime; it is automatically cheaper.",
        "Ask HR to stop all EPF contributions so you receive more cash.",
        "Compare both regimes using current-year rules and your deductions. Check EPF eligibility and employer contributions.",
      ]),
      step("The refund that asks for your PIN", "A caller promises a ₹5,000 refund. They send you a UPI Collect request and say you must enter your PIN to receive it. What do you do?", [
        "Reject the collect request. A PIN authorizes an outgoing payment, not a refund. Verify through the official app.",
        "Enter the PIN quickly before the refund expires.",
        "Share your screen and let the caller guide you.",
      ]),
    ],
  },
  {
    id: "economy", name: "Economy",
    title: "Beat the Silent Thief: Inflation & Interest Rates",
    description: "Protect your purchasing power and understand what RBI rate changes really mean for your money.",
    difficulty: "Beginner", duration: "60 seconds", impactLabel: "₹ illustrative purchasing power",
    skills: ["Inflation", "Interest rates", "Emergency funds"],
    steps: [
      step("The silent thief", "You have ₹1,00,000 saved. Prices rise by 7% in a year, while your savings account earns 3%. What happens?", [
        "Your balance rises, so you are definitely richer.",
        "Your money grows to ₹1,03,000, but buys less: inflation is higher than your interest rate.",
        "Inflation removes exactly ₹7,000 from your bank balance.",
      ]),
      step("RBI raises the repo rate", "The RBI increases the repo rate. Your family has a floating-rate education loan and is considering a new fixed deposit. What should you check?", [
        "Loan EMIs and FD rates can never change.",
        "Borrow more immediately because all loans become cheaper.",
        "Check the loan reset date and EMI or tenure impact; compare new FD yields and terms.",
      ]),
      step("An emergency is not an investment horizon", "You may need emergency money within three months. A friend says put all of it in equity for high returns.", [
        "Keep an accessible emergency reserve in suitable savings or deposits; invest only longer-term money in diversified equity.",
        "Put everything in one stock.",
        "Borrow money to invest so returns will be larger.",
      ]),
    ],
  },
  {
    id: "health", name: "Health",
    title: "Midnight Hospital Admission & Insurance Trap",
    description: "Decode fine print in health cover, make safer hospital decisions, and read beyond a healthy-food label.",
    difficulty: "Intermediate", duration: "60 seconds", impactLabel: "Health readiness points",
    skills: ["Insurance fine print", "Medicine literacy", "Nutrition labels"],
    steps: [
      step("A room with a hidden cost", "Your policy covers ₹5 lakh, with a room-rent limit of 1% of the sum insured per day. A ₹9,000/day room is offered. Emergency treatment must not be delayed. What do you ask?", [
        "Choose ₹9,000 because the total policy cover is large.",
        "Ask for a clinically suitable room within ₹5,000/day and confirm insurer terms, including any proportionate deduction.",
        "Refuse urgent care until the insurer sends written approval.",
      ]),
      step("The medicine counter", "The bill includes a branded drug and your policy has a 20% co-pay. A friend says any cheaper pill will do.", [
        "Stop the medicine and buy a different dose online.",
        "Assume cashless insurance means you will pay nothing.",
        "Ask the clinician or pharmacist about an equivalent approved generic. Check exclusions and budget for your co-pay.",
      ]),
      step("The 'healthy' snack", "A snack says 'no added sugar', but the ingredients include maltodextrin and the nutrition panel shows carbohydrates. How do you decide?", [
        "Read ingredients, portion size, total sugars and carbohydrates. A marketing claim alone does not establish nutrition quality.",
        "Eat unlimited portions because no added sugar means no carbohydrates.",
        "Ignore the nutrition panel and trust the front-of-pack slogan.",
      ]),
    ],
  },
  {
    id: "civic", name: "Politics & Civic Sense",
    title: "Fix Your Neighbourhood: Civic Action Simulator",
    description: "Find the right local authority, ask better public-interest questions, and stop misinformation.",
    difficulty: "Beginner", duration: "60 seconds", impactLabel: "Civic readiness points",
    skills: ["Local government", "RTI literacy", "Fact checking"],
    steps: [
      step("The dangerous open drain", "An uncovered drain near your school puts pedestrians at risk. You need a documented response. Whom do you approach first?", [
        "Only the Member of Parliament; local authorities do not handle drains.",
        "Report to the responsible municipal authority or ward office with location, photo and complaint number. Escalate urgent danger.",
        "Enter the drain and repair it yourself.",
      ]),
      step("Where did the road funds go?", "You want records of road repair expenditure. You are considering a Right to Information request.", [
        "Write an abusive demand for an explanation to any politician.",
        "Pay a stranger who promises a confidential government leak.",
        "Identify the relevant public information officer, request specific records and dates, and check the applicable fee (often ₹10) and exemptions.",
      ]),
      step("A viral forward arrives", "A dramatic post claims a new civic rule and urges everyone to forward it immediately.", [
        "Check the original source, date, context and official notice before sharing. Do not amplify unverified claims.",
        "Forward first because the group trusts you.",
        "Believe it because it has many shares.",
      ]),
    ],
  },
  {
    id: "ethics", name: "Ethics",
    title: "The High-Stakes Moral Compass",
    description: "Practice difficult conversations, responsible AI use, and speaking up when safety is on the line.",
    difficulty: "Intermediate", duration: "60 seconds", impactLabel: "Integrity readiness points",
    skills: ["Workplace integrity", "AI responsibility", "Speaking up"],
    steps: [
      step("A leak before launch", "You discover that a teammate accidentally exposed customer data just before launch. They ask you to keep quiet.", [
        "Delete evidence and hope nobody notices.",
        "Limit access without spreading the data, preserve appropriate evidence, and report through the security or incident channel.",
        "Post the leaked data publicly to prove the issue.",
      ]),
      step("A very convincing fake", "A classmate offers an AI-generated video impersonating your teacher to excuse a missed assignment.", [
        "Use it because nobody will know.",
        "Send the fake to more classmates for feedback.",
        "Decline the deception, explain the situation honestly and use AI only with permission and disclosure.",
      ]),
      step("Loyalty versus safety", "A manager asks you to conceal a known product safety issue to protect the launch. What do you do?", [
        "Document facts and raise the risk through appropriate safety or protected reporting channels; avoid unnecessary disclosure of personal data.",
        "Stay silent to protect your team's reputation.",
        "Make unverified public accusations before preserving facts.",
      ]),
    ],
  },
];

const explanations = [
  "A BSBD account can avoid a minimum-balance requirement, subject to eligibility and account limits. Compare ULIP costs, lock-ins, insurance needs and investment risk separately; term cover and index funds are not automatic recommendations.",
  "The right tax regime depends on current financial-year rules, income and eligible deductions. EPF is retirement saving with employer and employee contributions where applicable; verify your payslip and EPFO records.",
  "A UPI PIN authorizes a debit. Receiving money does not require entering it. Reject suspicious collect requests, never share a PIN or screen, and report fraud promptly through official channels such as 1930.",
  "With 3% interest and 7% inflation, ₹1,00,000 becomes ₹1,03,000 but has purchasing power of about ₹96,262 in today's rupees. Real return is approximately -3.74%; your nominal balance is not directly reduced.",
  "A repo-rate hike can feed into floating-rate loan costs and new deposit yields, but timing and contract terms matter. Review your lender's reset rules before changing a loan or locking a deposit.",
  "Emergency reserves should prioritize accessibility and capital stability. Equity can fall when you need cash; diversify longer-term investments according to your circumstances and risk tolerance.",
  "One percent of ₹5 lakh is ₹5,000 per day. Exceeding a room-rent sub-limit may trigger proportionate deductions under some policies. Check the wording and seek insurer support without delaying necessary emergency care.",
  "A 20% co-pay means you may owe 20% of admissible covered costs, plus exclusions. Ask a qualified professional about an equivalent generic with the same active ingredient, strength and formulation; do not change prescribed treatment yourself.",
  "No added sugar does not mean sugar-free or carbohydrate-free. Maltodextrin contributes carbohydrate; read serving size, ingredients and the full nutrition panel rather than relying only on marketing claims.",
  "Drain maintenance is usually a local municipal responsibility. A dated complaint with the precise location and reference number supports follow-up. Keep yourself safe, and use emergency services for immediate danger.",
  "RTI requests seek existing records, not a forced opinion. Identify the right public authority and PIO, specify the period and documents, and check jurisdiction-specific fees, exemptions and appeal rules.",
  "A viral post is not proof. Verify the original source, date and context against official notices or reputable fact-checkers before sharing; corrections reduce harm.",
  "Contain exposure and escalate through the appropriate incident process. Do not circulate customer data or destroy evidence. Responsible reporting protects affected people as well as your team.",
  "Creating a deceptive impersonation can harm trust, privacy and consent. Use AI with disclosure and follow your institution's rules; an honest request is safer than a deepfake.",
  "Loyalty does not require hiding safety risks. Preserve factual records and use suitable safety, compliance or protected reporting channels. Avoid speculation and unnecessary exposure of personal information.",
];

const impacts = [[0,10000,-1000],[-1000,-2000,2000],[5000,-5000,-10000],[0,4000,-1000],[0,-4000,2000],[3000,-6000,-8000],[0,35,-20],[-15,0,35],[30,-10,0],[0,35,-20],[-15,-20,35],[30,-10,0],[-20,35,-20],[-15,-10,35],[30,-15,-10]];
const best = [1,2,0];
const actionKits: Record<string, string[]> = {
  finance: ["Compare a BSBD account's eligibility, fees and transaction limits with your bank; do not buy bundled products under pressure.", "Review a sample payslip, EPF contributions and both current-year tax regimes with a qualified adviser or HR.", "Check your UPI app's collect-request settings and share the rule: receiving money never requires your UPI PIN."],
  economy: ["List your savings interest rates and compare purchasing power after inflation, fees and taxes.", "Read your loan's reset clause and compare deposit terms without making a rushed switch.", "Write an emergency-fund target and keep it accessible, separate from long-term equity investments."],
  health: ["Find the room-rent, co-pay, exclusions and emergency contact sections in your actual policy.", "Ask your clinician or pharmacist how to check approved generic equivalents without changing treatment yourself.", "Compare serving size, total sugars and carbohydrates on two snack labels."],
  civic: ["Find the official local municipal complaint channel and save your ward office details.", "Draft a precise RTI request for a public record, confirming the relevant authority, fee and exemptions.", "Verify the next viral forward's original source and date before sharing it."],
  ethics: ["Save your institution's security incident or protected reporting contact without copying sensitive data.", "Write a personal rule for AI disclosure, consent and impersonation, then discuss it with a mentor.", "Practice a factual, respectful way to raise a safety concern through the proper channel."],
};

export const lessons: Record<string, Lesson> = Object.fromEntries(tracks.map((t, ti) => [t.id, {
  actions: actionKits[t.id]!,
  answers: t.steps.map((_s, si) => [0,1,2].map((ci) => ({
    impact: impacts[ti * 3 + si]![ci]!,
    quality: ci === best[si] ? 100 : ci === (best[si]! + 1) % 3 ? 30 : 10,
    feedback: explanations[ti * 3 + si]!,
  }))),
}]));

// Human-authored concise coaching for all preloaded lessons. Original English
// explanations remain visible so financial/health caveats are never hidden.
const localized: Record<Exclude<Language, "English">, string[]> = {
  Hinglish: [
    "BSBD account mein minimum balance ki zaroorat nahi ho sakti, lekin eligibility aur limits check karo. ULIP ke charges aur lock-in ko insurance aur investment se alag compare karo.",
    "Old ya New tax regime current-year rules, income aur deductions par depend karta hai. Payslip aur EPFO records mein employee aur employer contribution check karo.",
    "UPI PIN se paisa bheja jaata hai, receive nahi. Collect request reject karo; PIN aur screen share mat karo. Fraud ko official channel ya 1930 par report karo.",
    "3% interest se ₹1 lakh, ₹1.03 lakh hota hai; 7% inflation ke baad aaj ki purchasing power lagbhag ₹96,262 hai. Balance badhna hamesha ameer hona nahi hai.",
    "Repo rate badhne par floating loan aur naye FD rates badal sakte hain. Reset date, EMI, tenure aur terms check karo.",
    "Emergency fund aasani se accessible aur stable rakho. Equity mein short-term loss ho sakta hai; sirf long-term money ka risk lo.",
    "₹5 lakh ka 1% = ₹5,000 per day. Room limit cross karne par kuch policies mein proportionate deduction ho sakta hai. Emergency care delay mat karo.",
    "20% co-pay mein admissible bill ka 20% aapko dena pad sakta hai, exclusions alag. Generic ke liye doctor ya pharmacist se poochho; treatment khud mat badlo.",
    "No added sugar ka matlab no carbs nahi. Maltodextrin carbohydrate deta hai. Ingredients, serving size aur nutrition panel padho.",
    "Open drain ke liye responsible municipal ya ward office ko photo, exact location aur complaint number ke saath report karo. Khud unsafe repair mat karo.",
    "RTI mein existing records maango; correct PIO, dates aur documents specify karo. Fee, exemptions aur appeal rules check karo.",
    "Viral hona proof nahi. Original source, date aur official notice verify karke hi forward karo.",
    "Data leak ko contain karke official security channel par report karo. Customer data circulate ya evidence delete mat karo.",
    "Deceptive deepfake trust aur consent ko harm karta hai. AI ko disclosure aur institution ke rules ke saath use karo.",
    "Loyalty ka matlab safety risk chhupana nahi. Facts document karo aur appropriate safety ya protected reporting channel use karo.",
  ],
  Hindi: [
    "BSBD खाते में न्यूनतम शेष की शर्त नहीं हो सकती, पर पात्रता और सीमाएँ जाँचें। ULIP के शुल्क और लॉक-इन को बीमा तथा निवेश की जरूरतों से अलग समझें।",
    "सही कर व्यवस्था चालू वित्त वर्ष के नियम, आय और कटौतियों पर निर्भर है। वेतन पर्ची और EPFO में कर्मचारी व नियोक्ता का योगदान जाँचें।",
    "UPI PIN भुगतान भेजने के लिए है, पैसा पाने के लिए नहीं। संदिग्ध कलेक्ट अनुरोध अस्वीकार करें। PIN या स्क्रीन साझा न करें; धोखाधड़ी पर आधिकारिक माध्यम या 1930 से संपर्क करें।",
    "3% ब्याज पर ₹1 लाख बढ़कर ₹1.03 लाख होता है। 7% महँगाई के बाद आज की क्रय शक्ति लगभग ₹96,262 है। बढ़ा हुआ शेष हमेशा वास्तविक लाभ नहीं है।",
    "रेपो दर बढ़ने पर फ्लोटिंग ऋण और नई FD की दरें बदल सकती हैं। रीसेट तारीख, EMI, अवधि और शर्तें जाँचें।",
    "आपातकालीन धन सुलभ और अपेक्षाकृत स्थिर रखें। जरूरत के समय शेयर गिर सकते हैं; लंबे समय के निवेश को अलग रखें।",
    "₹5 लाख का 1% प्रतिदिन ₹5,000 है। कमरे की सीमा पार करने पर कुछ पॉलिसियों में अनुपातिक कटौती हो सकती है। जरूरी आपातकालीन इलाज न टालें।",
    "20% को-पे में स्वीकृत खर्च का 20% और अपवर्जित खर्च आपको देना पड़ सकता है। समकक्ष जेनेरिक के लिए डॉक्टर या फार्मासिस्ट से पूछें; इलाज स्वयं न बदलें।",
    "अतिरिक्त चीनी नहीं होने का अर्थ कार्बोहाइड्रेट नहीं होना नहीं है। माल्टोडेक्सट्रिन भी कार्बोहाइड्रेट है। मात्रा, सामग्री और पोषण तालिका पढ़ें।",
    "खुले नाले की शिकायत संबंधित नगरपालिका या वार्ड कार्यालय में फोटो, सही स्थान और शिकायत संख्या के साथ करें। स्वयं जोखिम न लें।",
    "RTI में उपलब्ध अभिलेख माँगें। सही लोक सूचना अधिकारी, तारीखें और दस्तावेज स्पष्ट करें; लागू शुल्क, छूट और अपील नियम जाँचें।",
    "वायरल संदेश प्रमाण नहीं है। आगे भेजने से पहले मूल स्रोत, तारीख और आधिकारिक सूचना की पुष्टि करें।",
    "डेटा का प्रसार रोककर सुरक्षा चैनल में सूचना दें। ग्राहक का डेटा साझा न करें और सबूत न मिटाएँ।",
    "भ्रामक डीपफेक भरोसे और सहमति को नुकसान पहुँचाता है। AI का उपयोग पारदर्शिता और संस्था के नियमों के साथ करें।",
    "वफादारी का अर्थ सुरक्षा जोखिम छिपाना नहीं है। तथ्य दर्ज करें और उचित सुरक्षा या संरक्षित शिकायत चैनल का उपयोग करें।",
  ],
  Kannada: [
    "BSBD ಖಾತೆಗೆ ಕನಿಷ್ಠ ಶಿಲ್ಕು ಬೇಕಾಗದಿರಬಹುದು; ಅರ್ಹತೆ ಮತ್ತು ಮಿತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ULIP ಶುಲ್ಕ, ಲಾಕ್-ಇನ್, ವಿಮೆ ಮತ್ತು ಹೂಡಿಕೆಯ ಅಗತ್ಯಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಹೋಲಿಸಿ.",
    "ತೆರಿಗೆ ಪದ್ಧತಿಯ ಆಯ್ಕೆ ಪ್ರಸಕ್ತ ವರ್ಷದ ನಿಯಮ, ಆದಾಯ ಮತ್ತು ಕಡಿತಗಳ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ. ವೇತನ ಚೀಟಿ ಮತ್ತು EPFO ಯಲ್ಲಿ ಎರಡೂ ಕೊಡುಗೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "UPI PIN ಹಣ ಕಳುಹಿಸಲು, ಪಡೆಯಲು ಅಲ್ಲ. ಅನುಮಾನಾಸ್ಪದ collect ವಿನಂತಿ ತಿರಸ್ಕರಿಸಿ. PIN ಅಥವಾ ಪರದೆ ಹಂಚಬೇಡಿ; ವಂಚನೆಯನ್ನು ಅಧಿಕೃತವಾಗಿ ಅಥವಾ 1930 ಗೆ ವರದಿ ಮಾಡಿ.",
    "3% ಬಡ್ಡಿಯಿಂದ ₹1 ಲಕ್ಷ ₹1.03 ಲಕ್ಷವಾಗುತ್ತದೆ. 7% ಹಣದುಬ್ಬರದ ಬಳಿಕ ಇಂದಿನ ಖರೀದಿ ಸಾಮರ್ಥ್ಯ ಸುಮಾರು ₹96,262. ಶಿಲ್ಕಿನ ಹೆಚ್ಚಳ ನಿಜವಾದ ಲಾಭವಲ್ಲ.",
    "ರೆಪೊ ದರ ಏರಿದರೆ ತೇಲುವ ಬಡ್ಡಿಯ ಸಾಲ ಮತ್ತು ಹೊಸ FD ದರ ಬದಲಾಗಬಹುದು. ಮರುಹೊಂದಿಸುವ ದಿನಾಂಕ, EMI ಮತ್ತು ಷರತ್ತು ಪರಿಶೀಲಿಸಿ.",
    "ತುರ್ತು ನಿಧಿ ಸುಲಭವಾಗಿ ಸಿಗುವಂತೆ ಮತ್ತು ಸ್ಥಿರವಾಗಿರಲಿ. ಬೇಕಾದ ಸಮಯದಲ್ಲಿ ಷೇರು ಮೌಲ್ಯ ಕುಸಿಯಬಹುದು; ದೀರ್ಘಕಾಲದ ಹೂಡಿಕೆ ಪ್ರತ್ಯೇಕವಾಗಿರಲಿ.",
    "₹5 ಲಕ್ಷದ 1% ದಿನಕ್ಕೆ ₹5,000. ಕೊಠಡಿ ಮಿತಿ ಮೀರಿದರೆ ಕೆಲವು ಪಾಲಿಸಿಗಳಲ್ಲಿ ಅನುಪಾತದ ಕಡಿತ ಇರಬಹುದು. ಅಗತ್ಯ ತುರ್ತು ಚಿಕಿತ್ಸೆ ವಿಳಂಬಿಸಬೇಡಿ.",
    "20% co-pay ಎಂದರೆ ಸ್ವೀಕೃತ ವೆಚ್ಚದ 20% ಮತ್ತು ಹೊರತುಪಡಿಸಿದ ಖರ್ಚು ನಿಮ್ಮದಾಗಬಹುದು. ಸಮಾನ ಜೆನೆರಿಕ್ ಬಗ್ಗೆ ವೈದ್ಯರನ್ನು ಕೇಳಿ; ಚಿಕಿತ್ಸೆ ಸ್ವತಃ ಬದಲಿಸಬೇಡಿ.",
    "ಸೇರಿಸಿದ ಸಕ್ಕರೆ ಇಲ್ಲ ಎಂದರೆ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್ ಇಲ್ಲ ಎಂದಲ್ಲ. ಮಾಲ್ಟೋಡೆಕ್ಸ್ಟ್ರಿನ್ ಕೂಡ ಕಾರ್ಬೋಹೈಡ್ರೇಟ್. ಪದಾರ್ಥ, ಪ್ರಮಾಣ ಮತ್ತು ಪೋಷಕಾಂಶ ಪಟ್ಟಿಯನ್ನು ಓದಿ.",
    "ತೆರೆದ ಚರಂಡಿ ಬಗ್ಗೆ ಸಂಬಂಧಿತ ಪುರಸಭೆ ಅಥವಾ ವಾರ್ಡ್ ಕಚೇರಿಗೆ ಸ್ಥಳ, ಚಿತ್ರ ಮತ್ತು ದೂರು ಸಂಖ್ಯೆಯೊಂದಿಗೆ ತಿಳಿಸಿ. ಅಪಾಯಕ್ಕೆ ಹೋಗಬೇಡಿ.",
    "RTI ಮೂಲಕ ಇರುವ ದಾಖಲೆಗಳನ್ನು ಕೇಳಿ. ಸರಿಯಾದ ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿ, ಅವಧಿ ಮತ್ತು ದಾಖಲೆ ಸೂಚಿಸಿ; ಶುಲ್ಕ, ವಿನಾಯಿತಿ ಮತ್ತು ಮೇಲ್ಮನವಿ ನಿಯಮ ಪರಿಶೀಲಿಸಿ.",
    "ವೈರಲ್ ಸಂದೇಶ ಸಾಕ್ಷಿಯಲ್ಲ. ಹಂಚುವ ಮೊದಲು ಮೂಲ, ದಿನಾಂಕ ಮತ್ತು ಅಧಿಕೃತ ಪ್ರಕಟಣೆ ಪರಿಶೀಲಿಸಿ.",
    "ಡೇಟಾ ಸೋರಿಕೆಯನ್ನು ನಿಯಂತ್ರಿಸಿ ಸುರಕ್ಷತಾ ವ್ಯವಸ್ಥೆಗೆ ವರದಿ ಮಾಡಿ. ಗ್ರಾಹಕರ ಡೇಟಾ ಹಂಚಬೇಡಿ ಅಥವಾ ಸಾಕ್ಷಿ ಅಳಿಸಬೇಡಿ.",
    "ಮೋಸದ ಡೀಪ್‌ಫೇಕ್ ನಂಬಿಕೆ ಮತ್ತು ಸಮ್ಮತಿಗೆ ಹಾನಿ. AI ಬಳಕೆಯಲ್ಲಿ ಪಾರದರ್ಶಕತೆ ಮತ್ತು ಸಂಸ್ಥೆಯ ನಿಯಮ ಪಾಲಿಸಿ.",
    "ನಿಷ್ಠೆ ಎಂದರೆ ಸುರಕ್ಷತಾ ಅಪಾಯ ಮುಚ್ಚಿಡುವುದಲ್ಲ. ವಾಸ್ತವಾಂಶ ದಾಖಲಿಸಿ ಸೂಕ್ತ ಸುರಕ್ಷತಾ ಅಥವಾ ಸಂರಕ್ಷಿತ ವರದಿ ಮಾರ್ಗ ಬಳಸಿ.",
  ],
  Telugu: [
    "BSBD ఖాతాకు కనీస నిల్వ అవసరం లేకపోవచ్చు; అర్హత, పరిమితులు చూడండి. ULIP రుసుములు, లాక్-ఇన్, బీమా మరియు పెట్టుబడి అవసరాలను విడిగా పోల్చండి.",
    "పన్ను విధానం ప్రస్తుత సంవత్సర నియమాలు, ఆదాయం, మినహాయింపులపై ఆధారపడుతుంది. జీతపు చీటి, EPFO లో ఉద్యోగి మరియు యజమాని వాటాలు చూడండి.",
    "UPI PIN డబ్బు పంపడానికి, అందుకోవడానికి కాదు. అనుమానాస్పద collect అభ్యర్థన తిరస్కరించండి. PIN లేదా స్క్రీన్ పంచవద్దు; మోసం అధికారిక మార్గంలో లేదా 1930 కు తెలపండి.",
    "3% వడ్డీతో ₹1 లక్ష ₹1.03 లక్ష అవుతుంది. 7% ద్రవ్యోల్బణం తర్వాత నేటి కొనుగోలు శక్తి సుమారు ₹96,262. నిల్వ పెరగడం నిజమైన లాభం కాదు.",
    "రెపో రేటు పెరిగితే ఫ్లోటింగ్ రుణం, కొత్త FD రేట్లు మారవచ్చు. రీసెట్ తేదీ, EMI, కాలపరిమితి మరియు షరతులు చూడండి.",
    "అత్యవసర నిధి అందుబాటులో, స్థిరంగా ఉండాలి. అవసరమైనప్పుడు షేర్లు పడిపోవచ్చు; దీర్ఘకాల పెట్టుబడులను వేరుగా ఉంచండి.",
    "₹5 లక్షలలో 1% రోజుకు ₹5,000. గది పరిమితి దాటితే కొన్ని పాలసీలలో అనుపాత కోత ఉండవచ్చు. అవసరమైన అత్యవసర చికిత్స ఆలస్యం చేయవద్దు.",
    "20% co-pay అంటే ఆమోదిత ఖర్చులో 20% మరియు మినహాయించిన ఖర్చులు మీవై ఉండవచ్చు. సమాన జనరిక్ గురించి వైద్యుడిని అడగండి; మందులు మీరే మార్చవద్దు.",
    "అదనపు చక్కెర లేదు అంటే కార్బోహైడ్రేట్లు లేవని కాదు. మాల్టోడెక్స్ట్రిన్ కూడా కార్బోహైడ్రేట్. పదార్థాలు, పరిమాణం, పోషక పట్టిక చదవండి.",
    "తెరిచిన కాలువను సంబంధిత మున్సిపాలిటీ లేదా వార్డు కార్యాలయానికి స్థలం, ఫోటో, ఫిర్యాదు సంఖ్యతో నివేదించండి. స్వయంగా ప్రమాదంలో పడవద్దు.",
    "RTI లో ఉన్న రికార్డులు అడగండి. సరైన సమాచార అధికారి, తేదీలు, పత్రాలు పేర్కొనండి; రుసుము, మినహాయింపులు, అప్పీల్ నియమాలు చూడండి.",
    "వైరల్ సందేశం సాక్ష్యం కాదు. పంపేముందు అసలు మూలం, తేదీ, అధికారిక ప్రకటనను నిర్ధారించండి.",
    "డేటా వ్యాప్తిని ఆపి అధికారిక భద్రతా మార్గంలో తెలియజేయండి. వినియోగదారుల డేటా పంచవద్దు లేదా ఆధారాలు తొలగించవద్దు.",
    "మోసపూరిత డీప్‌ఫేక్ నమ్మకం, సమ్మతికి హాని. AI వాడకాన్ని వెల్లడించి సంస్థ నియమాలు పాటించండి.",
    "విధేయత అంటే భద్రతా ప్రమాదాలు దాచడం కాదు. వాస్తవాలు నమోదు చేసి సరైన భద్రతా లేదా రక్షిత నివేదిక మార్గం వాడండి.",
  ],
  Tamil: [
    "BSBD கணக்கில் குறைந்தபட்ச இருப்பு தேவையில்லாமல் இருக்கலாம்; தகுதி மற்றும் வரம்புகளைச் சரிபார்க்கவும். ULIP கட்டணம், முடக்கக் காலம், காப்பீடு மற்றும் முதலீட்டைத் தனித்தனியாக ஒப்பிடவும்.",
    "வரி முறை நடப்பு ஆண்டு விதிகள், வருமானம் மற்றும் கழிவுகளைப் பொறுத்தது. சம்பளச் சீட்டு மற்றும் EPFO வில் பணியாளர், நிறுவனப் பங்களிப்புகளைப் பார்க்கவும்.",
    "UPI PIN பணம் அனுப்புவதற்கு, பெறுவதற்கு அல்ல. சந்தேகமான collect கோரிக்கையை மறுக்கவும். PIN அல்லது திரையைப் பகிர வேண்டாம்; மோசடியை அதிகாரப்பூர்வமாக அல்லது 1930 இல் தெரிவிக்கவும்.",
    "3% வட்டியில் ₹1 லட்சம் ₹1.03 லட்சமாகும். 7% பணவீக்கத்துக்குப் பின் இன்றைய வாங்கும் திறன் சுமார் ₹96,262. இருப்பு உயர்வு உண்மையான லாபம் அல்ல.",
    "ரெப்போ வட்டி உயர்ந்தால் மாறும் வட்டிக் கடன், புதிய FD வட்டிகள் மாறலாம். மறுநிர்ணய தேதி, EMI, காலம் மற்றும் நிபந்தனைகளைப் பார்க்கவும்.",
    "அவசர நிதி எளிதில் கிடைக்கவும் நிலையாகவும் இருக்க வேண்டும். தேவையான நேரத்தில் பங்கு விலை குறையலாம்; நீண்டகால முதலீட்டைத் தனியாக வைத்திருக்கவும்.",
    "₹5 லட்சத்தின் 1% ஒரு நாளுக்கு ₹5,000. அறை வரம்பை மீறினால் சில பாலிசிகளில் விகிதாசாரக் கழிவு இருக்கலாம். தேவையான அவசர சிகிச்சையைத் தாமதிக்க வேண்டாம்.",
    "20% co-pay என்பது ஏற்கப்பட்ட செலவின் 20% மற்றும் விலக்கப்பட்ட செலவுகள் உங்களுடையதாகலாம். சமமான ஜெனரிக் பற்றி மருத்துவரைக் கேளுங்கள்; சிகிச்சையைத் தானாக மாற்றாதீர்கள்.",
    "சர்க்கரை சேர்க்கப்படவில்லை என்பது கார்போஹைட்ரேட் இல்லை என்பதல்ல. மால்டோடெக்ஸ்ட்ரினும் கார்போஹைட்ரேட். பொருட்கள், அளவு மற்றும் ஊட்டச்சத்து பட்டியலைப் படிக்கவும்.",
    "திறந்த சாக்கடை பற்றி உரிய நகராட்சி அல்லது வார்டு அலுவலகத்தில் இடம், படம், புகார் எண்ணுடன் தெரிவிக்கவும். நீங்களே ஆபத்தான பழுது பார்க்க வேண்டாம்.",
    "RTI மூலம் ஏற்கனவே உள்ள பதிவுகளைக் கேளுங்கள். சரியான தகவல் அலுவலர், காலம் மற்றும் ஆவணங்களைக் குறிப்பிடவும்; கட்டணம், விலக்கு, மேல்முறையீடு விதிகளைப் பார்க்கவும்.",
    "வைரலான செய்தி ஆதாரம் அல்ல. பகிரும் முன் மூல ஆதாரம், தேதி, அதிகாரப்பூர்வ அறிவிப்பைச் சரிபார்க்கவும்.",
    "தரவு பரவலைத் தடுத்து பாதுகாப்பு வழியில் தெரிவிக்கவும். வாடிக்கையாளர் தரவைப் பகிரவோ ஆதாரங்களை அழிக்கவோ வேண்டாம்.",
    "ஏமாற்றும் டீப்ஃபேக் நம்பிக்கை மற்றும் சம்மதத்தைப் பாதிக்கும். AI பயன்பாட்டை வெளிப்படுத்தி நிறுவன விதிகளைப் பின்பற்றவும்.",
    "விசுவாசம் என்பது பாதுகாப்பு ஆபத்தை மறைப்பதல்ல. உண்மைகளைப் பதிவு செய்து உரிய பாதுகாப்பு அல்லது பாதுகாக்கப்பட்ட புகார் வழியைப் பயன்படுத்தவும்.",
  ],
};

export function curriculumTranslation(text: string, language: Language): string | undefined {
  if (language === "English") return text;
  const i = explanations.indexOf(text);
  return i >= 0 ? localized[language][i] : undefined;
}
