

const TermsOfService = () => {
 return (
 <div className="max-w-4xl mx-auto py-10 px-4 animate-none">
 <div className="mb-10 text-center">
 <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Terms of Service</h1>
 <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-widest">Last Updated: March 2026</p>
 </div>

 <div className="space-y-10">
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Platform Use</h2>
 <p className="text-[var(--text-muted)] leading-relaxed mb-4">
 CampusBite connects students with campus food vendors for ordering and pickup.
 </p>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Users must not:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>place fraudulent orders</li>
 <li>misuse vendor services</li>
 <li>attempt to disrupt the platform</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">User Responsibilities</h2>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Users must:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>provide accurate account information</li>
 <li>review orders before placing them</li>
 <li>pick up orders on time</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Vendor Responsibilities</h2>
 <p className="text-[var(--text-primary)] font-semibold mb-2">Vendors must:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>maintain accurate menus</li>
 <li>provide correct pricing</li>
 <li>fulfill orders properly</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Orders and Payments</h2>
 <p className="text-[var(--text-muted)] leading-relaxed">
 Orders are sent to vendors for confirmation. Payment methods depend on campus configuration.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Cancellation Policy</h2>
 <p className="text-[var(--text-muted)] leading-relaxed bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)] inline-block">
 Orders may only be canceled before preparation begins.
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Limitation of Liability</h2>
 <p className="text-[var(--text-muted)] leading-relaxed">
 CampusBite provides the ordering platform but does not prepare food.
 </p>
 </section>
 </div>
 </div>
 );
};

export default TermsOfService;

