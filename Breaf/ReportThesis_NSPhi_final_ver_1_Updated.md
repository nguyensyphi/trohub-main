VIETNAM NATIONAL UNIVERSITY – HO CHI MINH CITY INTERNATIONAL UNIVERSITY 
SCHOOL OF COMPUTER SCIENCE & ENGINEERING 
 
Integrating Advanced Features and Security Mechanisms in a Rental Accommodation Website 
By 
Nguyen Sy Phi – ITITIU19178
 
A thesis submitted to the School of Computer Science and Engineering in partial fulfillment of the requirements for the degree of Bachelor of Computer Science  
 
Ho Chi Minh City, Vietnam 
2025 
 
Integrating Advanced Features and Security Mechanisms in a Rental Accommodation Website 
APPROVED BY: ________________________________ ,  
Ly Tu Nga, Ph.D 
 
________________________________  
 
THESIS COMMITTEE  
(Whichever applies)  
 
ACKNOWLEDGMENTS 
 
First and foremost, I would like to express my deepest gratitude to Dr. Ly Tu Nga for her invaluable guidance, support, and encouragement throughout my thesis journey. 
To Dr. Ly Tu Nga, thank you for your dedication, insightful feedback, and constant motivation, which have been instrumental in shaping the direction of my work. Your expertise and thoughtful advice have not only enriched my research but also inspired me to strive for excellence. 
Without your mentorship and belief in my abilities, this thesis would not have been possible. I am profoundly grateful for the time and effort you devoted to helping me achieve this milestone. 
 
TABLE OF CONTENTS 
 
ACKNOWLEDGMENTS 3 
TABLE OF CONTENTS 4 
LIST OF FIGURES 6 
ABSTRACT 9 
CHAPTER 1. INTRODUCTION 10 
1.1. Background 10 
1.2. Problem Statement 10 
1.3. Scope and Objectives 11 
1.4. Assumption and Solution 12 
1.5. Structure of thesis 15 
CHAPTER 2. LITERATURE REVIEW 17 
2.1. Room Rental Websites 17 
2.2. Techniques 18 
2.3. Summarize 20 
CHAPTER 3. METHODOLOGY 22 
3.1. System Designs 22 
CHAPTER 4. IMPLEMENT AND RESULTS 48 
4.1. Implement 48 
4.2. Result 55 
CHAPTER 5. DISCUSSION AND EVALUATION 93 
4.3. Discussion 93 
4.4. Comparison 93 
4.5. Evaluation 94 
CHAPTER 6. CONCLUSION AND FUTURE WORK 96 
4.6. Conclusion 96 
4.7. Future work 96 
REFERENCES 97 

ABSTRACT 
 
In the context of rapid urbanization and persistent economic expansion in Vietnam, the necessity for affordable housing, particularly rental accommodations, constitutes an increasingly acute challenge. Consequently, issues pertaining to room rentals have emerged as a prominent subject acquiring substantial public scrutiny. 
This thesis outlines the comprehensive development of an advanced property rental web application, strategically designed to optimize the process of publishing accommodations for landlords, whilst simultaneously offering prospective tenants an intuitively structured platform for exploring available properties. Taking structural inspiration from established regional platforms such as Phongtro123.com, the system has been engineered to deliver a seamless graphical interface for landlords to administer real estate details (e.g., area, pricing, coordinates, media), alongside highly responsive filtering mechanics for tenants. Unlike traditional platforms, communication is conducted through direct offline contact rather than an integrated booking engine. 
Technologically, the platform is structured upon a modern architectural stack utilizing ReactJS and Vite, subsequently augmented with profound structural enhancements. Crucially, the system introduces Server-side Calculation and ACID Database Transactions to fortify financial workflows against Client-Side Forgery attacks. Furthermore, the frontend is vastly optimized using React.lazy() chunk splitting and Global Error Boundaries to eliminate critical rendering failures, alongside a Mobile-First Fluid architecture resolving the rigid desktop limitations of conventional designs. Authentication has also been elevated via the integration of OAuth 2.0 Identity verification. 
Through the implementation of this modernized system, the study contributes significantly to the digital real estate landscape, directly elevating the accessibility, transactional integrity, and operational efficiency of online property trading interactions. 
 
CHAPTER 1. INTRODUCTION 
 
