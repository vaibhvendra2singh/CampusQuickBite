

const PrivacyPolicy = () => {
 return (
 <div className="max-w-4xl mx-auto py-10 px-4 animate-none">
 <div className="mb-10 text-center">
 <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Privacy Policy</h1>
 <p className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-widest">Last Updated: March 2026</p>
 </div>

 <p className="text-[var(--text-muted)] text-lg mb-10 leading-relaxed text-center max-w-2xl mx-auto">
 CampusBite respects your privacy and is committed to protecting your personal information.
 </p>

 <div className="space-y-10">
 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 flex items-center"><span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mr-3 text-sm">01</span> Information We Collect</h2>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Account Information</h3>
 <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
 <li>Name</li>
 <li>Email</li>
 <li>Login credentials</li>
 </ul>
 </div>
 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Order Information</h3>
 <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
 <li>Items ordered</li>
 <li>Vendor selected</li>
 <li>Order history</li>
 </ul>
 </div>
 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Device Information</h3>
 <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)]">
 <li>Browser type</li>
 <li>Device information</li>
 <li>Usage logs</li>
 </ul>
 </div>
 </div>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 flex items-center"><span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mr-3 text-sm">02</span> How We Use Your Information</h2>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2">
 <li>process food orders</li>
 <li>show order history</li>
 <li>allow vendors to fulfill orders</li>
 <li>provide support</li>
 <li>improve platform performance</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 flex items-center"><span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mr-3 text-sm">03</span> Data Storage and Security</h2>
 <p className="text-[var(--text-muted)] leading-relaxed">
 CampusBite uses secure servers and encrypted communication (HTTPS).
 </p>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 flex items-center"><span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mr-3 text-sm">04</span> Data Sharing with Vendors</h2>
 <p className="mb-3 text-[var(--text-muted)]">When an order is placed vendors receive:</p>
 <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)] ml-2 bg-[var(--bg-input)] p-5 rounded-xl inline-block pr-10">
 <li>order details</li>
 <li>order ID</li>
 <li>selected items</li>
 </ul>
 </section>

 <section>
 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-color)] pb-2 flex items-center"><span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center mr-3 text-sm">05</span> Cookies</h2>
 <p className="text-[var(--text-muted)] leading-relaxed">
 Cookies may be used to maintain login sessions and improve functionality.
 </p>
 </section>
 </div>
 </div>
 );
};

export default PrivacyPolicy;