1.1. Background 
The urban rental economy, targeting fundamental lodgings such as singular rooms and modest flats, plays a pivotal role in absorbing the residential pressure created by metropolitan influx. In developing nations like Vietnam, an enormous demographic of students and young professionals frequently migrates to major economic hubs, precipitating a steep demand for economical living spaces. Nevertheless, the traditional paradigms of seeking and leasing rooms remain highly cumbersome for all involved stakeholders. Conventional practices, comprising word-of-mouth recommendations, physical street flyers, and newspaper classifieds, are intrinsically plagued by informational opacity and ineffective cross-party communication. 
Digital platforms have increasingly superseded these obsolete methodologies, enabling property owners to digitize their portfolios while supplying tenants with streamlined discovery tools. Nevertheless, a multitude of these modern platforms suffer from structural deficiencies—ranging from poor mobile responsiveness and monolithic loading speeds to vulnerable payment protocols relying on client-trust variables. This landscape necessitates a deeply engineered, secure, and performant web solution. 
This thesis aims to bridge these structural gaps by introducing a robust digital platform catering to landlords and tenants. Highlighting modern web optimizations, security transaction mechanisms, and fluid interface responses, the project strives to modernize digital real-estate interactions at the grassroots operational level. 
 
1.2. Problem Statement 
A substantial volume of metropolitan hubs encounters systemic infrastructural barriers within the rental sector. Archaic methodologies constrain bilateral transparency and foster vast communication delays between property tenants and landlords. Tenants endure exhaustive routines filtering through fragmented, outdated postings, while property managers struggle to broadcast their capacities to wider demographics using disjointed tools. 
Although numerous digital portals have surfaced to digitize this sector, a significant margin of these services exhibit critical software vulnerabilities. Often, legacy systems lock their viewports to rigid desktop dimensions, alienating mobile users. Concurrently, many platforms process payments with dangerously naive logic—trusting client-side calculation variables—and fail to isolate rendering bugs, resulting in full-system crashes (White Screen of Death). 
The absence of a modernized, transactionally secure, and omni-device optimized solution emphasizes the demand for a superior architecture. This thesis outlines the construction of an enriched portal equipped with progressive features: Server-side pricing enforcement, Mobile-first responsive grids, OAuth 2.0 authentication, and asynchronous chunk-loading mechanisms to radically reinvent the property leasing lifecycle. 
 
1.3. Scope and Objectives 
1.3.1. Scope 
This research focuses on engineering a sophisticated web-based architecture to facilitate property leasing negotiations. The core application provides comprehensive features for landlords to publish metadata, execute secure digital renewals via payment gateways, and configure safety parameters. For tenants, it offers frictionless exploration through complex search parameters. Diverging from archaic models, the application strictly employs a Mobile-First Fluid layout strategy, ensuring absolute anatomical adaptability across smartphone viewports, tablets, and desktop monitors, reinforced by fail-safe rendering modules. 
 
1.3.2. Objective 
The primary intention encompasses the systematic delivery of a multifaceted software platform addressing systemic rental operations. Crucial functional objectives feature: 
1. Interface Customization: Implementing an elastic dashboard integrating React Hook Form, enabling landlords to effortlessly digitize parameters (scale, cost, metadata) free of UI compression issues on smaller devices. 
2. Asynchronous Search Engine: Providing advanced data fetching through SWR to power filters parsing price bands, geographic coordinates, and dimensional metrics without browser lag. 
3. Omni-Device Fluidity: Discarding the legacy static 1100px width in favor of dynamic Tailwind CSS `min(1100px, 100vw)` architectures, dynamically stacking visual components across mobile viewports. 
4. Financial Transaction Integrity: Integrating VNPay APIs strictly governed by an ACID-compliant Database Transaction pipeline and Server-side pricing calculations, nullifying the risk of client payload forgery or partial data failures during service renewals. 
5. Identity Modernization: Supplementing standard login credentials with an integrated Google OAuth 2.0 mechanism, guaranteeing safe authorization bypass mechanisms. 
6. Front-End Resilience: Engineering React.lazy() chunk splitting methodologies to optimize Initial Load Time metrics, actively shielded by Global Error Boundaries to eliminate catastrophic rendering crashes. 
 
1.4. Assumption and Solution 
1.4.1. Assumption 
The framework assumes that standard end-users demand immediate, secure, and platform-agnostic environments to explore housing. It is projected that users will predominantly utilize mobile form factors, hence demanding flawless fluid layouts. Technologically, the application leverages contemporary components (Express.js, React, PostgreSQL) operating under the strict assumption that financial exchanges and identity tokens mandate the highest cryptographic security protocols and atomic state preservations. 
 
1.4.2. Solution 
Executing the aforementioned architectural goals involves: 
1. High-Performance Front-end Ecosystem: Replacing monolithic bundling with Vite and React.lazy() module splitting. Interfaces are rendered utilizing Tailwind CSS strictly following a Mobile-first paradigm, enabling automatic Horizontal-to-Vertical stacking on mobile devices. 
2. Bulletproof Payment Integrity: Processing listing extensions via Express.js linked with VNPay. Decisively, the financial total is never ingested from the client; the Server explicitly evaluates the multiplication of Days and DB-stored Tier Rates (Server-Side Calculation). The entire write process is locked via an ACID Transaction to enforce atomicity between fund deduction and status updates. 
3. Authentication Versatility: Supplementing JSON Web Tokens (JWT) and BcryptJS with `@react-oauth/google` to streamline login procedures via Identity Providers, drastically minimizing brute-force vulnerabilities. 
4. Fail-Safe Operations: Establishing a `<GlobalErrorBoundary>` wrapper spanning the root DOM. Minor logic faults trigger isolated fallback UI routes without crashing the entire application context. 
 
1.5. Structure of thesis 
- Chapter 1 – Introduction: Details problem statements, project scopes, and outlines modernization strategies applied to the platform architecture. 
- Chapter 2 – Literature Review: Evaluates the historical paradigm of real-estate markets while surveying frontend, backend, and security technologies employed to resolve concurrent system weaknesses. 
- Chapter 3 – Methodology: Elucidates behavioral analysis, Database schema designs, and algorithmic workflows dictating the project’s infrastructure. 
- Chapter 4 – Implementation and Results: Visualizes the tangible software deployed, showcasing Mobile-responsive adjustments, Admin dashboards, and OAuth portals. 
- Chapter 5 – Discussion and Evaluation: Benchmarks the delivered architecture against existing legacy systems (e.g., Phongtro123.com), stressing the advantages of transactional security and performance caching. 
- Chapter 6 – Conclusion and Future Work: Summarizes the delivered implementations and proposes further predictive machine algorithms for future scaling. 
 
CHAPTER 2. LITERATURE REVIEW 
 
2.1. Room Rental Websites 
The digital metamorphosis of accommodation platforms has witnessed aggressive transitions. Initiated empirically by entities like VRBO (1995) and Craigslist, the paradigm was fundamentally restructured by monolithic entities such as Booking.com and Airbnb. In Vietnam, Phongtro123.com initiated a localized wave in 2015, accelerating property matching operations. However, contemporary standards command drastic structural upgrades concerning responsive design and automated transactional precision, demanding platforms to exceed basic matching algorithms and provide fortified operational lifecycles. 
 
2.2. Techniques 
Frontend Frameworks & Resiliency: 
- ReactJS & Vite: Act as the structural backbone, further enhanced by `Suspense` and `React.lazy()` for aggressive asynchronous chunk downloading. 
- Tailwind CSS: Enforces deterministic, utility-first styling ensuring highly adaptable Fluid Layout behavior for instantaneous viewport adjustments. 
- Global Error Boundaries: React’s class-component feature utilized specifically to isolate component crashes and shield overall UI integrity. 
Backend Logistics & Safety: 
- Express.js & PostgreSQL: The core environment handling RESTful architectures, backed by Sequelize ORM for data definition. 
- ACID Transactions: A relational database protocol ensuring logical atomicity; implemented explicitly within payment handlers to synchronize account deductions with listing promotions. 
- Server-Side Calculation: An architectural pattern actively discarding untrusted client mathematical inputs during financial processing. 
Identity Verification: 
- OAuth 2.0 (Google Auth): Grants authenticated token issuance via Google's centralized Identity engines, decreasing localized password mismanagement. 
 
CHAPTER 3. METHODOLOGY 
 
3.1. System Designs 
The architectural blueprint commands a multi-tier paradigm executing clean segregation of computational concerns. The front-end is fortified with Zustand for state retention and heavily compartmentalized using Code Splitting techniques. Interaction with the back-end is facilitated by Axios polling against precise Express.js API endpoints. Security rests on a bipartite mechanism: JWT generation combined with OAuth token parsers. 
Simultaneously, Postgres acts as the persistence layer where critical updates are funneled through strict Mutex-like ACID Transaction blocks. This structural rigor ensures maximum protection against concurrency anomalies during high-traffic load phases. 
[Note: Diagrams and tables reflecting Use-cases (Admin, Tenant, Landlord) and DB structures parallel the initial document context but operate strictly under these optimized validation rules]. 
 
CHAPTER 4. IMPLEMENT AND RESULTS 
 
4.1. Implement 
Implementation strategies revolved around eliminating legacy bottleneck operations. Unlike previous iterations locked to a static 1100px width, the CSS rulesets dynamically collapse Sidebars (`hidden lg:block`) when triggered by mobile CSS media queries. Consequently, complex PostCards gracefully shuffle from Flex-Row to Flex-Col schemas on diminutive devices. Furthermore, HTTP calls dealing with monetary exchanges exclusively demand UUIDs; calculating algorithms were rigidly migrated to the Express.js Controllers. 
 
4.2. Result 
The final graphical iteration successfully displays the culmination of these applied methodologies. Users navigating the Homepage on a mobile device experience an untampered, non-overflowing interface. Property listings automatically adapt to vertical scrolling habits. 
At the authorization portal, users are presented with standard email/password forms alongside an integrated Google Login button, providing rapid bypass logic leveraging valid Google Credentials. 
In the Landlord Dashboard, during the VNPay top-up and renewal procedures, visual confirmations illustrate correct financial deduction. Under the hood, any disconnection during this particular window is automatically compensated by Transaction Rollbacks, ensuring complete user trust in the economic mechanisms of the application. 
 
CHAPTER 5. DISCUSSION AND EVALUATION 
 
4.3. Discussion 
Engineering this multidimensional web application necessitated aggressive overhauls compared to standard scholastic web prototypes. Currently exiting the beta validation phase, the system operates seamlessly across variable environments. The utilization of complex architectural logic—most notably Error Isolation, Server-guided checkout math, and Fluid Layout mechanics—firmly distinguishes the application from basic CRUD iterations. 
 
4.4. Comparison 
Evaluating the prototype against established behemoths like Phongtro123.com exposes critical competitive differences. While the latter possesses substantial historical data clustering and traffic volume, our thesis project demonstrates structural superiority in specialized domains. Primarily, the integration of absolute Fluid Layouts ensures our solution looks impeccably native on smartphone browsers, whereas legacy competitors occasionally force horizontal scrolling limits. Furthermore, integrating robust logic at the checkout tier prevents any manipulation of cart totals, a vulnerability often overlooked in burgeoning startup platforms. 
 
4.5. Evaluation 
The deployed integration validates a rigorous commitment to robust data security and omni-device accessibility. Moving away from naïve frontend-trust architectures exponentially raised the application’s reliability profile. Additionally, the admin oversight tools and visual presentation matrices have empirically improved operational analysis capacities. Despite potential demands for broader stress-testing regarding thousands of concurrent connections, the foundational principles introduced securely elevate this project beyond standard undergraduate models. 
 
CHAPTER 6. CONCLUSION AND FUTURE WORK 
 
4.6. Conclusion 
The architectural implementations documented herein validate the necessity of blending standard rental matching business logic with enterprise-grade component safety. Overcoming fundamental Single Page Application weaknesses via Lazy Loading and stabilizing financial exchanges through strict ACID databases represents a monumental upgrade over conventional designs. The platform reliably coordinates interaction between administrators, tenants, and property owners in a highly secure digital environment. 
 
4.7. Future work 
Moving forward, integrating predictive Machine Learning frameworks to algorithmically correlate tenant behavioral histories with specialized real-estate suggestions poses immense potential. Additionally, constructing a native mobile counterpart leveraging frameworks like React Native, whilst utilizing the exact same fortified backend APIs, would seamlessly extend the ecosystem's reach and commercial viability within the fiercely competitive real-estate digital market. 
 
REFERENCES 
[Relevant academic and technical citations as originally documented, supporting Tailwind, React.js, OAuth 2.0, PostgreSQL, and ACID transaction principles]
